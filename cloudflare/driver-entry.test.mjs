import {test} from 'node:test';
import assert from 'node:assert/strict';
import {driverDisplayStops,recipientNames,totalParcels} from './stop-details.mjs';
import {packageData,localDate} from './domain.mjs';
import {matchingStops} from './office-search.mjs';
import {fixtureRuntime} from './fixture-runtime.mjs';
const parcel={tourId:'fictional',type:'privat',origin:'Marienapotheke',name:'Anna Muster',secondName:'Ben Beispiel',parcelCount:2,street:'Musterweg 1',postalCode:'54321',city:'Musterstadt',cents:500};
test('driver display keeps open stops first, including offline outcomes, while route and relative order stay unchanged',()=>{
 const stops=[{id:'done',status:'zugestellt'},{id:'open1',status:'offen'},{id:'failed',status:'nicht zugestellt'},{id:'open2',status:'offen'},{id:'removed',status:'nicht zugestellt',removed:true}],snapshot=structuredClone(stops);
 assert.deepEqual(driverDisplayStops(stops).map(s=>s.id),['open1','open2','done','failed']);
 const queue=[{input:{action:'delivery',stopId:'open1',status:'zugestellt'},error:'fictional retry'}];assert.deepEqual(driverDisplayStops(stops,queue).map(s=>s.id),['open2','done','open1','failed']);
 assert.deepEqual(stops,snapshot);assert.deepEqual(driverDisplayStops([{id:'new',status:'offen'},...stops]).slice(0,3).map(s=>s.id),['new','open1','open2']);
});
test('second recipient is optional for two or more parcels; primary identity, count, amount and search stay explicit',()=>{
 const stop=packageData(parcel,{});assert.equal(recipientNames(stop),'Anna Muster / Ben Beispiel');assert.equal(totalParcels([stop]),2);assert.equal(stop.cents,500);assert.equal(matchingStops([stop],'ben beispiel').length,1);
 assert.equal(packageData({...parcel,secondName:''},{}).secondName,undefined);assert.equal(recipientNames({name:'Altbestand'}),'Altbestand');
 for(const input of [{...parcel,parcelCount:1},{...parcel,type:'arzt'},{...parcel,secondName:'x'.repeat(91)},{...parcel,secondName:'Bad\nName'}])assert.throws(()=>packageData(input,{}));
});
test('shared stop preserves the second name through older edits, immutable proof and office access, but does not combine customer profiles',async()=>{
 const f=await fixtureRuntime();try{
  const tourId=(await f.call('office','createSpecialTour',{date:localDate(),type:'Fiktive Zwei-Namen-Tour'})).body.data.tourId;await f.call('driver-a','claimSpecialTour',{tourId});
  const created=await f.call('office','createPackage',{...parcel,tourId});assert.equal(created.status,200);const stopId=created.body.data.stopId;
  const {secondName,...old}=parcel;assert.equal((await f.call('office','updatePackage',{...old,tourId,stopId,baseRevision:0})).status,200);
  const saved=JSON.parse((await f.db.prepare('SELECT data FROM stops WHERE id=?').bind(stopId).first()).data);assert.equal(saved.secondName,secondName);assert.equal(saved.parcelCount,2);
  const stamp=()=>({completionId:crypto.randomUUID(),capturedAt:new Date().toISOString()});assert.equal((await f.call('driver-a','startProtectedTour',{tourId,vehicleId:'car1',odometerKm:100,...stamp()})).status,200);
  assert.equal((await f.call('driver-a','completeProtectedDelivery',{tourId,stopId,status:'zugestellt',deliveryMethod:'mailbox',collectedCents:500,collectionReason:'',sealedSignature:null,...stamp()})).status,200);
  const proof=(await f.call('office','downloadProtectedProof',{tourId,stopId})).body.data.proof;assert.equal(proof.secondName,secondName);assert.equal(proof.cents,500);assert.equal(proof.parcelCount,2);
  const customer=JSON.parse((await f.db.prepare('SELECT data FROM customers').first()).data);assert.equal(customer.name,parcel.name);assert.equal('secondName'in customer,false);
  const original=(await f.db.prepare('SELECT data FROM proofs WHERE stop_id=?').bind(stopId).first()).data;assert.equal((await f.call('office','updatePackage',{...parcel,tourId,stopId,baseRevision:1,secondName:'Andere Person'})).status,400);assert.equal((await f.db.prepare('SELECT data FROM proofs WHERE stop_id=?').bind(stopId).first()).data,original);
 }finally{await f.runtime.dispose();}
});
