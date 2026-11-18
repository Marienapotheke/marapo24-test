'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const p = require('../functions/policy.cjs');
const data = { tourId: 'tour1', stopId: 'stop1', status: 'zugestellt', signature: 'data:image/png;base64,YWJj' };
const tour = { schemaVersion: 2, driverId: p.DRIVER };
const stop = { schemaVersion: 2, status: 'offen', type: 'privat' };
const finish = (d=data,u=p.DRIVER,r={role:'driver',active:true},t=tour,s=stop,exists=false) => p.completion(d,u,r,t,s,exists,()=>{});
test('assigned driver can complete with signature', () => assert.equal(finish().proofId,'5_tour1_stop1'));
test('proof IDs cannot collide for separator-containing document IDs',()=>assert.notEqual(p.identifiers({tourId:'a--b',stopId:'c'}),p.identifiers({tourId:'a',stopId:'b--c'})));
for (const [label, call, code] of [
  ['anonymous',()=>finish(data,null),'unauthenticated'],
  ['office cannot complete',()=>finish(data,p.OFFICE,{role:'office',active:true}),'permission-denied'],
  ['self-assigned role',()=>finish(data,'attacker'),'permission-denied'],
  ['revoked role',()=>finish(data,p.DRIVER,{role:'office',active:true}),'permission-denied'],
  ['foreign tour',()=>finish(data,p.DRIVER,{role:'driver',active:true},{...tour,driverId:'other'}),'permission-denied'],
  ['missing tour',()=>finish(data,p.DRIVER,{role:'driver',active:true},null),'not-found'],
  ['replay',()=>finish(data,p.DRIVER,{role:'driver',active:true},tour,{...stop,status:'zugestellt'}),'already-exists'],
  ['existing proof',()=>finish(data,p.DRIVER,{role:'driver',active:true},tour,stop,true),'already-exists'],
  ['legacy signature',()=>finish(data,p.DRIVER,{role:'driver',active:true},tour,{...stop,signature:'old'}),'failed-precondition'],
  ['legacy schema',()=>finish(data,p.DRIVER,{role:'driver',active:true},tour,{...stop,schemaVersion:1}),'failed-precondition'],
  ['missing signature',()=>finish({...data,signature:null}),'invalid-argument'],
  ['oversized signature',()=>finish({...data,signature:'a'.repeat(180001)}),'invalid-argument'],
  ['invalid image',()=>finish({...data,signature:'data:image/svg+xml;base64,YWJj'}),'invalid-argument'],
  ['status injection',()=>finish({...data,status:'offen'}),'invalid-argument'],
  ['timestamp injection',()=>finish({...data,completedAt:'2000-01-01'}),'invalid-argument'],
  ['path injection',()=>finish({...data,tourId:'../users'}),'invalid-argument'],
  ['signature on failure',()=>finish({...data,status:'nicht zugestellt'}),'invalid-argument']
]) test(label,()=>assert.throws(call,e=>e.code===code));
test('non-private deliveries do not accept signatures',()=>assert.throws(()=>finish(data,p.DRIVER,{role:'driver',active:true},tour,{...stop,type:'arzt'}),e=>e.code==='invalid-argument'));
test('non-private delivery and failed private delivery can complete without signature',()=>{
  assert.equal(finish({...data,signature:null},p.DRIVER,{role:'driver',active:true},tour,{...stop,type:'arzt'}).signature,null);
  assert.equal(finish({...data,status:'nicht zugestellt',signature:null}).signature,null);
});
test('office archive authorization is separate and denies driver',()=>{
  p.authorize(p.OFFICE,{role:'office',active:true},'office');
  assert.throws(()=>p.authorize(p.DRIVER,{role:'driver',active:true},'office'),e=>e.code==='permission-denied');
});
test('any server-provisioned active employee is supported; inactive and missing roles are denied',()=>{
 for(let i=1;i<=11;i++)p.authorize('driver-'+i,{role:'driver',active:true},'driver');
 for(let i=1;i<=20;i++)p.authorize('office-'+i,{role:'office',active:true},'office');
 assert.throws(()=>p.authorize('driver-1',{role:'driver',active:false},'driver'),e=>e.code==='permission-denied');
 assert.throws(()=>p.authorize('unknown',null,'office'),e=>e.code==='permission-denied');
});
