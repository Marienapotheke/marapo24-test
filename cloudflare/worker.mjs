import envelope from '../functions/envelope.cjs';
import {purgeExpired,RETENTION_POLICY} from './retention.mjs';
import {payment,collected} from './payment.mjs';
import policy from '../functions/policy.cjs';
import {odometer,handover} from './tour-workflow.mjs';
import {validateCompletion} from './completion-policy.mjs';
import {editPackage} from './package-edit.mjs';
import {openWebEnvelope,deliveryKey} from './web-envelope.mjs';
import {validatePng} from './png.mjs';
import {authenticateIdentity,authenticateApp} from './auth.mjs';
import {officeSession,officePublicAction,officeAccountAction,isRecoveryAdmin} from './office-auth.mjs';
import {driverSession,driverPublicAction,driverAdminAction} from './driver-auth.mjs';
import {customerIdentity,customerRouteAction,addOrders} from './customers-routes.mjs';
import {fail,hasRole,requireRole,localDate,regularTours,weekday,fields,text,id,capture,packageData} from './domain.mjs';
const first=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const all=async(db,sql,...args)=>(await db.prepare(sql).bind(...args).all()).results;
const run=(db,sql,...args)=>db.prepare(sql).bind(...args).run();
const iso=()=>new Date().toISOString();
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))).map(x=>x.toString(16).padStart(2,'0')).join('');
function profile(row){return row?{uid:row.uid,displayName:row.display_name,roles:JSON.parse(row.roles),active:row.active===1,isAdmin:row.is_admin===1,canCreateSpecialTour:row.can_special===1}:null;}
function tour(row){return row?{id:row.id,type:row.type,date:row.date,regularType:row.regular_type,driverId:row.driver_id,createdBy:row.created_by,status:row.status,schemaVersion:2,createdAt:row.created_at,vehicleId:row.vehicle_id,vehicleLabel:row.vehicle_label,startedAt:row.started_at,endedAt:row.ended_at,startCapturedAtClient:row.start_captured,endCapturedAtClient:row.end_captured,startOdometerKm:row.start_odometer,endOdometerKm:row.end_odometer,workflowVersion:row.workflow_version}:null;}
function stop(row){if(!row)return null;const {_editVersion=0,...data}=JSON.parse(row.data);return {id:row.id,...data,...(row.payment_data?JSON.parse(row.payment_data):{}),editVersion:_editVersion,schemaVersion:2,status:row.status,createdAt:row.created_at,proofId:row.proof_id,completedAt:row.completed_at};}
async function ownTour(db,uid,input,p){requireRole(p,'driver');const row=await first(db,'SELECT * FROM tours WHERE id=?',id(input.tourId));if(!row)fail('not-found','Tour fehlt.');if(row.driver_id!==uid)fail('permission-denied','Tour ist einem anderen Fahrer zugewiesen.');return row;}
const activeDriver="EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='driver'))";
async function state(db,uid,p,input){
 fields(input,['view','date','workflowVersion']);if(input.workflowVersion!==undefined&&input.workflowVersion!==2)fail('invalid-argument','App-Version prüfen.');const date=input.date||localDate();weekday(date);
 const view=input.view||((hasRole(p,'office'))?'office':'driver');
 if(p?.active!==true)return {profile:p,tours:[],stops:{},vehicles:[],employees:[],catalog:[],specialTours:[],cash:[]};
 requireRole(p,view);
 const rows=view==='office'?await all(db,'SELECT * FROM tours WHERE date=? ORDER BY created_at LIMIT 101',date):await all(db,"SELECT * FROM tours WHERE driver_id=? AND (status!='finished' OR date=?) ORDER BY created_at LIMIT 101",uid,date);
 if(rows.length>100)fail('resource-exhausted','Zu viele Touren für den Testlauf. Bitte Büro informieren.');
 if(input.workflowVersion!==2&&rows.some(t=>t.workflow_version>=2&&t.status!=='finished'))fail('failed-precondition','Die App wurde aktualisiert. Nach Übertragung ausstehender Vorgänge alle MARAPO24-Fenster schließen und im WLAN neu öffnen.');
 const projection="SELECT s.*,json_object('collectedCents',json_extract(p.data,'$.collectedCents'),'collectionReason',json_extract(p.data,'$.collectionReason'),'collectionConfirmed',json_extract(p.data,'$.collectionConfirmed'),'deliveryMethod',json_extract(p.data,'$.deliveryMethod'),'nonDeliveryReason',json_extract(p.data,'$.nonDeliveryReason'),'neighborName',json_extract(p.data,'$.neighborName')) AS payment_data FROM stops s JOIN tours t ON t.id=s.tour_id LEFT JOIN proofs p ON p.id=s.proof_id ";
 const deliveries=view==='office'?await all(db,projection+'WHERE t.date=? ORDER BY s.created_at LIMIT 3001',date):await all(db,projection+"WHERE t.driver_id=? AND (t.status!='finished' OR t.date=?) ORDER BY s.created_at LIMIT 3001",uid,date);
 if(deliveries.length>3000)fail('resource-exhausted','Zu viele Päckchen für den Testlauf. Bitte Büro informieren.');
 const stops={};for(const t of rows)stops[t.id]=[];for(const s of deliveries)if(stops[s.tour_id])stops[s.tour_id].push(stop(s));
 const vehicles=await all(db,view==='office'?'SELECT * FROM vehicles LIMIT 101':'SELECT * FROM vehicles WHERE active=1 LIMIT 101');
 const employees=view==='office'?await all(db,"SELECT * FROM users WHERE active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='driver') LIMIT 101"):[];
 const reserved=await all(db,'SELECT id,regular_type,driver_id FROM tours WHERE date=? AND regular_type IS NOT NULL',view==='office'?date:localDate());
 const catalog=regularTours(view==='office'?date:localDate()).map(t=>{const r=reserved.find(x=>x.regular_type===t.id);return {...t,date:localDate(),reserved:!!r?.driver_id,prepared:!!r,mine:r?.driver_id===uid,tourId:(view==='office'||r?.driver_id===uid)?r?.id:null};});
 const specialTours=hasRole(p,'driver')?await all(db,"SELECT id,type,date FROM tours WHERE date=? AND regular_type IS NULL AND driver_id IS NULL AND status='open' LIMIT 101",localDate()):[];
 const totals={};for(const s of deliveries){const d=stop(s);if(s.status==='zugestellt')totals[d.origin]=(totals[d.origin]||0)+collected(d);}
 const tours=rows.map(tour);await addOrders(db,tours,stops);return {profile:p,tours,stops,vehicles:vehicles.map(v=>({id:v.id,label:v.label,active:v.active===1,createdAt:v.created_at})),employees:employees.map(u=>({id:u.uid,...profile(u)})),catalog,specialTours,cash:Object.entries(totals).map(([origin,cents])=>({origin,cents}))};
}
async function rpc(db,uid,p,action,input,env){
 if(action==='state')return state(db,uid,p,input);
 if(action==='updatePackage'||action==='deletePackage')return editPackage(db,uid,p,action,input);
 if(action==='prepareRegularTour'){
  requireRole(p,'office');fields(input,['date','typeId']);const option=regularTours(input.date).find(t=>t.id===input.typeId);if(!option)fail('invalid-argument','Reguläre Tour für diesen Tag auswählen.');
  const old=await first(db,'SELECT id FROM tours WHERE date=? AND regular_type=?',input.date,input.typeId);if(old)return {tourId:old.id};const tourId=crypto.randomUUID();
  try{const r=await run(db,`INSERT INTO tours(id,date,type,regular_type,created_by,status,created_at,workflow_version) SELECT ?,?,?,?,?,'open',?,2 WHERE EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='office'))`,tourId,input.date,option.label,input.typeId,uid,iso(),uid);if(r.meta.changes!==1)fail('permission-denied','Bürozugang nicht freigegeben.');}
  catch(e){const existing=await first(db,'SELECT id FROM tours WHERE date=? AND regular_type=?',input.date,input.typeId);if(existing)return {tourId:existing.id};throw e;}return {tourId};
 }
 if(action==='claimRegularTour'){
  requireRole(p,'driver');fields(input,['date','typeId','workflowVersion']);if(input.date!==localDate())fail('failed-precondition','Touren können nur für den heutigen Tag übernommen werden.');
  const option=regularTours(input.date).find(t=>t.id===input.typeId);if(!option)fail('invalid-argument','Diese Tour findet heute nicht statt.');
  const existing=await first(db,'SELECT * FROM tours WHERE date=? AND regular_type=?',input.date,input.typeId);
  if((!existing||existing.workflow_version>=2)&&input.workflowVersion!==2)fail('failed-precondition','Vor neuer Tour aktuelle App im WLAN neu öffnen.');
  if(existing){if(existing.driver_id===uid)return {tourId:existing.id};if(!existing.driver_id){const r=await run(db,`UPDATE tours SET driver_id=? WHERE id=? AND driver_id IS NULL AND status='open' AND ${activeDriver}`,uid,existing.id,uid);if(r.meta.changes===1)return {tourId:existing.id};}fail('already-exists','Diese Tour ist bereits übernommen.');}
  const tourId=crypto.randomUUID();
  try{const result=await run(db,`INSERT INTO tours(id,date,type,regular_type,driver_id,created_by,status,created_at,workflow_version) SELECT ?,?,?,?,?,?,'open',?,2 WHERE ${activeDriver}`,tourId,input.date,option.label,input.typeId,uid,uid,iso(),uid);if(result.meta.changes!==1)fail('permission-denied','Konto nicht freigegeben.');}
  catch(e){if(e instanceof policy.PolicyError)throw e;if(String(e).includes('UNIQUE'))fail('already-exists','Diese Tour wurde gerade von einem anderen Fahrer übernommen.');throw e;}
  return {tourId};
 }
 if(action==='createSpecialTour'){
  requireRole(p,'office');if(!p.canCreateSpecialTour)fail('permission-denied','Zusätzliche Touren dürfen nur ausdrücklich berechtigte Bürokräfte anlegen.');fields(input,['date','type']);weekday(input.date);const label=text(input.type,90,true),tourId=crypto.randomUUID();
  const result=await run(db,"INSERT INTO tours(id,date,type,created_by,status,created_at,workflow_version) SELECT ?,?,?,?,'open',?,2 WHERE EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND can_special=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='office'))",tourId,input.date,label,uid,iso(),uid);if(result.meta.changes!==1)fail('permission-denied','Berechtigung wurde geändert.');return {tourId};
 }
 if(action==='claimSpecialTour'){
  requireRole(p,'driver');fields(input,['tourId','workflowVersion']);id(input.tourId);const existing=await first(db,'SELECT driver_id,workflow_version FROM tours WHERE id=? AND date=? AND regular_type IS NULL',input.tourId,localDate());if(existing?.workflow_version>=2&&input.workflowVersion!==2)fail('failed-precondition','Vor neuer Tour aktuelle App im WLAN neu öffnen.');if(existing?.driver_id===uid)return {tourId:input.tourId};const result=await run(db,`UPDATE tours SET driver_id=? WHERE id=? AND date=? AND driver_id IS NULL AND regular_type IS NULL AND status='open' AND ${activeDriver}`,uid,input.tourId,localDate(),uid);if(result.meta.changes!==1)fail('already-exists','Zusatz-Tour nicht mehr verfügbar.');return {tourId:input.tourId};
 }
 if(action==='createPackage'){
  const office=hasRole(p,'office');let t;if(office){t=await first(db,'SELECT * FROM tours WHERE id=?',id(input.tourId));if(!t)fail('not-found','Tour fehlt.');}else t=await ownTour(db,uid,input,p);if(!['open','running'].includes(t.status)||(office&&t.status!=='open'))fail('failed-precondition',office?'Das Büro darf Päckchen nur vor Tourstart ergänzen.':'Beendete Touren können nicht ergänzt werden.');const data=packageData(input,tour(t)),stopId=crypto.randomUUID();
  const result=await run(db,`INSERT INTO stops(id,tour_id,data,status,created_at) SELECT ?,?,?,'offen',? WHERE EXISTS(SELECT 1 FROM tours WHERE id=? AND (status='open' OR (status='running' AND ?=0)) AND (driver_id=? OR ?=1)) AND EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value=?)) AND (SELECT count(*) FROM stops WHERE tour_id=?)<1000`,stopId,t.id,JSON.stringify(data),iso(),t.id,office?1:0,uid,office?1:0,uid,office?'office':'driver',t.id);
  if(result.meta.changes!==1)fail('failed-precondition','Tour beendet, Konto gesperrt oder Päckchengrenze erreicht.');return {stopId};
 }
 if(action==='createVehicle'||action==='updateVehicle'){
  requireRole(p,'office');fields(input,action==='createVehicle'?['label']:['vehicleId','active']);
  if(action==='createVehicle'){const vehicleId=crypto.randomUUID(),result=await run(db,"INSERT INTO vehicles SELECT ?,?,1,? WHERE EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='office'))",vehicleId,text(input.label,40,true),iso(),uid);if(result.meta.changes!==1)fail('permission-denied','Berechtigung wurde geändert.');return {vehicleId};}
  if(typeof input.active!=='boolean')fail('invalid-argument','Fahrzeugfreigabe prüfen.');const result=await run(db,"UPDATE vehicles SET active=? WHERE id=? AND EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='office'))",input.active?1:0,id(input.vehicleId),uid);if(!result.meta.changes)fail('not-found','Fahrzeug fehlt oder Berechtigung geändert.');return {updated:true};
 }
 if(action==='getDeliveryEncryptionKey'){requireRole(p,'driver');const key=deliveryKey(env.DELIVERY_PROOF_PRIVATE_KEY);return {version:1,keyId:key.keyId,publicKey:key.publicKey};}
 if(action==='startProtectedTour'||action==='finishProtectedTour'){
  fields(input,action==='startProtectedTour'?['tourId','vehicleId','completionId','capturedAt','odometerKm']:['tourId','completionId','capturedAt','odometerKm']);capture(input);const t=await ownTour(db,uid,input,p),fingerprint=await hash(input);
  const start=action==='startProtectedTour',savedId=start?t.start_id:t.end_id,savedHash=start?t.start_hash:t.end_hash;
  if(savedId===input.completionId&&savedHash===fingerprint)return start?{started:true}:{finished:true};
  let km=null;try{if(t.workflow_version>=2||input.odometerKm!==undefined)km=odometer(input.odometerKm);}catch(e){fail('invalid-argument',e.message+' Bitte aktuelle App öffnen.');}if(!start&&km!==null&&t.start_odometer!==null&&km<t.start_odometer)fail('invalid-argument','End-Kilometerstand darf nicht unter dem Start liegen.');
  if(start){
   if(t.status!=='open')fail('already-exists','Tour wurde bereits gestartet.');const v=await first(db,'SELECT * FROM vehicles WHERE id=? AND active=1',id(input.vehicleId));if(!v)fail('failed-precondition','Fahrzeug nicht freigegeben.');
   const result=await run(db,`UPDATE tours SET status='running',vehicle_id=?,vehicle_label=(SELECT label FROM vehicles WHERE id=?),started_at=?,start_captured=?,start_id=?,start_hash=?,start_odometer=? WHERE id=? AND driver_id=? AND status='open' AND ${activeDriver} AND EXISTS(SELECT 1 FROM vehicles WHERE id=? AND active=1) AND EXISTS(SELECT 1 FROM stops WHERE tour_id=?)`,v.id,v.id,iso(),input.capturedAt,input.completionId,fingerprint,km,t.id,uid,uid,v.id,t.id);if(!result.meta.changes){const fresh=await ownTour(db,uid,input,profile(await first(db,'SELECT * FROM users WHERE uid=?',uid)));if(fresh.start_id!==input.completionId||fresh.start_hash!==fingerprint)fail('failed-precondition','Vor Start Päckchen erfassen, Fahrzeug und Tour prüfen.');}return {started:true};
  }
  const result=await run(db,`UPDATE tours SET status='finished',ended_at=?,end_captured=?,end_id=?,end_hash=?,end_odometer=? WHERE id=? AND driver_id=? AND status='running' AND ${activeDriver} AND NOT EXISTS(SELECT 1 FROM stops WHERE tour_id=? AND status='offen')`,iso(),input.capturedAt,input.completionId,fingerprint,km,t.id,uid,uid,t.id);if(!result.meta.changes){const fresh=await ownTour(db,uid,input,profile(await first(db,'SELECT * FROM users WHERE uid=?',uid)));if(fresh.end_id!==input.completionId||fresh.end_hash!==fingerprint)fail('failed-precondition','Zuerst alle Päckchen abschließen und übertragen.');}return {finished:true};
 }
 if(action==='completeProtectedDelivery'){
  fields(input,['tourId','stopId','status','sealedSignature','completionId','capturedAt','collectedCents','collectionReason','deliveryMethod','nonDeliveryReason','neighborName']);capture(input);const t=await ownTour(db,uid,input,p),stopId=id(input.stopId),proofId=policy.identifiers(input),fingerprint=await hash(input);
  const existing=await first(db,'SELECT * FROM proofs WHERE id=?',proofId);if(existing){if(existing.driver_id===uid&&existing.completion_id===input.completionId&&existing.fingerprint===fingerprint)return {completed:true};fail('already-exists','Lieferung bereits abgeschlossen.');}
  if(t.status!=='running')fail('failed-precondition','Tour zuerst starten.');const s=await first(db,'SELECT * FROM stops WHERE id=? AND tour_id=?',stopId,t.id);if(!s)fail('not-found','Päckchen fehlt.');
  const opened=input.sealedSignature?await openWebEnvelope(input.sealedSignature,{uid,tourId:t.id,stopId,completionId:input.completionId},env.DELIVERY_PROOF_PRIVATE_KEY):{signature:null,capturedAt:input.capturedAt};if(opened.capturedAt!==input.capturedAt)fail('invalid-argument','Erfassungszeit verändert.');
  let receipt;try{receipt=payment(input,JSON.parse(s.data).cents,input.status);}catch(e){fail('invalid-argument',e.message);}
  let delivery;try{delivery=handover(input,JSON.parse(s.data).type);}catch(e){fail('invalid-argument',e.message);}validateCompletion({...input,...delivery},uid,tour(t),stop(s),opened.signature);if(opened.signature)await validatePng(opened.signature);
  const digest=opened.signature?Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',Buffer.from(opened.signature.slice(22),'base64')))).map(x=>x.toString(16).padStart(2,'0')).join(''):null;
  const packageInfo=JSON.parse(s.data);const data={...packageInfo,...receipt,...delivery,...customerIdentity(packageInfo),tourId:t.id,stopId,driverId:uid,status:input.status,completedAt:iso(),capturedAtClient:input.capturedAt,signature:opened.signature,signatureSha256:digest};
  try{await run(db,'INSERT INTO proofs VALUES (?,?,?,?,?,?,?)',proofId,t.id,stopId,uid,input.completionId,fingerprint,JSON.stringify(data));}
  catch(e){const winner=await first(db,'SELECT * FROM proofs WHERE id=?',proofId);if(winner){if(winner.driver_id===uid&&winner.completion_id===input.completionId&&winner.fingerprint===fingerprint)return {completed:true};fail('already-exists','Lieferung bereits abgeschlossen.');}throw e;}
  return {completed:true};
 }
 if(action==='downloadProtectedProof'){
  requireRole(p,'office');fields(input,['tourId','stopId']);const proofId=policy.identifiers(input),row=await first(db,"SELECT data FROM proofs WHERE id=? AND EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='office'))",proofId,uid);if(!row)fail('not-found','Nachweis fehlt oder Zugriff geändert.');return {proof:JSON.parse(row.data),filename:'Zustellnachweis-'+proofId+'.pdf'};
 }
 if(action==='listUsers'||action==='updateUser'){
  requireRole(p,'office');if(!p.isAdmin)fail('permission-denied','Nur die Administratorin darf Konten verwalten.');
  if(action==='listUsers'){fields(input,[]);return {users:(await all(db,'SELECT * FROM users ORDER BY display_name LIMIT 101')).map(profile)};}
  fields(input,['uid','displayName','roles','active']);if(typeof input.uid!=='string'||input.uid.length>128||!Array.isArray(input.roles)||!input.roles.length||input.roles.length>2||new Set(input.roles).size!==input.roles.length||input.roles.some(x=>!['office','driver'].includes(x))||typeof input.active!=='boolean')fail('invalid-argument','Kontofreigabe prüfen.');const target=await first(db,'SELECT * FROM users WHERE uid=?',input.uid);if(!target)fail('not-found','Konto zuerst sicher registrieren.');if(target.is_admin&&(input.active!==true||!input.roles.includes('office')))fail('failed-precondition','Administratorzugriff muss erhalten bleiben.');
  const result=await run(db,'UPDATE users SET display_name=?,roles=?,active=? WHERE uid=? AND EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND is_admin=1)',text(input.displayName,80,true),JSON.stringify(input.roles),input.active?1:0,input.uid,uid);if(result.meta.changes!==1)fail('permission-denied','Administratorzugriff wurde geändert.');return {updated:true};
 }
 fail('not-found','Vorgang nicht vorhanden.');
}
async function readInput(request){const reader=request.body?.getReader();if(!reader)return {};let size=0;const chunks=[];while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>300000){await reader.cancel();fail('resource-exhausted','Anfrage zu groß.');}chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}try{return JSON.parse(new TextDecoder().decode(bytes));}catch{fail('invalid-argument','Ungültige Anfrage.');}}
export default {
 async scheduled(controller,env){if(env.RETENTION_POLICY!==RETENTION_POLICY)return;const result=await purgeExpired(env.DB,{policy:env.RETENTION_POLICY});console.log(JSON.stringify({event:'retention',...result}));},
 async fetch(request,env){
  const url=new URL(request.url);if(!url.pathname.startsWith('/api/'))return env.ASSETS?env.ASSETS.fetch(request):new Response('Test app not built',{status:404});
  if(request.method!=='POST')return Response.json({error:{code:'invalid-argument',message:'POST required'}},{status:405});
  const origin=request.headers.get('Origin');if(origin&&origin!==url.origin)return Response.json({error:{code:'permission-denied',message:'Origin denied'}},{status:403,headers:{'Cache-Control':'no-store'}});
  try{
   const action=url.pathname.slice(5),input=await readInput(request);let result;
   if(['driverLoginOptions','driverPinLogin','driverPinLogout'].includes(action)){await authenticateApp(request,env);result=await driverPublicAction(action,input,request,env);}
   else if(['officePasswordLogin','officePasswordLogout','officeForgotPassword','officePasswordChallenge'].includes(action)){await authenticateApp(request,env);result=await officePublicAction(action,input,request,env);}
   else{
    let uid,kind,email,officeUsername,mustChange=false;
    if(request.headers.has('Authorization')){const identity=await authenticateIdentity(request,env);uid=identity.uid;email=identity.email;kind='firebase';}
    else {await authenticateApp(request,env);if((request.headers.get('Cookie')||'').includes('__Host-marapo24-office=')){const session=await officeSession(request,env);uid=session.uid;mustChange=session.mustChange;officeUsername=session.username;kind='office';}else{uid=await driverSession(request,env);kind='driver';}}
    let p=profile(await first(env.DB,'SELECT * FROM users WHERE uid=?',uid));
    if(p){p={...p,sessionKind:kind,loginEmail:email,mustChangePassword:mustChange,officeUsername};if(kind==='driver')p={...p,roles:p.roles.filter(r=>r==='driver'),isAdmin:false,canCreateSpecialTour:false};if(kind==='office')p={...p,roles:p.roles.filter(r=>r==='office')};p.canRecoverPasswords=isRecoveryAdmin(p,env);}
    if(mustChange&&!['changeOfficePassword','session'].includes(action))fail('failed-precondition','Bitte zuerst das vorläufige Passwort ändern.');
    if(action==='session'){fields(input,[]);result={data:{profile:p}};}
    else if(['changeOfficePassword','listPasswordRequests','resetOfficePassword'].includes(action))result=await officeAccountAction(action,input,request,env,p);
    else if(['authorizeDriverDevice','listDriverDevices','revokeDriverDevice','setDriverPin'].includes(action)){if(action==='setDriverPin'&&!isRecoveryAdmin(p,env))fail('permission-denied','Persönlicher Administratorzugang zum Zurücksetzen der Fahrer-PIN erforderlich.');result=await driverAdminAction(action,input,request,env,p);}
    else if(['searchCustomers','reorderStops','optimizeStops','prepareRouteAddress'].includes(action))result={data:await customerRouteAction(action,input,uid,p,env)};
    else result={data:await rpc(env.DB,uid,p,action,input,env)};
   }
   const headers=new Headers({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});for(const value of result.cookies||[])headers.append('Set-Cookie',value);return Response.json({data:result.data},{headers});
  }
  catch(e){const code=e instanceof policy.PolicyError?e.code:'unavailable';return Response.json({error:{code,message:e instanceof policy.PolicyError?e.message:'Vorgang nicht bestätigt. Daten bleiben auf dem Gerät. Bitte später erneut versuchen.'}},{status:code==='unauthenticated'?401:code==='permission-denied'?403:code==='already-exists'?409:code==='not-found'?404:code==='unavailable'?503:code==='resource-exhausted'?429:400,headers:{'Cache-Control':'no-store'}});}
 }
};
