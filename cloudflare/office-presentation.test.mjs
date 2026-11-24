import {test} from 'node:test';
import assert from 'node:assert/strict';
import {officeGroups,pharmacyClass,stopClasses} from './office-presentation.mjs';
import {payment,cashByPharmacy} from './payment.mjs';
test('finished office display groups only current monetary stops; preserves route, zero amounts and immutable history',()=>{
 const stops=[{name:'Zeta',origin:'Cusanus-Apotheke',cents:500,status:'zugestellt',collectedCents:500},{name:'Berta',origin:'Marienapotheke',cents:700,status:'nicht zugestellt'},{name:'Arzt',origin:'Marienapotheke',cents:0},{name:'Anna',origin:'Marienapotheke',cents:900,status:'zugestellt',collectedCents:0,collectionReason:'Überweist'},{name:'Entfernt',origin:'Marienapotheke',cents:0,originalCents:500,removed:true},{name:'Original',origin:'Marienapotheke',cents:900,voided:true}];
 const snapshot=structuredClone(stops),groups=officeGroups(stops,true);
 assert.deepEqual(groups.map(g=>g.label),['Marienapotheke','Cusanus-Apotheke','Weitere Päckchen und Verlauf']);
 assert.deepEqual(groups[0].stops.map(s=>s.name),['Anna','Berta']);assert.equal(groups[2].stops.length,3);
 assert.deepEqual(stops,snapshot);assert.equal(officeGroups(stops,false)[0].stops,stops);
 assert.equal(pharmacyClass('Marienapotheke'),'pharmacy-marien');assert.equal(pharmacyClass('Cusanus-Apotheke'),'pharmacy-cusanus');assert.equal(pharmacyClass('<script>'),'');
 assert.match(stopClasses(stops[1]),/not-delivered/);assert.doesNotMatch(stopClasses({...stops[1],removed:true}),/not-delivered/);
 assert.deepEqual(cashByPharmacy(stops),[{origin:'Marienapotheke',cents:0},{origin:'Cusanus-Apotheke',cents:500}]);
});
test('Überweist records a still unpaid balance, accepts partial collection and rejects contradictory payments',()=>{
 assert.equal(payment({collectedCents:0,collectionReason:'Überweist'},500,'zugestellt').collectedCents,0);
 assert.equal(payment({collectedCents:200,collectionReason:'Überweist'},500,'zugestellt').collectionReason,'Überweist');
 assert.throws(()=>payment({collectedCents:500,collectionReason:'Überweist'},500,'zugestellt'));
 assert.throws(()=>payment({collectedCents:0,collectionReason:'Überweist'},500,'nicht zugestellt'));
 assert.equal(payment({},500,'zugestellt').collectionConfirmed,false);
});
