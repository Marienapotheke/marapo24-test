import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixtureRuntime} from './fixture-runtime.mjs';
import {localDate,packageData} from './domain.mjs';
import {parcelCount,totalParcels,phoneHref} from './stop-details.mjs';
import {sealCompletion} from './completion-envelope.mjs';
import {deliveryKey} from './web-envelope.mjs';
import fs from 'node:fs/promises';
const capture=()=>({completionId:crypto.randomUUID(),capturedAt:new Date().toISOString()});
const parcel=tourId=>({tourId,type:'arzt',origin:'Marienapotheke',name:'Fiktive Testperson',street:'Musterweg 1',postalCode:'54321',city:'Musterstadt',phone:'0123456789',note:'Nur diese Lieferung',cents:500});
async function setup(options){const f=await fixtureRuntime(options);const tourId=(await f.call('office','createSpecialTour',{date:localDate(),type:'Fiktiver Praxistest'})).body.data.tourId;await f.call('driver-a','claimSpecialTour',{tourId});return {...f,tourId};}
test('phone links accept formatted numbers and cannot inject a scheme or dial control sequence',()=>{
 assert.equal(phoneHref('+49 (0) 6531 / 123-45'),'tel:+49653112345');assert.equal(phoneHref('06531 12345'),'tel:0653112345');
 for(const value of ['', 'javascript:alert(1)','tel:123','123;456','123#456','123*456','" onmouseover="bad'])assert.equal(phoneHref(value),null);
});
test('parcel defaults are compatible and invalid counts cannot enter package data',()=>{
 assert.equal(parcelCount(undefined),1);assert.equal(totalParcels([{}, {parcelCount:3}, {}]),5);
 for(const value of [0,-1,1.5,1000,null,'2',true])assert.throws(()=>packageData({...parcel('tour'),parcelCount:value},{}));
 assert.equal(packageData(parcel('tour'),{}).parcelCount,1);
});
test('older clients preserve a recorded count when editing, while invalid API counts fail clearly',async()=>{const f=await setup();try{
 const data=parcel(f.tourId),stopId=(await f.call('office','createPackage',{...data,parcelCount:7})).body.data.stopId;
 assert.equal((await f.call('office','updatePackage',{...data,stopId,baseRevision:0,name:'Fiktiv korrigiert'})).status,200);
 assert.equal(JSON.parse((await f.db.prepare('SELECT data FROM stops WHERE id=?').bind(stopId).first()).data).parcelCount,7);
 for(const value of [null,0,1.5,1000,'2']){const result=await f.call('office','createPackage',{...data,parcelCount:value});assert.equal(result.status,400);assert.equal(result.body.error.code,'invalid-argument');}
 }finally{await f.runtime.dispose();}});
test('new care/partner stops and edits enforce no cash; existing open and archived data are not rewritten',async()=>{const f=await setup();try{
 for(const type of ['pflege','partner']){const data={...parcel(f.tourId),type,parcelCount:3,cents:875,paymentReason:'Auf Rechnung'},created=await f.call('office','createPackage',data);assert.equal(created.status,200);const stopId=created.body.data.stopId;
 const saved=JSON.parse((await f.db.prepare('SELECT data FROM stops WHERE id=?').bind(stopId).first()).data);assert.equal(saved.cents,0);assert.equal(saved.cashExempt,true);assert.equal(saved.paymentReason,'');assert.equal(saved.parcelCount,3);
 assert.equal((await f.call('office','updatePackage',{...data,stopId,baseRevision:0,cents:999})).status,200);
 }
 const legacy=parcel(f.tourId);await f.db.prepare("INSERT INTO stops VALUES ('legacy',?,?, 'offen',?,NULL,NULL)").bind(f.tourId,JSON.stringify({...legacy,type:'pflege'}),new Date().toISOString()).run();const before=(await f.db.prepare("SELECT data FROM stops WHERE id='legacy'").first()).data;
 assert.equal((await f.call('driver-a','state')).body.data.stops[f.tourId].find(s=>s.id==='legacy').parcelCount,1);assert.equal((await f.db.prepare("SELECT data FROM stops WHERE id='legacy'").first()).data,before);
 await f.call('driver-a','startProtectedTour',{tourId:f.tourId,vehicleId:'car1',odometerKm:100,...capture()});const stops=(await f.call('driver-a','state')).body.data.stops[f.tourId];const stopId=stops.find(s=>s.cashExempt).id;
 assert.equal((await f.call('driver-a','completeProtectedDelivery',{tourId:f.tourId,stopId,status:'zugestellt',collectedCents:1,collectionReason:'',...capture()})).status,400);
 assert.equal((await f.call('driver-a','completeProtectedDelivery',{tourId:f.tourId,stopId,status:'zugestellt',...capture()})).status,200);
 const proof=JSON.parse((await f.db.prepare('SELECT data FROM proofs WHERE stop_id=?').bind(stopId).first()).data);assert.equal(proof.collectedCents,0);assert.equal(proof.cents,0);assert.equal(proof.parcelCount,3);
 // Previously captured offline amounts keep their historical meaning.
 assert.equal((await f.call('driver-a','completeProtectedDelivery',{tourId:f.tourId,stopId:'legacy',status:'zugestellt',collectedCents:500,collectionReason:'',...capture()})).status,200);
 }finally{await f.runtime.dispose();}});
test('encrypted optional comment binds to the immutable proof, never customer suggestions; old queue contract still works',async()=>{const f=await setup();try{
 await f.db.exec((await fs.readFile(new URL('./customer-notes.sql',import.meta.url),'utf8')).replace(/\r?\n/g,' '));
 const stopId=(await f.call('driver-a','createPackage',{...parcel(f.tourId),parcelCount:4})).body.data.stopId;
 await f.call('driver-a','startProtectedTour',{tourId:f.tourId,vehicleId:'car1',odometerKm:100,...capture()});const stamp=capture(),comment='<img src=x onerror=alert(1)>\nFiktiver Kommentar';const key=deliveryKey(f.pem);
 const input={tourId:f.tourId,stopId,status:'zugestellt',...stamp,sealedSignature:await sealCompletion(key,{uid:'driver-a',tourId:f.tourId,stopId,completionId:stamp.completionId},null,stamp.capturedAt,comment)};
 assert.equal(JSON.stringify(input).includes(comment),false);assert.equal((await f.call('driver-b','completeProtectedDelivery',input)).status,403);
 assert.equal((await f.call('driver-a','completeProtectedDelivery',input)).status,200);assert.equal((await f.call('driver-a','completeProtectedDelivery',input)).status,200);
 assert.equal((await f.call('driver-a','downloadProtectedProof',{tourId:f.tourId,stopId})).status,403);
 const proof=(await f.call('office','downloadProtectedProof',{tourId:f.tourId,stopId})).body.data.proof;assert.equal(proof.driverComment,comment);assert.equal(proof.parcelCount,4);assert.equal(proof.note,'Nur diese Lieferung');
 const state=(await f.call('office','state')).body.data;assert.equal(state.stops[f.tourId][0].driverComment,comment);
 const customer=JSON.parse((await f.db.prepare('SELECT data FROM customers').first()).data);assert.equal(Object.hasOwn(customer,'driverComment'),false);assert.equal(Object.hasOwn(customer,'note'),false);assert.equal(Object.hasOwn(customer,'parcelCount'),false);
 await assert.rejects(f.db.prepare("UPDATE proofs SET data='{}'").run());await assert.rejects(f.db.prepare('DELETE FROM proofs').run());
 const changed={...input,...capture()};assert.equal((await f.call('driver-a','completeProtectedDelivery',changed)).status,409);
 }finally{await f.runtime.dispose();}});
test('oversized encrypted comments and tampered ciphertext cannot create archives',async()=>{const f=await setup();try{
 const stopId=(await f.call('driver-a','createPackage',parcel(f.tourId))).body.data.stopId;await f.call('driver-a','startProtectedTour',{tourId:f.tourId,vehicleId:'car1',odometerKm:100,...capture()});
 for(const comment of ['x'.repeat(501),'bad\u0000text']){const stamp=capture(),input={tourId:f.tourId,stopId,status:'zugestellt',...stamp,sealedSignature:await sealCompletion(deliveryKey(f.pem),{uid:'driver-a',tourId:f.tourId,stopId,completionId:stamp.completionId},null,stamp.capturedAt,comment)};assert.equal((await f.call('driver-a','completeProtectedDelivery',input)).status,400);}
 const stamp=capture(),sealedSignature=await sealCompletion(deliveryKey(f.pem),{uid:'driver-a',tourId:f.tourId,stopId,completionId:stamp.completionId},null,stamp.capturedAt,'Fiktiver Kommentar');sealedSignature.ciphertext=(sealedSignature.ciphertext[0]==='A'?'B':'A')+sealedSignature.ciphertext.slice(1);assert.equal((await f.call('driver-a','completeProtectedDelivery',{tourId:f.tourId,stopId,status:'zugestellt',...stamp,sealedSignature})).status,400);assert.equal((await f.db.prepare('SELECT count(*) n FROM proofs').first()).n,0);
 }finally{await f.runtime.dispose();}});

// Approximate illustrative Mosel town centres, never customer addresses or provider calls.
const towns=[['Mülheim',7.010,49.911],['Lieser',7.022,49.917],['Bernkastel-Kues',7.075,49.916],['Zeltingen',7.019,49.954],['Wehlen',7.035,49.942]];
test('geographic route fixture uses current first stop, lon/lat, provider job indexes and exact double reversal',async()=>{
 let payload,wrongCity=false,broken=false;
 const f=await setup({bindings:{GEOAPIFY_API_KEY:'fictional-provider-key'},outbound:async request=>{const url=new URL(request.url);assert.equal(url.hostname,'api-eu.geoapify.com');if(url.pathname.includes('geocode')){const index=Number(url.searchParams.get('text').match(/Musterweg (\d+)/)[1])-1,[city,lon,lat]=towns[index];return Response.json({features:[{properties:{city:wrongCity?'Anderer Ort':city==='Mülheim'?'Mülheim an der Mosel':city,street:'Musterweg',housenumber:String(index+1),postcode:'54321',lon,lat}}]});}payload=await request.json();return Response.json({features:[{properties:{agent_index:0,actions:(broken?[0,0,2,3,4]:[0,1,2,3,4]).map(job_index=>({job_index,job_id:String(job_index)}))}}]});}});
 try{const ids=[];for(const [i,[city]] of towns.entries())ids.push((await f.call('driver-a','createPackage',{...parcel(f.tourId),city:city==='Mülheim'?'Mülheim (Mosel)':city,street:'Musterweg '+(i+1)})).body.data.stopId);
 wrongCity=true;assert.equal((await f.call('driver-a','prepareRouteAddress',{tourId:f.tourId,stopId:ids[0]})).status,400);wrongCity=false;
 for(const stopId of ids)assert.equal((await f.call('driver-a','prepareRouteAddress',{tourId:f.tourId,stopId})).status,200);
 const reversed=[...ids].reverse();assert.equal((await f.call('driver-a','reorderStops',{tourId:f.tourId,stopIds:reversed,baseRevision:0})).status,200);
 let result=await f.call('driver-a','optimizeStops',{tourId:f.tourId,baseRevision:1});assert.equal(result.status,200);assert.deepEqual(payload.agents[0].start_location,[towns[4][1],towns[4][2]]);assert.deepEqual(payload.jobs[0].location,payload.agents[0].start_location);assert.deepEqual(result.body.data.stopIds,reversed);
 assert.equal(JSON.stringify(payload).includes('Fiktive'),false);assert.equal(JSON.stringify(payload).includes('0123456789'),false);
 const ordered=result.body.data.stopIds;for(const [revision,stopIds] of [[2,[...ordered].reverse()],[3,ordered]])assert.equal((await f.call('driver-a','reorderStops',{tourId:f.tourId,stopIds,baseRevision:revision})).status,200);
 assert.deepEqual((await f.call('driver-a','state')).body.data.stops[f.tourId].map(s=>s.id),ordered);
 broken=true;assert.equal((await f.call('driver-a','optimizeStops',{tourId:f.tourId,baseRevision:4})).status,503);assert.equal((await f.db.prepare('SELECT revision FROM tour_orders').first()).revision,4);
 }finally{await f.runtime.dispose();}
});
test('a stop changed during provider computation cannot receive the stale optimized order',async()=>{
 let notify,release;const entered=new Promise(resolve=>notify=resolve),waiting=new Promise(resolve=>release=resolve);
 const f=await setup({bindings:{GEOAPIFY_API_KEY:'fictional-provider-key'},outbound:async request=>{const url=new URL(request.url);if(url.pathname.includes('geocode'))return Response.json({features:[{properties:{city:'Musterstadt',street:'Musterweg',housenumber:'1',postcode:'54321',lon:7,lat:50}}]});notify();await waiting;return Response.json({features:[{properties:{actions:[{job_index:1},{job_index:0}]}}]});}});
 try{const ids=[];for(let i=0;i<2;i++)ids.push((await f.call('driver-a','createPackage',parcel(f.tourId))).body.data.stopId);for(const stopId of ids)await f.call('driver-a','prepareRouteAddress',{tourId:f.tourId,stopId});
 const calculation=f.call('driver-a','optimizeStops',{tourId:f.tourId,baseRevision:0});await entered;
 // Simulate an older writer without an order revision update, inside the local fixture only.
 await f.db.prepare("UPDATE stops SET data=json_set(data,'$.street','Fiktiver neuer Weg 2') WHERE id=?").bind(ids[0]).run();release();assert.equal((await calculation).status,400);assert.equal((await f.db.prepare('SELECT count(*) n FROM tour_orders').first()).n,0);
 }finally{release();await f.runtime.dispose();}
});
