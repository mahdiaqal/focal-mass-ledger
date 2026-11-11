import fs from 'node:fs';
import assert from 'node:assert/strict';

const proof=JSON.parse(fs.readFileSync('PROOFS.json','utf8'));
const {address,source_commit:commit,source,transactions,observations:o}=proof;
assert(proof.verified && source.source_match && o.stale_snapshot_rejected);
assert.equal(transactions.length,6);
assert(transactions.every(t=>t.receipt.status==='FINALIZED' && t.receipt.consensus==='MAJORITY_AGREE'));
const explorer='https://explorer-studio.genlayer.com';
const repo='https://github.com/mahdiaqal/focal-mass-ledger';
const label={'deploy':'Deploy contract','open-pool':'Freeze alternatives and roster',
 'submit-red-or-blue':'Submit Red-or-Blue evidence','submit-green':'Submit competing Green evidence',
 'withdraw-green':'Withdraw Green evidence','replay-green':'Reject replay after withdrawal'};
const tx=t=>'['+label[t.step]+']('+explorer+'/tx/'+t.hash+')';
const table=transactions.map(t=>'| '+tx(t)+' | '+t.receipt.execution+' | '+t.receipt.agree_votes+' |').join('\n');
const markdown=[
 '# StudioNet proof matrix','',
 '- [Explorer contract]('+explorer+'/address/'+address+')',
 '- [Deployed source commit]('+repo+'/blob/'+commit+'/contracts/FocalMassLedger.py)',
 '- Contract source SHA-256 (LF): '+source.sha256,
 '- [Machine-readable receipts, source and readbacks](PROOFS.json)','',
 '| Finalized transaction | Leader execution | Agree votes |','|---|---|---:|',table,'',
 'The two evidence submissions used separate roster accounts. Full pinned source bodies, byte digests, semantic labels and report roots matched onchain readbacks.',
 '',
 '| Readback | Result |','|---|---|',
 '| After both submissions | CONFLICTED: 750000/1000000 empty-set mass; 250000/1000000 on Green |',
 '| Query Green during conflict | Raw belief and plausibility both 250000/1000000 |',
 '| After Green withdrawal | NONCONFLICTING: 750/1000 on Red-or-Blue; 250/1000 on the whole frame |',
 '| Query Red after withdrawal | Raw belief 0/1000; plausibility 1000/1000 |',
 '| Previous snapshot root | Rejected after withdrawal |',
 '| Withdrawn report | Still readable; identical report root |',
 '| Replay | Expected execution error, no state change |','',
 'Tests cover source hash mismatch, unlisted senders, validator refetch and disagreement, abstention, total conflict, and 13,824 exact combinations. The live proof uses synthetic published claims. Reliability and source independence are assumptions.','',
].join('\n');
fs.writeFileSync('LIVE_PROOFS.md',markdown);
const notes="FocalMassLedger combines evidence that supports sets of alternatives, such as “red or blue,” without forcing a single winner. A pool fixes a frame and roster. Each participant points to a commit-pinned text file. The leader and validators independently download the full bytes, verify SHA-256 and classify every alternative against the actual statement. Consensus requires the same exact report; any UNKNOWN label makes the contribution abstain.\n\nThe ledger combines accepted opinions by exact set intersection and keeps contradiction as empty-set mass. Readers get raw belief and plausibility bounds tied to a snapshot root. Contributors can withdraw their own opinion without erasing it, and stale roots are rejected.\n\nStudioNet showed 75% conflict between two opinions, then zero after one participant withdrew. The primitive interprets published statements under declared weights; it does not authenticate authorship or verify real-world truth.";
assert(notes.length<=1000);
const submission=[
 '# FocalMassLedger — Retractable Set-Valued Evidence','',
 '**Contribution type:** Builder → Intelligent Contracts','',
 '**Notes / Description**','',notes,'',
 '**Evidence URLs**','',
 '- [GitHub repository]('+repo+')',
 '- [Exact deployed source]('+repo+'/blob/'+commit+'/contracts/FocalMassLedger.py)',
 '- [StudioNet contract]('+explorer+'/address/'+address+')',
 '- [Live proof matrix]('+repo+'/blob/main/LIVE_PROOFS.md)',
 ...transactions.filter(t=>t.step!=='open-pool').map(t=>'- '+tx(t)),'',
].join('\n');
fs.writeFileSync('SUBMISSION.md',submission);
