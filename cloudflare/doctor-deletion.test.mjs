import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {DatabaseSync} from 'node:sqlite';
import {packageData} from './domain.mjs';import {totalParcels,parcelDescription} from './stop-details.mjs';import {validateCompletion} from './completion-policy.mjs';import {deleteOwnTour} from './tour-deletion.mjs';
const parcel={tourId:'t',type:'arzt',origin:'Marienapotheke',name:'Fiktive Praxis',street:'Musterweg 1',postalCode:'54321',city:'Musterstadt',cents:0};
test('physician deliveries need neither count nor signature, remain excluded even with historical counts; other recipient types retain counts',()=>{
 for(const value of [undefined,3,999,null])assert.equal(packageData({...parcel,parcelCount:value},{}).parcelCount,1);
 assert.equal(totalParcels([{type:'arzt',parcelCount:100},{type:'arzt'},{type:'privat',parcelCount:3},{type:'pflege',parcelCount:2}]),5);assert.match(parcelDescription({type:'arzt'}),/nicht in der Päckchensumme/);
 const tour={id:'t',driverId:'a',schemaVersion:2},stop={type:'arzt',schemaVersion:2,status:'offen'},input={tourId:'t',stopId:'s',status:'zugestellt'};validateCompletion(input,'a',tour,stop,null);assert.throws(()=>validateCompletion(input,'a',tour,stop,'data:image/png;base64,YWJj'));
 assert.throws(()=>packageData({...parcel,type:'privat',parcelCount:0},{}));
});
async function fixture(){const db=new DatabaseSync(':memory:');for(const file of ['schema.sql','customers-routes.sql','workflow-schema.sql','cash-settlement.sql','office-workflow.sql','work-starts.sql','delivery-amendments.sql','tour-handover.sql','tour-deletion.sql'])db.exec(await fs.readFile(new URL(file,import.meta.url),'utf8'));
 db.exec(`INSERT INTO users VALUES('owner','Fiktiv Büro','["office"]',1,0,0),('other','Fiktiv Anderer','["office"]',1,0,0);
 INSERT INTO tours(id,date,type,created_by,driver_id,status,created_at) VALUES('t','2026-10-16','Fiktive Mitnahme','owner','owner','open','2026-10-16T08:00:00Z');
 INSERT INTO self_delivery_tours VALUES('t','owner');
 INSERT INTO stops VALUES('s','t','{"type":"arzt","cents":0}','offen','2026-10-16T08:01:00Z',NULL,NULL);
 INSERT INTO tour_orders VALUES('t','["s"]',1,'2026-10-16T08:01:00Z');`);
 const adapter={prepare(sql){return {bind(...values){return {first:async()=>db.prepare(sql).get(...values),run:async()=>({meta:{changes:db.prepare(sql).run(...values).changes}})};}};}};
 const input=()=>({tourId:'t',baseRevision:db.prepare("SELECT revision FROM tour_activity_versions WHERE tour_id='t'").get()?.revision||0,expectedDriverId:db.prepare("SELECT driver_id FROM tours WHERE id='t'").get()?.driver_id||null});
 return {db,adapter,input};
}
const office={active:true,roles:['office']};
test('only creator deletes unstarted tour; prepared stops, order, private mapping and activity are removed atomically and retry is safe',async()=>{const f=await fixture();try{
 await assert.rejects(deleteOwnTour(f.adapter,'other',office,f.input()),e=>e.code==='permission-denied');const input=f.input();assert.equal((await deleteOwnTour(f.adapter,'owner',office,input)).deleted,true);for(const table of ['tours','stops','tour_orders','self_delivery_tours','tour_activity_versions'])assert.equal(f.db.prepare('SELECT count(*) n FROM '+table).get().n,0);assert.equal((await deleteOwnTour(f.adapter,'owner',office,input)).deleted,true);
 }finally{f.db.close();}});
test('start, stale revisions or changed driver block deletion without losing children; trigger failure rolls back the full deletion',async()=>{const f=await fixture();try{
 const stale=f.input();f.db.exec("UPDATE stops SET data=json_set(data,'$.note','Fiktiv geändert') WHERE id='s'");await assert.rejects(deleteOwnTour(f.adapter,'owner',office,stale));
 const wrongDriver={...f.input(),expectedDriverId:'other'};await assert.rejects(deleteOwnTour(f.adapter,'owner',office,wrongDriver));
 f.db.exec("CREATE TRIGGER fictional_delete_failure BEFORE DELETE ON stops BEGIN SELECT RAISE(ABORT,'fictional rollback'); END;");await assert.rejects(deleteOwnTour(f.adapter,'owner',office,f.input()));assert.equal(f.db.prepare('SELECT count(*) n FROM tour_orders').get().n,1);assert.equal(f.db.prepare('SELECT count(*) n FROM stops').get().n,1);assert.equal(f.db.prepare('SELECT count(*) n FROM tours').get().n,1);f.db.exec('DROP TRIGGER fictional_delete_failure');
 f.db.exec("UPDATE tours SET status='running',started_at='2026-10-16T09:00:00Z' WHERE id='t'");await assert.rejects(deleteOwnTour(f.adapter,'owner',office,f.input()));assert.equal(f.db.prepare('SELECT count(*) n FROM stops').get().n,1);
 }finally{f.db.close();}});
