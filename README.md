# FocalMassLedger

Combine claims that support **sets** of alternatives, preserving disagreement instead of picking a winner. For example, “red or blue” puts weight on the joint set; it does not imply an equal split. A conflicting “green” opinion contributes to the explicit empty-set mass.

A pool freezes three alternatives and up to six participant addresses with declared reliability weights. To add an opinion, a roster member points to a commit-pinned public GitHub text file and supplies its SHA-256. The leader and validators independently download the full file, check its hash, then interpret its text against all three alternatives. The exact source-bound report must match. An UNKNOWN label yields an abstention; unavailable or invalid evidence cannot be published.

Queries return exact raw belief and plausibility bounds and conflict mass. Contributors can withdraw their own opinion; the original report stays readable and current results are recomputed. Queries bind both the configuration and current snapshot roots.

This interprets published text. It does not authenticate authorship, measure source independence, estimate reliability, or establish that a real-world claim is true. See [architecture and math](docs/architecture.md), [GenLayer equivalence](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle) and [web access](https://docs.genlayer.com/developers/intelligent-contracts/features/web-access).

## Contract calls

1. Call `open_pool(nonce, a, b, c, participants)` with semicolon-separated `address:weight` pairs. Weights are integers from 0 through 1000. Use the returned pool ID to obtain its configuration root via `get_pool`.
2. As a listed participant, call `submit(pool_id, config_root, coordinate, sha256)`. Use an `owner/repo/40-character-commit/path.txt` coordinate and hash the entire UTF-8 file, including any trailing newline.
3. Read `snapshot(pool_id, config_root)` and pass its root to `query(pool_id, config_root, snapshot_root, subset_mask)`. The three alternatives have bits 1, 2, and 4. For example, mask 3 represents the first or second alternative.
4. Call `withdraw(pool_id, config_root)` from the submitting account. Refresh the snapshot before querying again. `get_opinion` still returns the original report with a withdrawal flag.

```sh
python -m pip install -r requirements-dev.txt
genvm-lint check contracts/FocalMassLedger.py
python -m pytest tests -q
```

[StudioNet contract](https://explorer-studio.genlayer.com/address/0x8816796688ACD348a42f0507dFf8e582E15458D2) · [Live proof matrix](LIVE_PROOFS.md) · [Submission text](SUBMISSION.md)
