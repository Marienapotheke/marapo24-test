'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const p=require('../functions/tour-policy.cjs');
const profile={role:'driver',active:true},tour={driverId:'driver1',status:'open'},input={tourId:'tour1',vehicleId:'car1',completionId:'12345678-1234-1234-1234-123456789abc',capturedAt:new Date().toISOString()};
test('only assigned active driver can document tour times and vehicle',()=>{
 p.validateTourAction(input,'driver1',profile,tour);p.canStart(tour,{active:true});
 assert.throws(()=>p.validateTourAction(input,'other',profile,tour),e=>e.code==='permission-denied');
 assert.throws(()=>p.validateTourAction(input,'driver1',{...profile,active:false},tour),e=>e.code==='permission-denied');
 assert.throws(()=>p.canStart(tour,{active:false}),e=>e.code==='failed-precondition');
 assert.throws(()=>p.canStart({...tour,status:'running'},{active:true}),e=>e.code==='already-exists');
});
test('tour may end only after start and all delivery outcomes; submitted fields are restricted',()=>{
 assert.throws(()=>p.canFinish(tour,[]),e=>e.code==='failed-precondition');
 assert.throws(()=>p.canFinish({...tour,status:'running'},[{status:'offen'}]),e=>e.code==='failed-precondition');
 p.canFinish({...tour,status:'running'},[{status:'zugestellt'},{status:'nicht zugestellt'}]);
 assert.throws(()=>p.validateTourAction({...input,driverId:'other'},'driver1',profile,tour),e=>e.code==='invalid-argument');
 assert.throws(()=>p.validateTourAction({...input,vehicleId:'../secret'},'driver1',profile,tour),e=>e.code==='invalid-argument');
});
