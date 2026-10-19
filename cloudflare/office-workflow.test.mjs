import {test} from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {fixtureRuntime} from './fixture-runtime.mjs';import {localDate} from './domain.mjs';import {sealSignature} from '../offline-store.mjs';import {deliveryKey} from './web-envelope.mjs';import {purgeExpired,RETENTION_POLICY} from './retention.mjs';
import {matchingStops} from './office-search.mjs';
const require=createRequire(import.meta.url),{PNG}=require('../functions/node_modules/pngjs');
const capture=()=>({completionId:crypto.randomUUID(),capturedAt:new Date().toISOString()});
const parcel=tourId=>({tourId,type:'privat',origin:'Marienapotheke',name:'Fiktiv Muster',street:'Musterweg 1',postalCode:'54321',city:'Musterstadt',cents:500});
const png=new PNG({width:360,height:150});png.data.fill(255);for(let x=25;x<180;x++){const i=(55*360+x)*4;png.data[i]=10;png.data[i+1]=20;png.data[i+2]=10;}const signature='data:image/png;base64,'+PNG.sync.write(png).toString('base64');
test('office creates and delivers own tour without driver role or PIN, preserves personal evidence and rejects foreign delivery',async()=>{const f=await fixtureRuntime();try{
 const tourId=(await f.call('office','createSelfTour',{date:localDate(),type:'Fiktive Mitnahme'})).body.data.tourId;
 const user=await f.db.prepare("SELECT roles FROM users WHERE uid='office'").first();assert.deepEqual(JSON.parse(user.roles),['office']);assert.equal((await f.db.prepare("SELECT count(*) n FROM driver_pins WHERE uid='office'").first()).n,0);
 assert.equal((await f.call('office','claimRegularTour',{date:localDate(),typeId:'doctor1'})).status,403);
 assert.equal((await f.call('office-4','startProtectedTour',{tourId,vehicleId:'car1',odometerKm:100,...capture()})).status,403);
 const ids=[];for(let i=0;i<2;i++){const r=await f.call('office','createPackage',parcel(tourId));assert.equal(r.status,200);ids.push(r.body.data.stopId);}
 assert.equal((await f.call('office','reorderStops',{tourId,stopIds:[...ids].reverse(),baseRevision:0})).status,200);
 assert.equal((await f.call('office','startProtectedTour',{tourId,vehicleId:'car1',odometerKm:100,...capture()})).status,200);
 const late=await f.call('office','createPackage',{...parcel(tourId),type:'arzt',cents:0});assert.equal(late.status,200);
 for(const stopId of ids){const stamp=capture(),input={tourId,stopId,status:'zugestellt',collectedCents:500,collectionReason:'',...stamp,sealedSignature:await sealSignature(deliveryKey(f.pem),{uid:'office',tourId,stopId,completionId:stamp.completionId},signature,stamp.capturedAt)};assert.equal((await f.call('office','completeProtectedDelivery',input)).status,200);assert.equal((await f.call('office','completeProtectedDelivery',input)).status,200);}
 await f.call('office','completeProtectedDelivery',{tourId,stopId:late.body.data.stopId,status:'zugestellt',...capture()});
 assert.equal((await f.call('office','finishProtectedTour',{tourId,odometerKm:105,...capture()})).status,200);
 const state=(await f.call('office','state',{view:'driver'})).body.data;assert.equal(state.tours[0].selfDelivery,true);assert.deepEqual(state.catalog,[]);assert.deepEqual((await f.call('office-4','state',{view:'driver'})).body.data.tours,[]);
 const proof=(await f.call('office-4','downloadProtectedProof',{tourId,stopId:ids[0]})).body.data.proof;assert.equal(proof.driverId,'office');assert.equal(proof.signature,signature);await assert.rejects(f.db.prepare("UPDATE proofs SET data='{}'").run());
 const result=await purgeExpired(f.db,{policy:RETENTION_POLICY,now:new Date(Date.now()+365*86400000)});assert.equal(result.deleted.proofs,3);assert.equal((await f.db.prepare('SELECT count(*) n FROM self_delivery_tours').first()).n,0);
 }finally{await f.runtime.dispose();}});
test('another office account settles an earlier finished tour once and sees the authenticated signer, without driver presence',async()=>{const f=await fixtureRuntime();try{
 const date=localDate(),tourId=(await f.call('office','createSpecialTour',{date,type:'Fiktive Abrechnung'})).body.data.tourId;await f.call('driver-a','claimSpecialTour',{tourId});const stopId=(await f.call('driver-a','createPackage',{...parcel(tourId),type:'arzt'})).body.data.stopId;await f.call('driver-a','startProtectedTour',{tourId,vehicleId:'car1',odometerKm:100,...capture()});await f.call('driver-a','completeProtectedDelivery',{tourId,stopId,status:'zugestellt',...capture()});await f.call('driver-a','finishProtectedTour',{tourId,odometerKm:105,...capture()});
 await f.db.prepare("UPDATE tours SET date='2026-10-15' WHERE id=?").bind(tourId).run();await f.db.prepare("UPDATE users SET active=0 WHERE uid='driver-a'").run();
 const variants=[];for(const uid of ['office','office-4']){const c=capture(),name=(await f.db.prepare('SELECT display_name FROM users WHERE uid=?').bind(uid).first()).display_name;variants.push({uid,input:{tourId,signerName:name,collectedCents:500,...c,sealedSignature:await sealSignature(deliveryKey(f.pem),{uid,tourId,purpose:'marien-cash-settlement',completionId:c.completionId},signature,c.capturedAt)}});}
 const results=await Promise.all(variants.map(v=>f.call(v.uid,'saveCashSettlement',v.input)));assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);const winner=variants[results.findIndex(r=>r.status===200)];assert.equal((await f.call(winner.uid,'saveCashSettlement',winner.input)).status,200);
 const proof=(await f.call('office-20','downloadCashSettlement',{tourId})).body.data.proof;assert.equal(proof.driverId,'driver-a');assert.equal(proof.settledByUid,winner.uid);assert.equal(proof.signerIdentity,'authenticated-office-account');assert.equal(proof.signature,signature);
 const state=(await f.call('office-20','state',{date:'2026-10-15'})).body.data;assert.equal(state.tours[0].cashSettlement.signerName,winner.input.signerName);assert.equal((await f.call('driver-b','downloadCashSettlement',{tourId})).status,403);await assert.rejects(f.db.prepare('DELETE FROM cash_settlements').run());
 }finally{await f.runtime.dispose();}});
test('office search matches only names in its provided day',()=>{
 const stops=[{id:'one',name:'Erika Muster',street:'Anderer Weg'},{id:'two',name:'Theo Beispiel',street:'Musterweg'}];assert.deepEqual(matchingStops(stops,' MUSTER ').map(s=>s.id),['one']);assert.deepEqual(matchingStops(stops,'Musterweg'),[]);
});
