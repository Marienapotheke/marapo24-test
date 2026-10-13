import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {fixtureRuntime} from './fixture-runtime.mjs';
import {localDate} from './domain.mjs';
let f,tourId,stops,incomplete=false;const transmitted=[];
async function routeMock(request){const u=new URL(request.url);assert.equal(u.hostname,'api.geoapify.com');if(u.pathname==='/v1/geocode/search'){transmitted.push(u.search);const street=u.searchParams.get('text').includes('Musterweg')?'Musterweg':'Beispielweg';return Response.json({features:[{properties:{lat:50,lon:7,postcode:'54321',street,housenumber:street==='Musterweg'?'1':'2'}}]});}assert.equal(u.pathname,'/v1/routeplanner');const payload=await request.json();transmitted.push(JSON.stringify(payload));return Response.json({features:[{properties:{actions:(incomplete?[0]:[2,1,0]).map(job_index=>({job_index})),distance:100,time:50}}]});}
const capture=()=>({completionId:crypto.randomUUID(),capturedAt:new Date().toISOString()});
before(async()=>{f=await fixtureRuntime({bindings:{GEOAPIFY_API_KEY:'fictional-geoapify-key'},outbound:routeMock});const t=await f.call('admin','createSpecialTour',{date:localDate(),type:'Fiktive Sortiertour'});tourId=t.body.data.tourId;await f.call('driver-a','claimSpecialTour',{tourId});stops=[];for(const [name,street] of [['Erika Muster','Musterweg 1'],['Theo Muster','Beispielweg 2'],['Erika Muster','Musterweg 1']]){const r=await f.call('driver-a','createPackage',{tourId,type:'arzt',origin:'Marienapotheke',name,street,postalCode:'54321',city:'Musterstadt',phone:'01234567',note:'Fiktiver Hinweis',cents:300});assert.equal(r.status,200);stops.push(r.body.data.stopId);}});
after(async()=>{await f?.runtime.dispose();});
test('manual ordering preserves every open stop and uses an atomic revision',async()=>{
 const reversed=[...stops].reverse();assert.equal((await f.call('driver-b','reorderStops',{tourId,stopIds:reversed,baseRevision:0})).status,403);
 for(const ids of [reversed.slice(1),[stops[0],stops[0],stops[2]],[...reversed,'foreign']])assert.notEqual((await f.call('driver-a','reorderStops',{tourId,stopIds:ids,baseRevision:0})).status,200);
 const winners=await Promise.all([reversed,stops].map(stopIds=>f.call('driver-a','reorderStops',{tourId,stopIds,baseRevision:0})));assert.equal(winners.filter(r=>r.status===200).length,1);
 const state=await f.call('driver-a','state',{view:'driver'});assert.equal(state.body.data.tours[0].orderRevision,1);assert.deepEqual(state.body.data.stops[tourId].map(s=>s.id),winners.find(r=>r.status===200).body.data.stopIds);
 assert.equal((await f.call('driver-a','optimizeStops',{tourId,baseRevision:1})).body.error.code,'failed-precondition');
});
test('street planning sends only addresses and coordinates, preserves manual control and protects the free budget',async()=>{
 for(const stopId of stops)assert.equal((await f.call('driver-a','prepareRouteAddress',{tourId,stopId})).status,200);
 assert.equal(transmitted.length,2);const r=await f.call('driver-a','optimizeStops',{tourId,baseRevision:1});assert.equal(r.status,200);assert.equal(r.body.data.revision,2);assert.deepEqual(r.body.data.stopIds,[...stops].reverse());
 for(const privateValue of ['Erika','Theo','01234567','Fiktiver Hinweis','signature',tourId,...stops])assert.equal(transmitted.join().includes(privateValue),false);
 const usage=await f.db.prepare('SELECT credits FROM routing_usage').first();assert.equal(usage.credits,18);
 incomplete=true;assert.equal((await f.call('driver-a','optimizeStops',{tourId,baseRevision:2})).status,503);assert.equal((await f.db.prepare('SELECT revision FROM tour_orders').first()).revision,2);incomplete=false;
 await f.db.prepare('DELETE FROM routing_credit_events').run();await f.db.prepare('INSERT INTO routing_credit_events VALUES (?,?,?)').bind('fictional-prior-budget',Date.now()-3600000,2499).run();const before=transmitted.length;assert.equal((await f.call('driver-a','optimizeStops',{tourId,baseRevision:2})).status,429);assert.equal(transmitted.length,before);
 assert.equal((await f.call('driver-a','reorderStops',{tourId,stopIds:stops,baseRevision:2})).status,200);
});
test('successful deliveries remember customer fields without money or signatures and merge repeat customers',async()=>{
 assert.deepEqual((await f.call('driver-a','searchCustomers',{query:'Erika'})).body.data.customers,[]);
 await f.call('driver-a','startProtectedTour',{tourId,vehicleId:'car1',...capture()});
 await f.call('driver-a','completeProtectedDelivery',{tourId,stopId:stops[0],status:'zugestellt',...capture()});await f.call('driver-a','completeProtectedDelivery',{tourId,stopId:stops[1],status:'nicht_zugestellt',...capture()});await f.call('driver-a','completeProtectedDelivery',{tourId,stopId:stops[2],status:'zugestellt',...capture()});
 const r=await f.call('office','searchCustomers',{query:'ERIKA'});assert.equal(r.status,200);assert.equal(r.body.data.customers.length,1);const c=r.body.data.customers[0];assert.equal(c.phone,'01234567');assert.equal(c.street,'Musterweg 1');for(const secret of ['signature','cents','proofId','driverId'])assert.equal(Object.hasOwn(c,secret),false);
 assert.deepEqual((await f.call('driver-a','searchCustomers',{query:'Theo'})).body.data.customers,[]);assert.deepEqual((await f.call('driver-a','searchCustomers',{query:'Er'})).body.data.customers,[]);
 await f.db.prepare("UPDATE users SET active=0 WHERE uid='driver-b'").run();assert.equal((await f.call('driver-b','searchCustomers',{query:'Erika'})).status,403);
});
test('finished tours cannot be reordered and address lookup cannot access another driver tour',async()=>{
 await f.call('driver-a','finishProtectedTour',{tourId,...capture()});assert.equal((await f.call('driver-a','reorderStops',{tourId,stopIds:[],baseRevision:1})).status,400);assert.equal((await f.call('driver-b','prepareRouteAddress',{tourId,stopId:stops[0]})).status,403);
});
