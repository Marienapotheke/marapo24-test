import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fixtureRuntime} from './fixture-runtime.mjs';
import {regularTours,localDate,packageData} from './domain.mjs';
import {sealSignature} from '../offline-store.mjs';
import {payment} from './payment.mjs';
const require=createRequire(import.meta.url),{PNG}=require('../functions/node_modules/pngjs');
let f,winner,loser,tourId,privateStop,failedStop,signature,winInput;
const capture=()=>({completionId:crypto.randomUUID(),capturedAt:new Date().toISOString()});
const delivery=type=>({tourId,type,origin:'Marienapotheke',name:'Erika Muster',street:'Musterweg 1',postalCode:'54321',city:'Musterstadt',phone:'',note:'',cents:150,paymentReason:''});
before(async()=>{f=await fixtureRuntime();const png=new PNG({width:360,height:150});png.data.fill(255);for(let i=20;i<200;i++){const p=(60*360+i)*4;png.data[p]=png.data[p+1]=png.data[p+2]=0;}signature='data:image/png;base64,'+PNG.sync.write(png).toString('base64');});
after(async()=>{if(f)await f.runtime.dispose();});
test('weekday calendar matches confirmed Monday, Wednesday, Saturday and Sunday tours',()=>{
 assert.deepEqual(regularTours('2026-10-12').map(t=>t.id),['doctor1','hunsrueck','eifel','mosel']);
 assert.deepEqual(regularTours('2026-10-14').map(t=>t.id),['doctor1','doctor2','partner','hunsrueck','eifel','mosel']);
 assert.deepEqual(regularTours('2026-10-16').map(t=>t.id),['doctor1','doctor2','partner','hunsrueck','eifel','mosel']);
 assert.deepEqual(regularTours('2026-10-17').map(t=>t.id),['saturday']);assert.deepEqual(regularTours('2026-10-18'),[]);
 assert.throws(()=>regularTours('2026-02-30'));
 const parcel={tourId:'fictional-tour',type:'privat',origin:'Marienapotheke',name:'Erika Muster',street:'Musterweg 1',postalCode:'54321',city:'Musterstadt',cents:0};
 assert.equal(packageData(parcel,{regularType:'saturday'}).type,'privat');assert.throws(()=>packageData({...parcel,type:'arzt'},{regularType:'saturday'}));
});
test('eleven driver roles and twenty office roles are supported without fixed employee IDs',async()=>{
 for(const uid of ['driver-a','driver-b','dual',...Array.from({length:8},(_,i)=>'driver-'+(i+4))])assert.equal((await f.call(uid,'state',{view:'driver'})).status,200);
 for(const uid of ['office','admin','dual',...Array.from({length:17},(_,i)=>'office-'+(i+4))])assert.equal((await f.call(uid,'state',{view:'office'})).status,200);
});
test('signed Firebase identity and App Check required; forged, expired and wrong-project tokens denied',async()=>{
 assert.equal((await f.call('driver-a','state')).status,200);
 for(const auth of ['not-a-token',f.authToken('driver-a',{exp:0}),f.authToken('driver-a',{aud:'other'}),f.authToken('driver-a',{email_verified:false}),f.authToken('driver-a',{},{alg:'HS256'})])assert.equal((await f.call('driver-a','state',{}, {auth})).status,401);
 assert.equal((await f.call('driver-a','state',{}, {app:'forged'})).status,401);
 const jwt=f.authToken('driver-a').split('.'),sig=Buffer.from(jwt[2],'base64url');sig[0]^=1;
 assert.equal((await f.call('driver-a','state',{}, {auth:jwt[0]+'.'+jwt[1]+'.'+sig.toString('base64url')})).status,401);
 assert.equal((await f.call('driver-a','state',{}, {app:f.appToken({aud:['projects/other']})})).status,401);
 assert.equal((await f.call('driver-a','state',{}, {headers:{Origin:'https://other.invalid'}})).status,403);
 assert.equal((await f.call('driver-a','state',{uid:'admin',isAdmin:true})).status,400);
});
test('two drivers race for one daily tour: precisely one reservation succeeds',async()=>{
 const typeId=regularTours(localDate())[0]?.id;let action='claimRegularTour',input={date:localDate(),typeId};
 if(!typeId){const extra=await f.call('admin','createSpecialTour',{date:localDate(),type:'Fiktive Sonntags-Sondertour'});action='claimSpecialTour';input={tourId:extra.body.data.tourId};}
 const results=await Promise.all(['driver-a','driver-b'].map(uid=>f.call(uid,action,input)));
 assert.deepEqual(results.map(x=>x.status).sort(),[200,409]);const index=results.findIndex(x=>x.status===200);winner=['driver-a','driver-b'][index];loser=['driver-a','driver-b'][1-index];tourId=results[index].body.data.tourId;
 assert.equal((await f.call(winner,action,input)).body.data.tourId,tourId);
 assert.equal((await f.call(loser,'state')).body.data.tours.length,0);
 assert.equal((await f.call(loser,'createPackage',{...delivery('privat')})).status,403);
});
test('driver captures packages with pharmacy, address and optional fields; office special-tour capability is separate',async()=>{
 const created=await f.call(winner,'createPackage',delivery('privat'));assert.equal(created.status,200);privateStop=created.body.data.stopId;
 const failed=await f.call(winner,'createPackage',{...delivery('privat'),origin:'Cusanus-Apotheke',cents:500});assert.equal(failed.status,200);failedStop=failed.body.data.stopId;
 assert.equal((await f.call(winner,'createPackage',{...delivery('privat'),signature:'forged'})).status,400);
 assert.equal((await f.call('office','createSpecialTour',{date:localDate(),type:'Fiktive Sondertour'})).status,403);
 assert.equal((await f.call('admin','createSpecialTour',{date:localDate(),type:'Fiktive Sondertour'})).status,200);
 const dual=await f.call('dual','state',{view:'office'});assert.equal(dual.status,200);assert.equal((await f.call('dual','state',{view:'driver'})).status,200);
});
test('tour start documents vehicle and device/server time; late packages permitted while premature finish denied',async()=>{
 const input={tourId,vehicleId:'car1',odometerKm:1000,...capture()};assert.deepEqual((await Promise.all([1,2].map(()=>f.call(winner,'startProtectedTour',input)))).map(r=>r.status),[200,200]);
 const late=await f.call(winner,'createPackage',delivery('privat'));assert.equal(late.status,200);assert.equal((await f.call(winner,'completeProtectedDelivery',{tourId,stopId:late.body.data.stopId,status:'nicht zugestellt',...capture()})).status,200);
 assert.equal((await f.call(winner,'finishProtectedTour',{tourId,odometerKm:1010,...capture()})).status,400);
 const t=(await f.call(winner,'state')).body.data.tours[0];assert.equal(t.vehicleLabel,'Fiktives Testauto');assert.ok(t.startedAt);assert.equal(t.startCapturedAtClient,input.capturedAt);
});
test('payment rejects impossible amounts and requires a reason for unpaid delivery',()=>{
 for(const input of [{collectedCents:-1,collectionReason:''},{collectedCents:151,collectionReason:''},{collectedCents:1.5,collectionReason:''},{collectedCents:0,collectionReason:''},{collectedCents:150,collectionReason:'Kein Geld vorhanden'}])assert.throws(()=>payment(input,150,'zugestellt'));
 assert.throws(()=>payment({collectedCents:50,collectionReason:''},150,'nicht zugestellt'));
 assert.deepEqual(payment({collectedCents:0,collectionReason:'Kein Geld vorhanden'},150,'zugestellt'),{collectedCents:0,collectionReason:'Kein Geld vorhanden',collectionConfirmed:true});
 assert.equal(payment({},150,'zugestellt').collectionConfirmed,false);
});
test('backend rejects cash on a failed delivery without archiving it',async()=>{
 const input={tourId,stopId:failedStop,status:'nicht zugestellt',sealedSignature:null,...capture(),collectedCents:100,collectionReason:''};
 assert.equal((await f.call(winner,'completeProtectedDelivery',input)).status,400);
 assert.equal((await f.db.prepare('SELECT status FROM stops WHERE id=?').bind(failedStop).first()).status,'offen');
});
test('parallel encrypted deliveries create exactly one immutable proof; retry has no signature response',async()=>{
 const key=(await f.call(winner,'getDeliveryEncryptionKey')).body.data;assert.equal('privateKey' in key,false);
 const variants=await Promise.all([1,2].map(async()=>{const c=capture(),identity={uid:winner,tourId,stopId:privateStop,completionId:c.completionId};return {tourId,stopId:privateStop,status:'zugestellt',collectedCents:50,collectionReason:'Nur Teilbetrag vorhanden',...c,sealedSignature:await sealSignature(key,identity,signature,c.capturedAt)};}));
 const results=await Promise.all(variants.map(input=>f.call(winner,'completeProtectedDelivery',input)));assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);winInput=variants[results.findIndex(r=>r.status===200)];
 assert.deepEqual((await f.call(winner,'completeProtectedDelivery',winInput)).body.data,{completed:true});
 assert.equal((await f.call(winner,'completeProtectedDelivery',{...winInput,collectedCents:100})).status,409);
 const state=(await f.call(winner,'state')).body.data;assert.equal(JSON.stringify(state).includes('data:image/png'),false);assert.equal(state.stops[tourId].find(s=>s.id===privateStop).status,'zugestellt');
 await assert.rejects(f.db.prepare('UPDATE proofs SET data=?').bind('{}').run());await assert.rejects(f.db.prepare('DELETE FROM proofs').run());
});
test('only office sees archived proof; failed delivery needs no explanation and contributes no cash',async()=>{
 assert.equal((await f.call(winner,'downloadProtectedProof',{tourId,stopId:privateStop})).status,403);
 const proof=await f.call('office','downloadProtectedProof',{tourId,stopId:privateStop});assert.equal(proof.status,200);assert.equal(proof.body.data.proof.signature,signature);assert.match(proof.body.data.filename,/\.pdf$/);
 const input={tourId,stopId:failedStop,status:'nicht zugestellt',sealedSignature:null,...capture()};assert.equal((await f.call(winner,'completeProtectedDelivery',input)).status,200);
 const end={tourId,odometerKm:1010,...capture()};assert.deepEqual((await Promise.all([1,2].map(()=>f.call(winner,'finishProtectedTour',end)))).map(r=>r.status),[200,200]);
 const state=(await f.call('office','state')).body.data;assert.deepEqual(state.cash,[{origin:'Marienapotheke',cents:50}]);const paid=state.stops[tourId].find(s=>s.id===privateStop);assert.equal(paid.collectedCents,50);assert.equal(paid.collectionReason,'Nur Teilbetrag vorhanden');assert.equal(proof.body.data.proof.collectedCents,50);
});
test('administrator manages existing roles; privilege flags and administrator access cannot be self-assigned',async()=>{
 assert.equal((await f.call('office','listUsers')).status,403);
 assert.equal((await f.call('admin','updateUser',{uid:loser,displayName:'Fiktiv geändert',roles:['driver','office'],active:true,isAdmin:true})).status,400);
 assert.equal((await f.call('admin','updateUser',{uid:loser,displayName:'Fiktiv geändert',roles:['driver','office'],active:true})).status,200);
 assert.equal((await f.call(loser,'createSpecialTour',{date:localDate(),type:'Nicht erlaubt'})).status,403);
 assert.equal((await f.call('admin','updateUser',{uid:'admin',displayName:'Fiktiver Admin',roles:['driver'],active:false})).status,400);
});
test('role revocation blocks completion retry and office archive access',async()=>{
 await f.db.prepare('UPDATE users SET active=0 WHERE uid=?').bind(winner).run();assert.equal((await f.call(winner,'completeProtectedDelivery',winInput)).status,403);
 await f.db.prepare('UPDATE users SET active=0 WHERE uid=?').bind('office').run();assert.equal((await f.call('office','downloadProtectedProof',{tourId,stopId:privateStop})).status,403);
});
