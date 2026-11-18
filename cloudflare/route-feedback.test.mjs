import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeStreet} from './customers-routes.mjs';
import {localDate} from './domain.mjs';
import {fixtureRuntime} from './fixture-runtime.mjs';
test('German street suffix aliases are equivalent without accepting a different road',()=>{
 assert.equal(normalizeStreet('Neustr.'),normalizeStreet('Neustraße'));
 assert.equal(normalizeStreet('Friedrichstr.'),normalizeStreet('Friedrichstrasse'));
 assert.equal(normalizeStreet('  HAUPTSTRASSE '),normalizeStreet('Hauptstraße'));
 assert.notEqual(normalizeStreet('Nebenstr.'),normalizeStreet('Hauptstraße'));
});
test('route preparation accepts equivalent suffixes but keeps city, postcode, street and house-number safeguards',async()=>{
 let wrong='';const f=await fixtureRuntime({bindings:{GEOAPIFY_API_KEY:'fictional-provider-key'},outbound:async request=>{assert.equal(new URL(request.url).hostname,'api-eu.geoapify.com');return Response.json({features:[{properties:{lon:7,lat:50,postcode:wrong==='postcode'?'99999':'54321',city:wrong==='city'?'Anderstadt':'Musterstadt',street:wrong==='street'?'Andere Straße':'Neustraße',housenumber:wrong==='house'?'9':'3'}}]});}});
 try{
  const tourId=(await f.call('office','createSpecialTour',{date:localDate(),type:'Fiktive Abkürzungstour'})).body.data.tourId;await f.call('driver-a','claimSpecialTour',{tourId});
  const stopId=(await f.call('driver-a','createPackage',{tourId,type:'privat',origin:'Marienapotheke',name:'Fiktive Testperson',street:'Neustr. 3',postalCode:'54321',city:'Musterstadt',cents:0})).body.data.stopId;
  for(wrong of ['postcode','city','street','house']){const r=await f.call('driver-a','prepareRouteAddress',{tourId,stopId});assert.equal(r.status,400);assert.equal((await f.db.prepare('SELECT count(*) n FROM address_locations').first()).n,0);}
  wrong='';assert.equal((await f.call('driver-a','prepareRouteAddress',{tourId,stopId})).status,200);assert.equal((await f.db.prepare('SELECT count(*) n FROM address_locations').first()).n,1);
 }finally{await f.runtime.dispose();}
});
