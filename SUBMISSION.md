# FocalMassLedger — Retractable Set-Valued Evidence

**Contribution type:** Builder → Intelligent Contracts

**Notes / Description**

FocalMassLedger combines evidence that supports sets of alternatives, such as “red or blue,” without forcing a single winner. A pool fixes a frame and roster. Each participant points to a commit-pinned text file. The leader and validators independently download the full bytes, verify SHA-256 and classify every alternative against the actual statement. Consensus requires the same exact report; any UNKNOWN label makes the contribution abstain.

The ledger combines accepted opinions by exact set intersection and keeps contradiction as empty-set mass. Readers get raw belief and plausibility bounds tied to a snapshot root. Contributors can withdraw their own opinion without erasing it, and stale roots are rejected.

StudioNet showed 75% conflict between two opinions, then zero after one participant withdrew. The primitive interprets published statements under declared weights; it does not authenticate authorship or verify real-world truth.

**Evidence URLs**

- [GitHub repository](https://github.com/mahdiaqal/focal-mass-ledger)
- [Exact deployed source](https://github.com/mahdiaqal/focal-mass-ledger/blob/dd3b90183dbdaccf53c5b71d7f2d084585d78f5a/contracts/FocalMassLedger.py)
- [StudioNet contract](https://explorer-studio.genlayer.com/address/0x8816796688ACD348a42f0507dFf8e582E15458D2)
- [Live proof matrix](https://github.com/mahdiaqal/focal-mass-ledger/blob/main/LIVE_PROOFS.md)
- [Deploy contract](https://explorer-studio.genlayer.com/tx/0x750cfc8e8d019671d50eaf03ddebcd32c4519906aef4e449f59d11e1710bc0bb)
- [Submit Red-or-Blue evidence](https://explorer-studio.genlayer.com/tx/0x122c5e9b858e6d1196828fa5cc91b821f0a9c9dcdd30af56747f9e7e5ed67b9b)
- [Submit competing Green evidence](https://explorer-studio.genlayer.com/tx/0x2633a66b785abcd2c35ad2d59abb5c28dcb5fcbc503d0ce0fa07502dad5c7ed5)
- [Withdraw Green evidence](https://explorer-studio.genlayer.com/tx/0xb0ee5720364510bf209cfcba46aeeb959199b588375b0785e4f1ec93de7df75b)
- [Reject replay after withdrawal](https://explorer-studio.genlayer.com/tx/0x5a76a49a953134e88aeedb0a86068544dca48aba3033400b7232744bf9958ba0)
