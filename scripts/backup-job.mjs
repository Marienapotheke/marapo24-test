// Trusted operator command. No credentials or customer data are logged.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {encryptBackup,decryptBackup} from './backup-codec.mjs';
import {rotateBackups} from './backup-retention.mjs';
import {RETENTION_POLICY,backupExpiry,oldestBackupData} from '../cloudflare/retention.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const jobFile=process.argv[2];if(!jobFile)throw Error('A private backup job configuration is required.');
const job=JSON.parse(await fs.readFile(path.resolve(jobFile),'utf8'));
for(const name of ['wranglerBin','workerConfig','authDirectory','destination','recoveryKeyFile'])if(typeof job[name]!=='string'||!path.isAbsolute(job[name]))throw Error('Backup paths must be absolute.');
const sourceConfig=JSON.parse(await fs.readFile(job.workerConfig,'utf8')),database=sourceConfig.d1_databases?.find(d=>d.binding==='DB');
const target={accountId:sourceConfig.account_id,databaseId:database?.database_id,name:database?.database_name};
if(JSON.stringify(target)!==JSON.stringify(job.expectedTarget)||!['marapo24-protected-test','marapo24-botendienst'].includes(target.name))throw Error('Source database is not the reviewed isolated MARAPO24 database.');
const keyData=JSON.parse(await fs.readFile(job.recoveryKeyFile,'utf8')),key=Buffer.from(keyData.key,'base64');if(keyData.version!==1||key.length!==32)throw Error('Invalid recovery key.');
const staging=path.join(root,'.backups'),id=crypto.randomUUID(),sql=path.join(staging,id+'.sql'),restore=path.join(staging,id+'.restore.sql');
await fs.mkdir(staging,{recursive:true});await fs.mkdir(job.destination,{recursive:true});
const lockPath=path.join(staging,'backup.lock');let lock;
try{lock=await fs.open(lockPath,'wx',0o600);}catch{throw Error('Another backup is running, or its lock requires review.');}
const statusFile=path.join(staging,'last-backup-status.json');
async function wrangler(){return new Promise((resolve,reject)=>{const child=spawn(process.execPath,[job.wranglerBin,'d1','export',target.name,'--remote','--output',sql,'--config',job.workerConfig],{cwd:root,windowsHide:true,env:{...process.env,XDG_CONFIG_HOME:job.authDirectory,CLOUDFLARE_ACCOUNT_ID:target.accountId,WRANGLER_SEND_METRICS:'false',NO_COLOR:'1'}});let output='';child.stdout.on('data',b=>{if(output.length<100000)output+=b.toString();});child.stderr.on('data',b=>{if(output.length<100000)output+=b.toString();});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('Cloudflare export failed; no completed backup created.')));});}
let backup,pendingBackup;
try{
 const retentionActive=job.retentionPolicy===RETENTION_POLICY;
 const rotation=retentionActive?await rotateBackups(job.destination,staging,key,target,{apply:true}):null;
 await wrangler();const stamp=new Date().toISOString().replace(/[:.]/g,'-');backup=path.join(job.destination,'marapo24-'+stamp+'-'+id+'.encrypted');
 let expiresAt;if(retentionActive){const sourceDb=new DatabaseSync(':memory:');try{sourceDb.exec(await fs.readFile(sql,'utf8'));expiresAt=backupExpiry(new Date().toISOString(),oldestBackupData(sourceDb));}finally{sourceDb.close();}}
 pendingBackup=backup+'.pending';const metadata=await encryptBackup(sql,pendingBackup,key,target,{expiresAt});await decryptBackup(pendingBackup,restore,key,target);
 const db=new DatabaseSync(':memory:');let counts;
 try{db.exec(await fs.readFile(restore,'utf8'));if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok'||db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Restored archive integrity check failed.');counts={users:db.prepare('SELECT count(*) AS n FROM users').get().n,tours:db.prepare('SELECT count(*) AS n FROM tours').get().n,stops:db.prepare('SELECT count(*) AS n FROM stops').get().n,proofs:db.prepare('SELECT count(*) AS n FROM proofs').get().n};const triggers=db.prepare("SELECT name FROM sqlite_master WHERE type='trigger'").all().map(r=>r.name);if(!['proof_insert_guard','proof_apply','proof_immutable_update','proof_immutable_delete'].every(n=>triggers.includes(n)))throw Error('Proof protections missing from restored archive.');}finally{db.close();}
 let secretsBackup;if(job.backendSecretsFile){if(!path.isAbsolute(job.backendSecretsFile))throw Error('Secret backup path must be absolute.');secretsBackup=backup+'.secrets';const restoredSecrets=path.join(staging,id+'.secrets.restore.json'),secretsTarget={...target,kind:'backend-secrets-v1'};try{await encryptBackup(job.backendSecretsFile,secretsBackup+'.pending',key,secretsTarget,{expiresAt});await decryptBackup(secretsBackup+'.pending',restoredSecrets,key,secretsTarget);const expected=await fs.readFile(job.backendSecretsFile),actual=await fs.readFile(restoredSecrets);if(!expected.equals(actual))throw Error('Secret recovery check failed.');await fs.rename(secretsBackup+'.pending',secretsBackup);}finally{await fs.unlink(restoredSecrets).catch(e=>{if(e.code!=='ENOENT')throw e;});}}
 await fs.rename(pendingBackup,backup);pendingBackup=null;
 const status={success:true,checkedAt:new Date().toISOString(),file:backup,secretsFile:secretsBackup,createdAt:metadata.createdAt,expiresAt:metadata.expiresAt,rotation,sha256:metadata.sha256,counts};await fs.writeFile(statusFile,JSON.stringify(status,null,2));console.log(JSON.stringify(status));
}catch(e){await fs.writeFile(statusFile,JSON.stringify({success:false,checkedAt:new Date().toISOString(),message:'Backup failed. Last successful backups were not overwritten.'},null,2));throw e;}
finally{key.fill(0);for(const file of [sql,restore,pendingBackup].filter(Boolean))await fs.unlink(file).catch(e=>{if(e.code!=='ENOENT')throw e;});await lock.close();await fs.unlink(lockPath);}
