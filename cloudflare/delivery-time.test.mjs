import {test} from 'node:test';import assert from 'node:assert/strict';import {deliveryTime} from './stop-details.mjs';import {localDateTime} from './tour-workflow.mjs';import {fixtureRuntime} from './fixture-runtime.mjs';import {localDate} from './domain.mjs';
test('delivery display uses captured time, marks a pending offline capture and never invents a time for open or removed records',()=>{
 const capturedAt='2026-11-02T17:06:48.000Z',completedAt='2026-11-03T07:00:00.000Z';
 assert.deepEqual(deliveryTime({status:'zugestellt',capturedAtClient:capturedAt,completedAt}),{value:capturedAt,pending:false,recorded:false});
 assert.deepEqual(deliveryTime({status:'zugestellt',action:'delivery',capturedAt}),{value:capturedAt,pending:true,recorded:false});
 assert.deepEqual(deliveryTime({status:'zugestellt',completedAt}),{value:completedAt,pending:false,recorded:true});
 assert.equal(localDateTime(capturedAt).time,'18:06');
 for(const stop of [{status:'offen',completedAt},{status:'nicht zugestellt',completedAt},{status:'zugestellt',removed:true,completedAt},{status:'zugestellt',voided:true,completedAt},{status:'zugestellt',completedAt:'bad'}])assert.equal(deliveryTime(stop),null);
});
test('driver and office receive the original delivery capture time without changing archived proof or customer profile',{timeout:40000},async()=>{
 const f=await fixtureRuntime();try{
  const tourId=(await f.call('office','createSpecialTour',{date:localDate(),type:'Fiktive Zustelluhrzeit'})).body.data.tourId;await f.call('driver-a','claimSpecialTour',{tourId});const stopId=(await f.call('driver-a','createPackage',{tourId,type:'arzt',origin:'Marienapotheke',name:'Fiktive Praxis',street:'Musterweg 1',postalCode:'54321',city:'Musterstadt',cents:0})).body.data.stopId;
  const capture=()=>({completionId:crypto.randomUUID(),capturedAt:new Date().toISOString()});await f.call('driver-a','startProtectedTour',{tourId,vehicleId:'car1',odometerKm:100,...capture()});
  const capturedAt=new Date(Date.now()-3600000).toISOString(),result=await f.call('driver-a','completeProtectedDelivery',{tourId,stopId,status:'zugestellt',deliveryMethod:'recipient',collectedCents:0,collectionReason:'',sealedSignature:null,...capture(),capturedAt});assert.equal(result.status,200);
  const before=(await f.db.prepare('SELECT data FROM proofs WHERE stop_id=?').bind(stopId).first()).data;
  for(const [uid,view] of [['driver-a','driver'],['office','office']]){const response=await f.call(uid,'state',{view,date:localDate()});assert.equal(response.status,200);const stop=response.body.data.stops[tourId].find(s=>s.id===stopId);assert.equal(stop.capturedAtClient,capturedAt);assert.notEqual(stop.completedAt,capturedAt);assert.equal(deliveryTime(stop).value,capturedAt);assert.equal('signature'in stop,false);}
  assert.equal((await f.db.prepare('SELECT data FROM proofs WHERE stop_id=?').bind(stopId).first()).data,before);const customer=JSON.parse((await f.db.prepare('SELECT data FROM customers').first()).data);assert.equal('capturedAtClient'in customer,false);
 }finally{await f.runtime.dispose();}
});
