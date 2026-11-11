# StudioNet proof matrix

- [Explorer contract](https://explorer-studio.genlayer.com/address/0x8816796688ACD348a42f0507dFf8e582E15458D2)
- [Deployed source commit](https://github.com/mahdiaqal/focal-mass-ledger/blob/dd3b90183dbdaccf53c5b71d7f2d084585d78f5a/contracts/FocalMassLedger.py)
- Contract source SHA-256 (LF): e39e72b85a449ae7b4d2c8db0d05fe0c153c9113569fe475f18d519f6f526de1
- [Machine-readable receipts, source and readbacks](PROOFS.json)

| Finalized transaction | Leader execution | Agree votes |
|---|---|---:|
| [Deploy contract](https://explorer-studio.genlayer.com/tx/0x750cfc8e8d019671d50eaf03ddebcd32c4519906aef4e449f59d11e1710bc0bb) | SUCCESS | 3 |
| [Freeze alternatives and roster](https://explorer-studio.genlayer.com/tx/0x0349b978df78907038136caf2dccaf7106a341cfcce62226828aad724a7623af) | SUCCESS | 5 |
| [Submit Red-or-Blue evidence](https://explorer-studio.genlayer.com/tx/0x122c5e9b858e6d1196828fa5cc91b821f0a9c9dcdd30af56747f9e7e5ed67b9b) | SUCCESS | 3 |
| [Submit competing Green evidence](https://explorer-studio.genlayer.com/tx/0x2633a66b785abcd2c35ad2d59abb5c28dcb5fcbc503d0ce0fa07502dad5c7ed5) | SUCCESS | 3 |
| [Withdraw Green evidence](https://explorer-studio.genlayer.com/tx/0xb0ee5720364510bf209cfcba46aeeb959199b588375b0785e4f1ec93de7df75b) | SUCCESS | 3 |
| [Reject replay after withdrawal](https://explorer-studio.genlayer.com/tx/0x5a76a49a953134e88aeedb0a86068544dca48aba3033400b7232744bf9958ba0) | ERROR | 3 |

The two evidence submissions used separate roster accounts. Full pinned source bodies, byte digests, semantic labels and report roots matched onchain readbacks.

| Readback | Result |
|---|---|
| After both submissions | CONFLICTED: 750000/1000000 empty-set mass; 250000/1000000 on Green |
| Query Green during conflict | Raw belief and plausibility both 250000/1000000 |
| After Green withdrawal | NONCONFLICTING: 750/1000 on Red-or-Blue; 250/1000 on the whole frame |
| Query Red after withdrawal | Raw belief 0/1000; plausibility 1000/1000 |
| Previous snapshot root | Rejected after withdrawal |
| Withdrawn report | Still readable; identical report root |
| Replay | Expected execution error, no state change |

Tests cover source hash mismatch, unlisted senders, validator refetch and disagreement, abstention, total conflict, and 13,824 exact combinations. The live proof uses synthetic published claims. Reliability and source independence are assumptions.
