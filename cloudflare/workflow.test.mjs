import {test} from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fixtureRuntime} from './fixture-runtime.mjs';
import {regularTours,localDate} from './domain.mjs';
import {euroCents,localTimestamp,localDateTime,odometer,needsSignature,handover} from './tour-workflow.mjs';
import {sealSignature} from '../offline-store.mjs';
const require=createRequire(import.meta.url),{PNG}=require('../functions/node_modules/pngjs');
const capture=()=>({completionId:crypto.randomUUID(),capturedAt:new Date().toISOString()});
const parcel=(tourId,type='privat')=>({tourId,type,origin:'Marienapotheke',name:'Fiktive Musterperson',street:'Musterweg 1',postalCode:'54321',city:'Musterstadt',cents:0});
test('whole euro entry, German decimals and kilometer validation are unambiguous',()=>{
 assert.match(localTimestamp('2026-10-14T08:30:00Z'),/10:30:00/);assert.match(localTimestamp('2026-12-14T08:30:00Z'),/09:30:00/);assert.equal(localTimestamp(null),'offen');
 assert.deepEqual(localDateTime('2026-10-13T23:30:00Z'),{date:'14.10.2026',time:'01:30'});assert.deepEqual(localDateTime(null),{date:'Noch nicht erfasst',time:'—'});
 for(const [text,expected] of [['5',500],['5,50',550],['5.5',550],['0,05',5],['0',0],['9999',999900]])assert.equal(euroCents(text),expected);
 for(const invalid of ['','-5','5,555','1.000,50','1e2','10000','9999,01'])assert.throws(()=>euroCents(invalid));
 for(const invalid of [-1,NaN,1.5,'100',10000000])assert.throws(()=>odometer(invalid));assert.equal(odometer(0),0);
 assert.equal(needsSignature('privat','zugestellt','mailbox'),false);assert.equal(needsSignature('privat','zugestellt','neighbor'),true);for(const type of ['arzt','pflege','partner'])assert.equal(needsSignature(type,'zugestellt'),false);
 assert.throws(()=>handover({status:'zugestellt',deliveryMethod:'forged'},'privat'));assert.throws(()=>handover({status:'nicht zugestellt',deliveryMethod:'mailbox'},'privat'));
});
test('office prepares one regular tour before driver arrival; stops survive competing claims',async()=>{
 const f=await fixtureRuntime();try{
 const typeId=regularTours(localDate())[0]?.id;const date=typeId?localDate():'2026-10-14',type=typeId||'hunsrueck';
 const inputs={date,typeId:type};const results=await Promise.all(['office','admin'].map(uid=>f.call(uid,'prepareRegularTour',inputs)));assert.deepEqual(results.map(r=>r.status),[200,200]);const tourId=results[0].body.data.tourId;assert.equal(results[1].body.data.tourId,tourId);
 assert.equal((await f.call('driver-a','prepareRegularTour',inputs)).status,403);assert.equal((await f.call('office','createPackage',parcel(tourId))).status,200);assert.equal((await f.call('driver-b','createPackage',parcel(tourId))).status,403);
 if(typeId){const claims=await Promise.all(['driver-a','driver-b'].map(uid=>f.call(uid,'claimRegularTour',inputs)));assert.deepEqual(claims.map(r=>r.status).sort(),[200,409]);assert.equal(claims.find(r=>r.status===200).body.data.tourId,tourId);const winner=claims[0].status===200?'driver-a':'driver-b';const state=await f.call(winner,'state');assert.equal(state.body.data.stops[tourId].length,1);}
 assert.equal((await f.db.prepare('SELECT count(*) n FROM tours WHERE date=? AND regular_type=?').bind(date,type).first()).n,1);
 }finally{await f.runtime.dispose();}
});
test('new tours require km, allow late stops, archive mailbox/neighbor correctly and remain immutable',async()=>{
 const f=await fixtureRuntime();try{
 const tourId=(await f.call('admin','createSpecialTour',{date:localDate(),type:'Fiktiver Ablauf-Test'})).body.data.tourId;assert.equal((await f.call('driver-a','claimSpecialTour',{tourId,workflowVersion:undefined})).status,400);assert.equal((await f.call('driver-a','claimSpecialTour',{tourId})).status,200);assert.equal((await f.call('driver-a','state',{workflowVersion:undefined})).status,400);const mailbox=(await f.call('driver-a','createPackage',parcel(tourId))).body.data.stopId;
 assert.equal((await f.call('driver-a','startProtectedTour',{tourId,vehicleId:'car1',...capture()})).status,400);
 const start={tourId,vehicleId:'car1',odometerKm:4000,...capture()};assert.equal((await f.call('driver-a','startProtectedTour',start)).status,200);assert.equal((await f.call('driver-a','startProtectedTour',start)).status,200);assert.equal((await f.call('driver-a','startProtectedTour',{...start,odometerKm:3999})).status,409);
 const neighbor=(await f.call('driver-a','createPackage',parcel(tourId))).body.data.stopId;assert.equal((await f.call('office','createPackage',parcel(tourId,'pflege'))).status,400);const institution=(await f.call('driver-a','createPackage',parcel(tourId,'pflege'))).body.data.stopId;assert.ok(neighbor&&institution);assert.equal((await f.call('driver-b','createPackage',parcel(tourId))).status,403);
 const common={tourId,status:'zugestellt',collectedCents:0,collectionReason:''};const mailboxInput={...common,stopId:mailbox,deliveryMethod:'mailbox',...capture()};assert.equal((await f.call('driver-a','completeProtectedDelivery',mailboxInput)).status,200);assert.equal((await f.call('driver-a','completeProtectedDelivery',{...mailboxInput,deliveryMethod:'neighbor'})).status,409);
 assert.equal((await f.call('driver-a','completeProtectedDelivery',{...common,stopId:neighbor,deliveryMethod:'neighbor',...capture()})).status,400);
 const key=(await f.call('driver-a','getDeliveryEncryptionKey')).body.data,c=capture(),png=new PNG({width:360,height:150});png.data.fill(255);for(let x=20;x<180;x++){const at=(60*360+x)*4;png.data[at]=png.data[at+1]=png.data[at+2]=0;}const signature='data:image/png;base64,'+PNG.sync.write(png).toString('base64');const sealedSignature=await sealSignature(key,{uid:'driver-a',tourId,stopId:neighbor,completionId:c.completionId},signature,c.capturedAt);
 assert.equal((await f.call('driver-a','completeProtectedDelivery',{...common,stopId:neighbor,deliveryMethod:'neighbor',neighborName:'Fiktiver Nachbar',sealedSignature,...c})).status,200);
 const ic=capture(),institutionSignature=await sealSignature(key,{uid:'driver-a',tourId,stopId:institution,completionId:ic.completionId},signature,ic.capturedAt);assert.equal((await f.call('driver-a','completeProtectedDelivery',{...common,stopId:institution,sealedSignature:institutionSignature,...ic})).status,400);assert.equal((await f.call('driver-a','completeProtectedDelivery',{...common,stopId:institution,deliveryMethod:'recipient',...capture()})).status,200);
 assert.equal((await f.call('driver-a','finishProtectedTour',{tourId,odometerKm:3999,...capture()})).status,400);const end={tourId,odometerKm:4012,...capture()};assert.equal((await f.call('driver-a','finishProtectedTour',end)).status,200);assert.equal((await f.call('driver-a','finishProtectedTour',end)).status,200);assert.equal((await f.call('office','createPackage',parcel(tourId))).status,400);
 const proof=(await f.call('office','downloadProtectedProof',{tourId,stopId:mailbox})).body.data.proof;assert.equal(proof.deliveryMethod,'mailbox');assert.equal(proof.signature,null);assert.equal((await f.call('driver-a','downloadProtectedProof',{tourId,stopId:neighbor})).status,403);
 const state=(await f.call('office','state',{view:'office'})).body.data;assert.equal(state.tours[0].startOdometerKm,4000);assert.equal(state.tours[0].endOdometerKm,4012);assert.equal(state.stops[tourId].find(s=>s.id===neighbor).deliveryMethod,'neighbor');assert.equal(JSON.stringify(state).includes(signature),false);
 await assert.rejects(f.db.prepare('UPDATE proofs SET data=?').bind('{}').run());
 }finally{await f.runtime.dispose();}
});
test('earlier tours and queued version-one captures remain compatible without invented kilometers',async()=>{const f=await fixtureRuntime();try{const id='old-tour';await f.db.prepare("INSERT INTO tours(id,date,type,driver_id,created_by,status,created_at) VALUES (?,?,'Fiktiver Altbestand','driver-a','office','open',?)").bind(id,localDate(),new Date().toISOString()).run();const stop=(await f.call('driver-a','createPackage',parcel(id,'arzt'))).body.data.stopId;assert.equal((await f.call('driver-a','startProtectedTour',{tourId:id,vehicleId:'car1',...capture()})).status,200);assert.equal((await f.call('driver-a','completeProtectedDelivery',{tourId:id,stopId:stop,status:'zugestellt',...capture()})).status,200);assert.equal((await f.call('driver-a','finishProtectedTour',{tourId:id,...capture()})).status,200);assert.equal((await f.db.prepare('SELECT start_odometer FROM tours WHERE id=?').bind(id).first()).start_odometer,null);}finally{await f.runtime.dispose();}});
