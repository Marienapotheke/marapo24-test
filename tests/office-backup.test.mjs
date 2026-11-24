import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';import {DatabaseSync} from 'node:sqlite';
import {encryptBackup,decryptBackup} from '../scripts/backup-codec.mjs';import {verifyCashArchive} from '../cloudflare/retention.mjs';
test('office migration and encrypted restore preserve historical proof bytes and all archive guards',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'marapo24-office-restore-'));const db=new DatabaseSync(':memory:');
 try{let sql='';for(const name of ['schema.sql','customers-routes.sql','workflow-schema.sql','cash-settlement.sql'])sql+=await fs.readFile(new URL('../cloudflare/'+name,import.meta.url),'utf8')+'\n';
 sql+=`INSERT INTO users VALUES ('driver','Fiktiver Fahrer','["driver"]',1,0,0),('office','Fiktives Büro','["office"]',1,0,0);
 INSERT INTO tours(id,date,type,driver_id,created_by,status,created_at) VALUES ('old','2026-10-15','Fiktiv','driver','office','running','2026-10-15T12:00:00Z');
 INSERT INTO stops VALUES ('old-stop','old','{}','offen','2026-10-15T12:00:00Z',NULL,NULL);
 INSERT INTO proofs VALUES ('old-proof','old','old-stop','driver','old-completion','old-fingerprint','{"status":"zugestellt","completedAt":"2026-10-15T13:00:00Z","note":"Historischer Hinweis"}');
 `;
 db.exec(sql);const original=db.prepare("SELECT data FROM proofs WHERE id='old-proof'").get().data;const migration=await fs.readFile(new URL('../cloudflare/office-workflow.sql',import.meta.url),'utf8');db.exec(migration);db.exec(migration);assert.equal(db.prepare("SELECT data FROM proofs WHERE id='old-proof'").get().data,original);
 sql+=migration+`\nINSERT INTO tours(id,date,type,driver_id,created_by,status,created_at) VALUES ('self','2026-10-16','Fiktive Mitnahme','office','office','running','2026-10-16T10:00:00Z');
 INSERT INTO self_delivery_tours VALUES ('self','office');
 INSERT INTO stops VALUES ('self-stop','self','{}','offen','2026-10-16T10:00:00Z',NULL,NULL);
 INSERT INTO proofs VALUES ('self-proof','self','self-stop','office','completion','fingerprint','{"status":"zugestellt","completedAt":"2026-10-16T11:00:00Z","driverComment":"Fiktiver Abschluss","parcelCount":3,"collectedCents":1000,"origin":"Marienapotheke"}');
 UPDATE tours SET status='finished' WHERE id='self';
 INSERT INTO cash_settlements VALUES ('self','office','settlement','hash',1000,'2026-10-16T10:00:00Z','{"settledByUid":"office","signerIdentity":"authenticated-office-account"}');`;
 const source=path.join(dir,'source.sql'),encrypted=path.join(dir,'archive.encrypted'),restore=path.join(dir,'restored.sql'),key=crypto.randomBytes(32),target={accountId:'fictional',databaseId:'fictional-office',name:'fictional-test'};await fs.writeFile(source,sql);await encryptBackup(source,encrypted,key,target);await decryptBackup(encrypted,restore,key,target);assert.equal((await fs.readFile(encrypted)).includes(Buffer.from('Fiktiver Abschluss')),false);
 const restored=new DatabaseSync(':memory:');try{restored.exec(await fs.readFile(restore,'utf8'));assert.equal(restored.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.deepEqual(restored.prepare('PRAGMA foreign_key_check').all(),[]);assert.equal(verifyCashArchive(restored),1);assert.equal(restored.prepare("SELECT data FROM proofs WHERE id='old-proof'").get().data,original);assert.equal(restored.prepare('SELECT count(*) n FROM self_delivery_tours').get().n,1);assert.throws(()=>restored.exec("UPDATE proofs SET data='{}'"));assert.throws(()=>restored.exec('DELETE FROM proofs'));assert.throws(()=>restored.exec('UPDATE cash_settlements SET collected_cents=1'));assert.throws(()=>restored.exec('DELETE FROM cash_settlements'));}finally{restored.close();}
 }finally{db.close();const resolved=path.resolve(dir);if(!resolved.startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(resolved).startsWith('marapo24-office-restore-'))throw Error('Unexpected local fixture cleanup path');await fs.rm(resolved,{recursive:true,force:true});}
});
