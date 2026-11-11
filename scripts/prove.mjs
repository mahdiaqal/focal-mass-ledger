import fs from 'node:fs';
import {spawn, execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {rpc, receipt, source, read, denied, digest, sha} from './check.mjs';

const main={name:'studio-proof-deployer', address:'0x7a413BB4AB62E31d62d4cD9efC8C8a8Dae37FB42'};
const peer={name:'fairresolve-demo', address:'0x34346773a22564cbcc5F1D67D1c1F9f196DaEA35'};
const file='PROOFS.json', code='contracts/FocalMassLedger.py';
const commit=process.argv[2];
assert(/^[a-f0-9]{40}$/.test(commit??''));
const p=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{network:'StudioNet',source_commit:commit,transactions:[],observations:{}};
assert.equal(p.source_commit,commit);
const save=()=>fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');

function send(args, signer, t) {
 return new Promise((resolve,reject)=>{
  const c=spawn(process.execPath,['scripts/run-cli.cjs',...args],{windowsHide:true,env:{...process.env,FML_TEST_ACCOUNT:signer.name},stdio:['ignore','pipe','pipe']});
  let buf='';c.stderr.resume();
  c.stdout.on('data',b=>{
   buf+=b;const lines=buf.split(/\r?\n/);buf=lines.pop();
   for(const line of lines) if(/^BROADCAST_HASH 0x[0-9a-f]{64}$/i.test(line)){t.hash=line.split(' ')[1];save();console.log(t.step,t.hash);}
  });
  c.on('error',reject);c.on('close',resolve);
 });
}
async function transaction(step,args,signer,expected='SUCCESS',message) {
 let t=p.transactions.find(t=>t.step===step);
 if(!t){
  const nonce=await rpc('eth_getTransactionCount',[signer.address,'latest']);
  assert.equal(await rpc('eth_getTransactionCount',[signer.address,'pending']),nonce);
  t={step,args,nonce,signer:signer.address,expected,...(message?{message}:{})};p.transactions.push(t);save();
  await send(args,signer,t);
 }
 assert.deepEqual(t.args,args);assert.equal(t.signer,signer.address);
 assert(t.hash,'Unknown broadcast outcome. Inspect history; do not rebroadcast.');
 try { t.receipt=await receipt(t.hash,expected,message); }
 catch(e) {
  const raw=await rpc('eth_getTransactionByHash',[t.hash]);
  t.observed={status:raw.status,consensus:raw.result_name,execution:raw.consensus_data?.leader_receipt?.find(x=>x.mode==='leader')?.execution_result};save();throw e;
 }
 save();assert.equal(t.receipt.committed,expected==='SUCCESS');console.log(step,t.receipt.status,t.receipt.execution);
 const native=await rpc('eth_getTransactionByHash',[t.hash]);
 assert.equal(native.from_address.toLowerCase(),signer.address.toLowerCase());assert.equal(BigInt(native.nonce),BigInt(t.nonce));assert.equal(BigInt(native.value),0n);
 return t.receipt.address;
}
assert.equal(await rpc('eth_chainId',[]),'0xf22f');
p.address=await transaction('deploy',['deploy','--contract',code],main);
p.source=await source(p.address);save();


const policy='focal-mass-ledger-v1';
const nonce='conflict-demo';
const frame=['The token is red.','The token is blue.','The token is green.'];
const pool=digest({creator:main.address,contract:p.address,nonce});
assert.equal(await transaction('open-pool',['write',p.address,'open_pool','--args',
 nonce,...frame,main.address+':750;'+peer.address+':1000'],main),p.address);
const roster=[{participant:peer.address,reliability:1000},{participant:main.address,reliability:750}];
const spec={policy,pool_id:pool,contract:p.address,creator:main.address,nonce,alternatives:frame,roster};
const cfg=digest(spec);
assert.deepEqual(await read(p.address,'get_pool',[pool]),{...spec,config_root:cfg});
p.pool={...spec,config_root:cfg};save();

const cases=[
 {name:'red-or-blue',signer:main,vector:['ALLOWS','ALLOWS','EXCLUDES'],mask:3,reliability:750},
 {name:'green',signer:peer,vector:['EXCLUDES','EXCLUDES','ALLOWS'],mask:4,reliability:1000},
];
const withdrawn=p.transactions.some(t=>t.step==='withdraw-green');
let replay;
for(const c of cases){
 const path='examples/'+c.name+'.txt';
 const bytes=execFileSync('git',['-c','safe.directory='+process.cwd().replaceAll('\\','/'),'show',commit+':'+path]);
 const coordinate='mahdiaqal/focal-mass-ledger/'+commit+'/'+path;
 const hash=sha(bytes);
 const args=['write',p.address,'submit','--args',pool,cfg,coordinate,hash];
 if(c.signer===peer)replay=args;
 assert.equal(await transaction('submit-'+c.name,args,c.signer),p.address);
 const result=await read(p.address,'get_opinion',[pool,c.signer.address]);
 p.observations[c.name]=result;save();
 const body=bytes.toString('utf8');
 const report={policy,pool_id:pool,config_root:cfg,participant:c.signer.address,
  source:{url:'https://raw.githubusercontent.com/'+coordinate,sha256:hash},
  body,statement:body.trim(),vector:c.vector,focal_mask:c.mask,status:'INFORMATIVE',reliability:c.reliability};
 assert.deepEqual(result.report,{...report,root:digest(report)},'Unexpected interpretation retained in journal');
 if(!withdrawn||c.signer===main)assert.equal(result.withdrawn,false);
}
function verifySnapshot(snapshot,status,numbers,denominator,entries){
 const expected={policy,pool_id:pool,config_root:cfg,entries,active_count:entries.filter(x=>x.status==='ACTIVE').length,
  mass_numerators:numbers,denominator,status};
 assert.deepEqual(snapshot,{...expected,root:digest(expected)});
}
const entries=roster.map(({participant},i)=>({participant,status:'ACTIVE',
 report_root:p.observations[cases[1-i].name].report.root}));
const before=p.observations.before??await read(p.address,'snapshot',[pool,cfg]);
p.observations.before=before;save();
verifySnapshot(before,'CONFLICTED',['750000','0','0','0','250000','0','0','0'],'1000000',entries);
const greenBounds=p.observations.green_bounds??await read(p.address,'query',[pool,cfg,before.root,4]);
p.observations.green_bounds=greenBounds;save();
assert.deepEqual(greenBounds,{pool_id:pool,config_root:cfg,snapshot_root:before.root,subset_mask:4,status:'CONFLICTED',
 belief_numerator:'250000',plausibility_numerator:'250000',denominator:'1000000',conflict_numerator:'750000',surviving_numerator:'250000'});
console.log('Conflict and Green bounds verified',before.status,before.mass_numerators[0]+'/'+before.denominator);

assert.equal(await transaction('withdraw-green',['write',p.address,'withdraw','--args',pool,cfg],peer),p.address);
const after=await read(p.address,'snapshot',[pool,cfg]);
p.observations.after=after;save();
verifySnapshot(after,'NONCONFLICTING',['0','0','0','750','0','0','0','250'],'1000',
 [{...entries[0],status:'WITHDRAWN'},entries[1]]);
assert.deepEqual(await read(p.address,'get_opinion',[pool,peer.address]),
 {report:p.observations.green.report,withdrawn:true});
const redBounds=await read(p.address,'query',[pool,cfg,after.root,1]);
p.observations.red_bounds=redBounds;save();
assert.deepEqual(redBounds,{pool_id:pool,config_root:cfg,snapshot_root:after.root,subset_mask:1,status:'NONCONFLICTING',
 belief_numerator:'0',plausibility_numerator:'1000',denominator:'1000',conflict_numerator:'0',surviving_numerator:'1000'});
assert(await denied(p.address,'query',[pool,cfg,before.root,1]));
p.observations.stale_snapshot_rejected=true;save();
console.log('Withdrawal and stale snapshot rejection verified');
assert.equal(await transaction('replay-green',replay,peer,'ERROR','Opinion already used'),p.address);
assert.deepEqual(await read(p.address,'snapshot',[pool,cfg]),after);
const history=await rpc('sim_getTransactionsForAddress',[p.address]);
assert.deepEqual(history.map(t=>t.hash).sort(),p.transactions.map(t=>t.hash).sort());
p.verified=true;save();
console.log('Six finalized receipts, source, both snapshots and bounds, and replay rejection verified.');
