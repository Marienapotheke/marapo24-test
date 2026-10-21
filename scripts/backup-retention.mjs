import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import {DatabaseSync} from 'node:sqlite';import {decryptBackup} from './backup-codec.mjs';import {backupExpiry,oldestBackupData} from '../cloudflare/retention.mjs';
export async function rotateBackups(destination,staging,key,target,{apply=false,now=new Date()}={}){
 const root=path.resolve(destination),temporary=path.resolve(staging);if(root===temporary)throw Error('Rotation staging must be separate');await fs.mkdir(temporary,{recursive:true});
 let inspected=0,expired=0,removed=0;const names=await fs.readdir(root);
 for(const name of names){if(!/^marapo24-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[0-9a-f-]{36}\.encrypted$/.test(name))continue;const file=path.resolve(root,name);if(path.dirname(file)!==root)throw Error('Rotation target outside backup directory');const stat=await fs.lstat(file);if(!stat.isFile()||stat.isSymbolicLink())throw Error('Unsafe backup file');
  const restore=path.join(temporary,crypto.randomUUID()+'.rotation.sql');let metadata,expiry;
  try{metadata=await decryptBackup(file,restore,key,target,{allowExpired:true});const db=new DatabaseSync(':memory:');try{db.exec(await fs.readFile(restore,'utf8'));if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Backup archive damaged');expiry=backupExpiry(metadata.createdAt,oldestBackupData(db));if(metadata.expiresAt)expiry=new Date(Math.min(Date.parse(expiry),Date.parse(metadata.expiresAt))).toISOString();}finally{db.close();}}finally{await fs.unlink(restore).catch(e=>{if(e.code!=='ENOENT')throw e;});}
  inspected++;if(Date.parse(expiry)>+now)continue;expired++;
  const secretFile=file+'.secrets',secretRestore=path.join(temporary,crypto.randomUUID()+'.rotation.secrets');let hasSecrets=false;
  try{const secretStat=await fs.lstat(secretFile);if(!secretStat.isFile()||secretStat.isSymbolicLink())throw Error('Unsafe secret backup');hasSecrets=true;await decryptBackup(secretFile,secretRestore,key,{...target,kind:'backend-secrets-v1'},{allowExpired:true});}catch(e){if(e.code!=='ENOENT')throw e;}finally{await fs.unlink(secretRestore).catch(e=>{if(e.code!=='ENOENT')throw e;});}
  if(apply){if(hasSecrets)await fs.unlink(secretFile);await fs.unlink(file);removed++;}
 }
 return {inspected,expired,removed,mode:apply?'apply':'preview',checkedAt:now.toISOString()};
}
