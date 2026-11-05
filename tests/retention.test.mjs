import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {previewRetention,retentionCutoff} from '../cloudflare/retention-plan.mjs';
test('one-year preview distinguishes expired records, protects linked recent proofs and deletes nothing',async()=>{
 const db=new DatabaseSync(':memory:');
 db.exec("CREATE TABLE proofs(id TEXT,data TEXT);CREATE TABLE stops(created_at TEXT,proof_id TEXT);CREATE TABLE customers(last_delivered_at TEXT);CREATE TABLE address_locations(updated_at TEXT);");
 const old='2025-10-12T12:00:00.000Z',boundary='2025-10-13T12:00:00.000Z',recent='2026-10-13T12:00:00.000Z';
 for(const [id,time] of [['old',old],['boundary',boundary],['recent',recent]])db.prepare('INSERT INTO proofs VALUES (?,?)').run(id,JSON.stringify({completedAt:time}));
 for(const [time,id] of [[old,'old'],[old,'recent'],[old,null],[boundary,'boundary']])db.prepare('INSERT INTO stops VALUES (?,?)').run(time,id);
 for(const time of [old,boundary,recent]){db.prepare('INSERT INTO customers VALUES (?)').run(time);db.prepare('INSERT INTO address_locations VALUES (?)').run(time);}
 const adapter={prepare(sql){return {bind(...values){return {first:async()=>db.prepare(sql).get(...values)};}};}};
 const result=await previewRetention(adapter,new Date(recent));assert.equal(result.cutoff,boundary);assert.deepEqual(result.counts,{proofs:1,stops:2,customers:1,addressLocations:1});assert.equal(result.deleted,0);assert.equal(db.prepare('SELECT count(*) AS n FROM proofs').get().n,3);assert.equal(db.prepare('SELECT count(*) AS n FROM stops').get().n,4);
 assert.equal(retentionCutoff(new Date('2024-03-01T00:00:00Z')),'2023-03-02T00:00:00.000Z');db.close();
});
