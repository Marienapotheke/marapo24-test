'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {validateRoster}=require('../functions/staff-admin.cjs');
test('planned 11-driver/20-office roster validates without provisioning',()=>{
 const roster=[];for(let i=1;i<=11;i++)roster.push({email:`driver${i}@example.test`,displayName:`Fiktiver Fahrer ${i}`,role:'driver',active:true});
 for(let i=1;i<=20;i++)roster.push({email:`office${i}@example.test`,displayName:`Fiktives Büro ${i}`,role:'office',active:true});
 assert.equal(validateRoster(roster).length,31);
});
test('staff provisioning rejects duplicate emails, unknown roles, passwords and missing activity',()=>{
 const row={email:'staff@example.test',displayName:'Fiktiv',role:'driver',active:true};
 for(const roster of [[row,row],[{...row,role:'admin'}],[{...row,password:'must-not-be-here'}],[{...row,active:undefined}],[{...row,displayName:'x'.repeat(81)}]])assert.throws(()=>validateRoster(roster));
});
