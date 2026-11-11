import ast
import hashlib
import itertools
import json
from pathlib import Path
from types import SimpleNamespace

import pytest


SOURCE = Path(__file__).resolve().parents[1] / "contracts/FocalMassLedger.py"
FRAME = ["The token is red.", "The token is blue.", "The token is green."]
CLAIM = "The hypothetical token is red or blue. It is not green.\n"
GREEN = "The hypothetical token is green. It is neither red nor blue.\n"
LABELS = ["ALLOWS", "ALLOWS", "EXCLUDES"]
A = "0x" + "1" * 40
PATH = "sample/claims/" + "a" * 40 + "/claim.txt"
URL = "https://raw.githubusercontent.com/" + PATH


def sha(body):
    return hashlib.sha256(body.encode()).hexdigest()


@pytest.fixture
def core():
    module = ast.parse(SOURCE.read_text(encoding="utf-8"))
    module.body = [
        node for node in module.body
        if not isinstance(node, (ast.ImportFrom, ast.ClassDef))
    ]
    ns = {}
    exec(compile(module, str(SOURCE), "exec"), ns)
    return ns


def test_exact_convolution_exhaustive(core):
    choices = list(itertools.product(range(8), [0, 500, 1000]))
    for triple in itertools.product(choices, repeat=3):
        observed, denominator = core["convolve"]([
            {"focal_mask": mask, "reliability": q} for mask, q in triple
        ])
        expected = [0] * 8
        for selectors in itertools.product([False, True], repeat=3):
            outcome, weight = 7, 1
            for (mask, q), selected in zip(triple, selectors):
                outcome &= mask if selected else 7
                weight *= q if selected else 1000 - q
            expected[outcome] += weight
        assert observed == expected and sum(observed) == denominator == 10**9


def spec():
    return {"pool_id": "demo", "config_root": "cfg", "alternatives": FRAME,
            "roster": [{"participant": A, "reliability": 750}]}


def test_validators_refetch_and_reject_rehashed_label_swap(core):
    fetches, prompts = [], []
    bodies = iter([CLAIM, CLAIM, CLAIM, GREEN])
    source = {"url": URL, "sha256": sha(CLAIM)}

    def get(url):
        fetches.append(url)
        return SimpleNamespace(status=200, body=next(bodies).encode())

    def llm(prompt, response_format):
        prompts.append(prompt)
        assert response_format == "json"
        assert all(text in prompt for text in [*FRAME, CLAIM.strip()])
        return {"vector": LABELS}

    def execute(leader, validator):
        report = leader()
        assert validator(SimpleNamespace(calldata=report))
        forged = core["report_for"](spec(), A, source, CLAIM, ["EXCLUDES", "ALLOWS", "ALLOWS"])
        assert not validator(SimpleNamespace(calldata=forged))
        assert not validator(SimpleNamespace(calldata=report))
        return report

    core["gl"] = SimpleNamespace(
        nondet=SimpleNamespace(web=SimpleNamespace(get=get), exec_prompt=llm),
        vm=SimpleNamespace(Return=SimpleNamespace, UserError=ValueError, run_nondet_unsafe=execute),
    )
    assert core["interpret"](spec(), A, source)["focal_mask"] == 3
    assert fetches == [URL] * 4 and len(prompts) == 3


@pytest.mark.parametrize("position", range(3))
def test_unknown_abstains(core, position):
    labels = LABELS[:]
    labels[position] = "UNKNOWN"
    report = core["report_for"](spec(), A, {"url": URL, "sha256": sha(CLAIM)}, CLAIM, labels)
    assert report["status"] == "ABSTAINED" and report["focal_mask"] == 7
    masses, denominator = core["convolve"]([report])
    assert masses == [0] * 7 + [denominator]


def test_total_conflict_retains_mass(core):
    masses, denominator = core["convolve"]([
        {"focal_mask": 3, "reliability": 1000}, {"focal_mask": 4, "reliability": 1000}
    ])
    assert masses == [denominator] + [0] * 7
    assert core["bounds"](masses, denominator, 7) == {
        "belief_numerator": "0", "plausibility_numerator": "0", "denominator": "1000000",
        "conflict_numerator": "1000000", "surviving_numerator": "0",
    }


def test_live_state_transitions_in_direct_vm(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract = direct_deploy(str(SOURCE))
    direct_vm.sender = direct_alice
    alice, bob = ("0x" + a.hex() if isinstance(a, bytes) else str(a) for a in (direct_alice, direct_bob))
    pool = contract.open_pool("demo", *FRAME, f"{alice}:750;{bob}:1000")
    cfg = contract.get_pool(pool)["config_root"]
    green_path = PATH.replace("claim.txt", "green.txt")
    for suffix, body in (("claim", CLAIM), ("green", GREEN)):
        direct_vm.mock_web(r"https://raw\.githubusercontent\.com/.*/" + suffix + r"\.txt", {
            "response": {"status": 200, "headers": {}, "body": body.encode()}, "method": "GET",
        })
    direct_vm.mock_llm(r".*The hypothetical token is red or blue.*", json.dumps({"vector": LABELS}))
    direct_vm.mock_llm(r".*The hypothetical token is green.*", json.dumps({"vector": ["EXCLUDES", "EXCLUDES", "ALLOWS"]}))

    with direct_vm.expect_revert("Invalid pinned coordinate"):
        contract.submit(pool, cfg, "unversioned", sha(CLAIM))
    with direct_vm.expect_revert("Pinned statement unavailable or invalid"):
        contract.submit(pool, cfg, PATH, sha(GREEN))
    assert contract.snapshot(pool, cfg)["status"] == "EMPTY"
    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("Not a roster participant"):
        contract.submit(pool, cfg, PATH, sha(CLAIM))

    direct_vm.sender = direct_alice
    contract.submit(pool, cfg, PATH, sha(CLAIM))
    direct_vm.sender = direct_bob
    contract.submit(pool, cfg, green_path, sha(GREEN))
    before = contract.snapshot(pool, cfg)
    assert before["status"] == "CONFLICTED"
    assert before["mass_numerators"] == ["750000", "0", "0", "0", "250000", "0", "0", "0"]
    contract.withdraw(pool, cfg)
    with direct_vm.expect_revert("Opinion already used"):
        contract.submit(pool, cfg, green_path, sha(GREEN))
    after = contract.snapshot(pool, cfg)
    assert after["status"] == "NONCONFLICTING"
    assert after["mass_numerators"] == ["0", "0", "0", "750", "0", "0", "0", "250"]
    assert contract.get_opinion(pool, bob)["withdrawn"]
    assert contract.query(pool, cfg, after["root"], 1)["plausibility_numerator"] == "1000"
    with direct_vm.expect_revert("Snapshot root mismatch"):
        contract.query(pool, cfg, before["root"], 1)
