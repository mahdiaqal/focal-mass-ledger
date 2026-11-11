# FocalMassLedger

Combine claims that support **sets** of alternatives, preserving disagreement instead of picking a winner. For example, “red or blue” puts weight on the joint set; it does not imply an equal split. A conflicting “green” opinion contributes to the explicit empty-set mass.

A pool freezes three alternatives and up to six participant addresses with declared reliability weights. To add an opinion, a roster member points to a commit-pinned public GitHub text file and supplies its SHA-256. The leader and validators independently download the full file, check its hash, then interpret its text against all three alternatives. The exact source-bound report must match. A material ambiguity abstains; unavailable or invalid evidence cannot be published.

Queries return exact raw belief and plausibility bounds and conflict mass. Contributors can withdraw their own opinion; the original report stays readable and current results are recomputed. Queries bind both the configuration and current snapshot roots.

This interprets published text. It does not authenticate authorship, measure source independence, estimate reliability, or establish that a real-world claim is true. See [architecture and math](docs/architecture.md), [GenLayer equivalence](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle) and [web access](https://docs.genlayer.com/developers/intelligent-contracts/features/web-access).

```sh
python -m pip install -r requirements-dev.txt
genvm-lint check contracts/FocalMassLedger.py
python -m pytest tests -q
```

StudioNet deployment and receipts are pending.
