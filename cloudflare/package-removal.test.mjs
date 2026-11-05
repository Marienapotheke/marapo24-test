import {test} from 'node:test';import assert from 'node:assert/strict';
import {fixtureRuntime} from './fixture-runtime.mjs';import {localDate} from './domain.mjs';
import {sealCompletion} from './completion-envelope.mjs';import {deliveryKey} from './web-envelope.mjs';
import {totalParcels,dueCents} from './stop-details.mjs';import {cashByPharmacy} from './payment.mjs';
const stamp=()=>({completionId:crypto.randomUUID(),capturedAt:new Date().toISOString()});
async function setup(){const f=await fixtureRuntime();f.tourId=(await f.call('office','createSpecialTour',{date:localDate(),type:'Fiktive Entfernungsfahrt'})).body.data.tourId;await f.call('driver-a','claimSpecialTour',{tourId:f.tourId});f.stopId=(await f.call('driver-a','createPackage',{tourId:f.tourId,type:'privat',name:'Fiktive Person',origin:'Marienapotheke',street:'Musterweg 1',postalCode:'54321',city:'Musterstadt',cents:2270,parcelCount:3})).body.data.stopId;return f;}
const start=f=>f.call('driver-a','startProtectedTour',{tourId:f.tourId,vehicleId:'car1',odometerKm:100,...stamp()});
async function removal(f,reason='Fiktiv doppelt erfasst',uid='driver-a'){const c=stamp();return {tourId:f.tourId,stopId:f.stopId,...c,sealedSignature:await sealCompletion(deliveryKey(f.pem),{uid,tourId:f.tourId,stopId:f.stopId,completionId:c.completionId},null,c.capturedAt,reason)};}

test('removal archives original amount/reason/actor, removes count and cash, is retry-safe after finish and immutable',async()=>{const f=await setup();try{await start(f);const input=await removal(f);assert.ok(!JSON.stringify(input).includes('doppelt'));assert.equal((await f.call('driver-a','removeProtectedPackage',input)).status,200);const original=(await f.db.prepare('SELECT data FROM proofs WHERE stop_id=?').bind(f.stopId).first()).data;
 const state=(await f.call('office','state')).body.data,s=state.stops[f.tourId][0];assert.equal(s.removed,true);assert.equal(s.cents,0);assert.equal(dueCents(s),0);assert.equal(s.originalCents,2270);assert.equal(s.removalReason,'Fiktiv doppelt erfasst');assert.equal(s.removedBy,'driver-a');assert.equal(s.removedByName,'Fiktiv driver-a');assert.ok(s.removedAt);assert.equal(totalParcels([s]),0);assert.equal(cashByPharmacy([s])[0].cents,0);assert.deepEqual(state.cash,[]);
 const proof=(await f.call('office','downloadProtectedProof',{tourId:f.tourId,stopId:f.stopId})).body.data.proof;assert.equal(proof.kind,'package-removal');assert.equal(proof.signature,null);assert.equal(proof.originalCents,2270);assert.equal(proof.cents,2270);assert.equal(proof.collectedCents,0);
 assert.equal((await f.call('driver-a','finishProtectedTour',{tourId:f.tourId,odometerKm:110,...stamp()})).status,200);assert.equal((await f.call('driver-a','removeProtectedPackage',input)).status,200);assert.equal((await f.db.prepare('SELECT count(*) n FROM proofs').first()).n,1);assert.equal((await f.db.prepare('SELECT count(*) n FROM customers').first()).n,0);
 await assert.rejects(f.db.prepare("UPDATE proofs SET data='{}' WHERE stop_id=?").bind(f.stopId).run());await assert.rejects(f.db.prepare('DELETE FROM proofs WHERE stop_id=?').bind(f.stopId).run());assert.equal((await f.db.prepare('SELECT data FROM proofs WHERE stop_id=?').bind(f.stopId).first()).data,original);
 for(const action of ['correctDeliveryAmount','reopenDelivery'])assert.notEqual((await f.call('driver-a',action,{tourId:f.tourId,stopId:f.stopId,baseRevision:0,reason:'Fiktiver Versuch',...(action==='reopenDelivery'?{cashCleared:true}:{cents:100,collectedCents:0,collectionReason:''}),...stamp()})).status,200);
 }finally{await f.runtime.dispose();}});

test('removal rejects wrong owner, prestart, missing reason, tampering and completed stops; race has exactly one winner',async()=>{const f=await setup();try{
 assert.notEqual((await f.call('driver-a','removeProtectedPackage',await removal(f))).status,200);await start(f);
 assert.equal((await f.call('driver-b','removeProtectedPackage',await removal(f,'Fiktiv fremd','driver-b'))).status,403);
 assert.equal((await f.call('driver-a','removeProtectedPackage',await removal(f,''))).status,400);
 const changed=await removal(f);changed.capturedAt=new Date(Date.now()-1000).toISOString();assert.equal((await f.call('driver-a','removeProtectedPackage',changed)).status,400);
 const r=await Promise.all([f.call('driver-a','removeProtectedPackage',await removal(f)),f.call('driver-a','completeProtectedDelivery',{tourId:f.tourId,stopId:f.stopId,status:'nicht zugestellt',nonDeliveryReason:'Niemand angetroffen',collectedCents:0,collectionReason:'',...stamp()})]);assert.equal(r.filter(x=>x.status===200).length,1,JSON.stringify(r));assert.equal((await f.db.prepare('SELECT count(*) n FROM proofs').first()).n,1);assert.notEqual((await f.call('driver-a','removeProtectedPackage',await removal(f))).status,200);
 }finally{await f.runtime.dispose();}});


test('removed due amount never joins the remaining delivered cash or end total',async()=>{const f=await setup();try{
 const other=(await f.call('driver-a','createPackage',{tourId:f.tourId,type:'arzt',name:'Fiktive Praxis',origin:'Marienapotheke',street:'Musterweg 3',postalCode:'54321',city:'Musterstadt',cents:1000})).body.data.stopId;await start(f);
 assert.equal((await f.call('driver-a','removeProtectedPackage',await removal(f))).status,200);assert.equal((await f.call('driver-a','completeProtectedDelivery',{tourId:f.tourId,stopId:other,status:'zugestellt',collectedCents:1000,collectionReason:'',...stamp()})).status,200);
 const state=(await f.call('office','state')).body.data;assert.equal(cashByPharmacy(state.stops[f.tourId])[0].cents,1000);assert.equal(state.cash[0].cents,1000);assert.equal((await f.db.prepare("SELECT sum(effective_collected_cents) amount FROM effective_proof_payments WHERE tour_id=? AND json_extract(data,'$.status')='zugestellt'").bind(f.tourId).first()).amount,1000);assert.equal((await f.call('driver-a','finishProtectedTour',{tourId:f.tourId,odometerKm:110,...stamp()})).status,200);
 }finally{await f.runtime.dispose();}});
