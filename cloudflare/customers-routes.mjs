import {createHash} from 'node:crypto';
import {fail,fields,text,id,hasRole,requireRole,localDate} from './domain.mjs';
const normalize=s=>String(s||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('de-DE');
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function customerIdentity(data){return {customerId:hash([normalize(data.name),normalize(data.street),data.postalCode,normalize(data.city)]),customerSearchName:normalize(data.name)};}
const first=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
async function own(db,uid,tourId,p){requireRole(p,'driver');const t=await first(db,'SELECT * FROM tours WHERE id=?',id(tourId));if(!t||t.driver_id!==uid)fail('permission-denied','Nur eigene Touren können sortiert werden.');if(t.status==='finished')fail('failed-precondition','Tour bereits beendet.');return t;}
const activeDriver="EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='driver'))";
export async function saveOrder(db,uid,p,input){
 fields(input,['tourId','stopIds','baseRevision']);await own(db,uid,input.tourId,p);
 if(!Array.isArray(input.stopIds)||input.stopIds.length>1000||new Set(input.stopIds).size!==input.stopIds.length||input.stopIds.some(v=>typeof v!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(v))||!Number.isSafeInteger(input.baseRevision)||input.baseRevision<0)fail('invalid-argument','Stoppreihenfolge prüfen.');
 const serialized=JSON.stringify(input.stopIds),revision=input.baseRevision+1;
 const r=await db.prepare(`INSERT INTO tour_orders(tour_id,stop_ids,revision,updated_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM tours WHERE id=? AND driver_id=? AND status IN('open','running')) AND ${activeDriver} AND (SELECT count(*) FROM stops WHERE tour_id=? AND status='offen')=json_array_length(?) AND NOT EXISTS(SELECT 1 FROM json_each(?) j LEFT JOIN stops s ON s.id=j.value AND s.tour_id=? AND s.status='offen' WHERE s.id IS NULL) AND COALESCE((SELECT revision FROM tour_orders WHERE tour_id=?),0)=? ON CONFLICT(tour_id) DO UPDATE SET stop_ids=excluded.stop_ids,revision=excluded.revision,updated_at=excluded.updated_at WHERE tour_orders.revision=?`).bind(input.tourId,serialized,revision,new Date().toISOString(),input.tourId,uid,uid,input.tourId,serialized,serialized,input.tourId,input.tourId,input.baseRevision,input.baseRevision).run();
 if(r.meta.changes!==1)fail('failed-precondition','Tour oder Stopps wurden inzwischen geändert. Bitte neu laden.');return {revision,stopIds:input.stopIds};
}
export async function addOrders(db,tours,stops){if(!tours.length)return;const plans=(await db.prepare('SELECT * FROM tour_orders WHERE tour_id IN(SELECT value FROM json_each(?))').bind(JSON.stringify(tours.map(t=>t.id))).all()).results;const lookup=new Map(plans.map(p=>[p.tour_id,p]));for(const tour of tours){const plan=lookup.get(tour.id);tour.orderRevision=plan?.revision||0;if(plan){const ids=JSON.parse(plan.stop_ids),position=new Map(ids.map((v,i)=>[v,i]));stops[tour.id]?.sort((a,b)=>(position.get(a.id)??100000)-(position.get(b.id)??100000));}}}
async function consumeCredits(db,amount){
 if(amount>2500)fail('resource-exhausted','Kostenloses Kartenkontingent geschützt. Bitte manuell sortieren.');const now=Date.now(),since=now-86400000;
 await db.prepare('DELETE FROM routing_credit_events WHERE at<=?').bind(since).run();
 const r=await db.prepare('INSERT INTO routing_credit_events SELECT ?,?,? WHERE COALESCE((SELECT sum(credits) FROM routing_credit_events WHERE at>?),0)+?<=2500').bind(crypto.randomUUID(),now,amount,since,amount).run();
 if(r.meta.changes!==1)fail('resource-exhausted','Kostenloses Kartenkontingent geschützt. Bitte manuell sortieren.');
 await db.prepare('INSERT INTO routing_usage VALUES (?,?) ON CONFLICT(day) DO UPDATE SET credits=credits+excluded.credits').bind(localDate(),amount).run();
}
async function providerFetch(url,options){let r;try{r=await fetch(url,{...options,signal:AbortSignal.timeout(12000)});}catch{fail('unavailable','Kartenberechnung nicht erreichbar. Reihenfolge bleibt erhalten.');}if(!r.ok)fail('unavailable','Kartenberechnung nicht bestätigt. Bitte manuell sortieren.');return r.json();}
async function location(db,data,key){
 const addressId=hash([normalize(data.street),data.postalCode,normalize(data.city)]),old=await first(db,'SELECT * FROM address_locations WHERE id=?',addressId);if(old)return old;
 await consumeCredits(db,1);const url=new URL('https://api-eu.geoapify.com/v1/geocode/search');url.searchParams.set('text',data.street+', '+data.postalCode+' '+data.city+', Deutschland');url.searchParams.set('filter','countrycode:de');url.searchParams.set('limit','1');url.searchParams.set('apiKey',key);
 const result=await providerFetch(url),p=result.features?.[0]?.properties,number=data.street.match(/(?:\s|^)(\d+[a-z]?(?:[-/]\d+[a-z]?)?)\s*$/i)?.[1];
 const expectedStreet=normalize(data.street.replace(/\s+\d+[a-z]?(?:[-/]\d+[a-z]?)?\s*$/i,''));
 if(!p||!Number.isFinite(p.lat)||!Number.isFinite(p.lon)||p.lat<-90||p.lat>90||p.lon<-180||p.lon>180||p.postcode!==data.postalCode||normalize(p.street)!==expectedStreet||(number&&normalize(p.housenumber)!==normalize(number)))fail('failed-precondition','Eine Lieferadresse ist auf der Karte nicht eindeutig. Bitte Adresse prüfen oder manuell sortieren.');
 await db.prepare('INSERT OR IGNORE INTO address_locations VALUES (?,?,?,?,?)').bind(addressId,p.lat,p.lon,'Geoapify / OpenStreetMap',new Date().toISOString()).run();return {lat:p.lat,lon:p.lon};
}
export async function customerRouteAction(action,input,uid,p,env){
 const db=env.DB;
 if(action==='searchCustomers'){
  if(!hasRole(p,'driver')&&!hasRole(p,'office'))fail('permission-denied','Keine Kundensuche freigegeben.');fields(input,['query']);const query=normalize(text(input.query,80));if(query.length<3)return {customers:[]};
  const rows=(await db.prepare('SELECT id,data,last_delivered_at FROM customers WHERE instr(search_name,?)>0 ORDER BY last_delivered_at DESC LIMIT 10').bind(query).all()).results;return {customers:rows.map(row=>{const saved=JSON.parse(row.data);return {id:row.id,type:saved.type,name:saved.name,street:saved.street,postalCode:saved.postalCode,city:saved.city,phone:saved.phone,lastDeliveredAt:row.last_delivered_at};})};
 }
 if(action==='reorderStops')return saveOrder(db,uid,p,input);
 if(action==='prepareRouteAddress'){
  fields(input,['tourId','stopId']);await own(db,uid,input.tourId,p);if(typeof env.GEOAPIFY_API_KEY!=='string'||env.GEOAPIFY_API_KEY.length<10)fail('failed-precondition','Kostenlose Kartenberechnung wird noch eingerichtet. Manuelle Reihenfolge und Google Maps sind bereits verfügbar.');
  const row=await first(db,"SELECT data FROM stops WHERE tour_id=? AND id=? AND status='offen'",input.tourId,id(input.stopId));if(!row)fail('failed-precondition','Stopp wurde inzwischen geändert.');await location(db,JSON.parse(row.data),env.GEOAPIFY_API_KEY);return {prepared:true};
 }
 fields(input,['tourId','baseRevision','start']);await own(db,uid,input.tourId,p);
 if(!Number.isSafeInteger(input.baseRevision)||input.baseRevision<0)fail('invalid-argument','Tourversion prüfen.');
 if(typeof env.GEOAPIFY_API_KEY!=='string'||env.GEOAPIFY_API_KEY.length<10)fail('failed-precondition','Kostenlose Kartenberechnung wird noch eingerichtet. Manuelle Reihenfolge und Google Maps sind bereits verfügbar.');
 const rows=(await db.prepare("SELECT id,data FROM stops WHERE tour_id=? AND status='offen' ORDER BY created_at LIMIT 81").bind(input.tourId).all()).results;if(rows.length<2)fail('failed-precondition','Mindestens zwei offene Stopps erforderlich.');if(rows.length>80)fail('resource-exhausted','Diese Tour bitte in kleineren Abschnitten oder manuell sortieren.');
 let start=input.start;if(start){fields(start,['lat','lon']);if(!Number.isFinite(start.lat)||!Number.isFinite(start.lon)||start.lat<-90||start.lat>90||start.lon<-180||start.lon>180)fail('invalid-argument','Startposition prüfen.');}
 const addressIds=rows.map(row=>{const data=JSON.parse(row.data);return hash([normalize(data.street),data.postalCode,normalize(data.city)]);}),cached=(await db.prepare('SELECT id,lat,lon FROM address_locations WHERE id IN(SELECT value FROM json_each(?))').bind(JSON.stringify(addressIds)).all()).results,lookup=new Map(cached.map(p=>[p.id,p]));const positions=addressIds.map(id=>lookup.get(id));if(positions.some(p=>!p))fail('failed-precondition','Lieferadressen bitte zuerst für die Berechnung vorbereiten.');if(!start)start=positions[0];
 const credits=(rows.length+1)*Math.min(rows.length+1,10);await consumeCredits(db,credits);
 const url=new URL('https://api-eu.geoapify.com/v1/routeplanner');url.searchParams.set('apiKey',env.GEOAPIFY_API_KEY);
 const payload={mode:'drive',agents:[{start_location:[start.lon,start.lat]}],jobs:positions.map((pos,index)=>({id:String(index),location:[pos.lon,pos.lat]}))};
 const result=await providerFetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),actions=result.features?.[0]?.properties?.actions;
 const indexes=actions?.filter(a=>Number.isInteger(a.job_index)).map(a=>a.job_index);if(!indexes||indexes.length!==rows.length||new Set(indexes).size!==rows.length||indexes.some(i=>i<0||i>=rows.length))fail('unavailable','Kartenanbieter lieferte keine vollständige Reihenfolge. Vorige Reihenfolge bleibt erhalten.');
 const order=await saveOrder(db,uid,p,{tourId:input.tourId,baseRevision:input.baseRevision,stopIds:indexes.map(i=>rows[i].id)});return {...order,attribution:'Geoapify / OpenStreetMap',distance:result.features[0].properties.distance,time:result.features[0].properties.time};
}
