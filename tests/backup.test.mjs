import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {encryptBackup,decryptBackup} from '../scripts/backup-codec.mjs';
const target={accountId:'fictional-account',databaseId:'fictional-database',name:'fictional-backup-test'};
async function cleanFixture(dir){const absolute=path.resolve(dir),base=path.resolve(os.tmpdir())+path.sep;if(!absolute.startsWith(base)||!path.basename(absolute).startsWith('marapo24-fictional-backup-'))throw Error('Unexpected cleanup target.');await fs.rm(absolute,{recursive:true,force:true});}
test('encrypted SQL round-trip restores an isolated archive with immutable proof constraints',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'marapo24-fictional-backup-'));
 try{const source=path.join(dir,'source.sql'),backup=path.join(dir,'encrypted.marapo24'),restore=path.join(dir,'restore.sql'),key=crypto.randomBytes(32),schema=await fs.readFile(new URL('../cloudflare/schema.sql',import.meta.url),'utf8');
 const sql=schema+"\nINSERT INTO users VALUES ('fictional-driver','Fiktiver Fahrer','[\"driver\"]',1,0,0);\nINSERT INTO tours(id,date,type,driver_id,created_by,status,created_at) VALUES ('tour','2026-10-13','Fiktiv','fictional-driver','office','running','2026-10-13T00:00:00Z');\nINSERT INTO stops VALUES ('stop','tour','{}','offen','2026-10-13T00:00:00Z',NULL,NULL);\nINSERT INTO proofs VALUES ('proof','tour','stop','fictional-driver','completion','fingerprint','{\"status\":\"zugestellt\",\"name\":\"Erika Muster\",\"completedAt\":\"2026-10-13T00:00:00Z\"}');\n";
 await fs.writeFile(source,sql);await encryptBackup(source,backup,key,target);const encrypted=await fs.readFile(backup);assert.equal(encrypted.includes(Buffer.from('Erika Muster')),false);await decryptBackup(backup,restore,key,target);assert.equal(await fs.readFile(restore,'utf8'),sql);
 const db=new DatabaseSync(':memory:');try{db.exec(await fs.readFile(restore,'utf8'));assert.equal(db.prepare('SELECT count(*) AS n FROM proofs').get().n,1);assert.equal(db.prepare('SELECT status FROM stops').get().status,'zugestellt');assert.throws(()=>db.exec("UPDATE proofs SET data='{}'"));assert.throws(()=>db.exec('DELETE FROM proofs'));}finally{db.close();}
 }finally{await cleanFixture(dir);}
});
test('modified backups, wrong recovery keys and wrong targets fail without leaving readable SQL',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'marapo24-fictional-backup-'));
 try{const source=path.join(dir,'source.sql'),backup=path.join(dir,'backup.marapo24'),restore=path.join(dir,'restore.sql'),key=crypto.randomBytes(32);await fs.writeFile(source,"SELECT 'fictitious';\n");await encryptBackup(source,backup,key,target);
 await assert.rejects(decryptBackup(backup,restore,crypto.randomBytes(32),target));await assert.rejects(fs.stat(restore));await assert.rejects(decryptBackup(backup,restore,key,{...target,databaseId:'other'}));await assert.rejects(fs.stat(restore));
 const bytes=await fs.readFile(backup);bytes[bytes.length-20]^=1;await fs.writeFile(backup,bytes);await assert.rejects(decryptBackup(backup,restore,key,target));await assert.rejects(fs.stat(restore));
 }finally{await cleanFixture(dir);}
});
test('backup and restore never overwrite existing files',async()=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'marapo24-fictional-backup-'));try{const source=path.join(dir,'source.sql'),backup=path.join(dir,'backup.marapo24'),restore=path.join(dir,'restore.sql'),key=crypto.randomBytes(32);await fs.writeFile(source,'SELECT 1;');await encryptBackup(source,backup,key,target);await assert.rejects(encryptBackup(source,backup,key,target));await fs.writeFile(restore,'keep this file');await assert.rejects(decryptBackup(backup,restore,key,target));assert.equal(await fs.readFile(restore,'utf8'),'keep this file');}finally{await cleanFixture(dir);}});
