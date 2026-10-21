import { appConfig } from './app-config.js';
import { sealSignature, savePublicKey, getPublicKey, enqueue, pending, acknowledge, pendingError, saveAssignments, loadAssignments, clearAssignments } from './offline-store.mjs';
import { initializeAppCheck, ReCaptchaV3Provider } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app-check.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, connectAuthEmulator, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js';
import { getFirestore, connectFirestoreEmulator, collection, doc, addDoc, updateDoc, getDoc, query, where, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
const config=appConfig.firebase;
const TYPES=['Mosel','Hunsrück','Eifel','Morgentour Ärzte & Privatkunden','Partnerapotheken Bitburg/Badem','Zweite Morgentour Ärzte & Pflege'];
const $=id=>document.getElementById(id), esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function stamp(value){if(!value)return 'noch nicht bestätigt';const date=typeof value==='string'?new Date(value):value.toDate?value.toDate():new Date((value.seconds||value._seconds)*1000);return Number.isNaN(date.getTime())?'Zeit prüfen':date.toLocaleString('de-DE')}
const euro=c=>(Number(c||0)/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'});
const app=initializeApp(config),auth=getAuth(app),db=getFirestore(app,appConfig.databaseId),functions=getFunctions(app,appConfig.region);
if(appConfig.emulators){if(!['127.0.0.1','localhost'].includes(location.hostname)||config.projectId!=='demo-marapo24')throw Error('Emulatoren sind ausschließlich im lokalen Demo-Projekt erlaubt.');connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',8080);connectFunctionsEmulator(functions,'127.0.0.1',5001)}
if(appConfig.appCheckSiteKey)initializeAppCheck(app,{provider:new ReCaptchaV3Provider(appConfig.appCheckSiteKey),isTokenAutoRefreshEnabled:true});
const startTourCall=httpsCallable(functions,'startProtectedTour'),finishTourCall=httpsCallable(functions,'finishProtectedTour');
const getEncryptionKey=httpsCallable(functions,'getDeliveryEncryptionKey');
const finishDelivery=httpsCallable(functions,'completeProtectedDelivery'),downloadProof=httpsCallable(functions,'downloadProtectedProof');
let vehicles=[],unsubVehicles=null,unsubProfile=null;
let employees=[],unsubEmployees=null,queue=[],syncing=false,profileData=null,sessionEpoch=0;
let role='',current=null,tours=[],stops={},selected=null,signStop=null,hasInk=false,writing=false,unsubTours=null,unsubStops=[];
function info(s){$('firebaseStatus').textContent=s}
function err(e){info('Fehler: '+(e?.message||'Vorgang konnte nicht bestätigt werden. Bitte Verbindung prüfen oder Büro kontaktieren.'))}
function clearListeners(){if(unsubProfile)unsubProfile();unsubProfile=null;if(unsubVehicles)unsubVehicles();unsubVehicles=null;vehicles=[];if(unsubEmployees)unsubEmployees();unsubEmployees=null;employees=[];if(unsubTours)unsubTours();unsubTours=null;for(const u of unsubStops)u();unsubStops=[];tours=[];stops={};selected=null}
function requireOnline(){if(!navigator.onLine){alert('Keine Internetverbindung. Bitte online erneut versuchen.');return false}return true}
function display(){const ordered=[...tours].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
 if(role==='office'){
 $('tours').innerHTML=ordered.map(t=>`<div class="stop"><b>${esc(t.type||t.name||'Testtour')}</b> · ${esc(t.date||'ohne Datum')} · ${esc(employees.find(x=>x.id===t.driverId)?.displayName||'Fahrer')}<p>${esc(t.vehicleLabel||'Fahrzeug noch nicht gewählt')} · Start (Gerät): ${esc(t.startCapturedAtClient||'offen')} · Ende (Gerät): ${esc(t.endCapturedAtClient||'offen')}<br>Server bestätigt: Start ${esc(stamp(t.startedAt))} · Ende ${esc(stamp(t.endedAt))}</p><p>${(stops[t.id]||[]).length} Lieferungen</p><button data-edit="${esc(t.id)}">Öffnen</button></div>`).join('')||'<p>Noch keine Touren vorhanden.</p>';
 document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{selected=b.dataset.edit;display()});
 $('editPanel').classList.toggle('hidden',!selected);
 if(selected){const t=tours.find(x=>x.id===selected);if(!t){selected=null;$('editPanel').classList.add('hidden')}else{$('editTitle').textContent=(t.type||t.name||'Tour')+' · '+(t.date||'');$('officeStops').innerHTML=(stops[selected]||[]).map(s=>`<div class="stop ${s.status==='zugestellt'?'done':''}"><b>${esc(s.name)}</b> · ${esc(s.type)}<div>${esc(s.address)}</div><small>${euro(s.cents)} · ${esc(s.status)} ${s.proofId?'· Nachweis archiviert':''}</small>${s.proofId ? `<div style="margin-top:9px"><button type="button" data-proof="${esc(s.id)}">Zustellnachweis ansehen / PDF</button></div>` : ''}</div>`).join('')||'<p>Noch keine Lieferungen.</p>';document.querySelectorAll('[data-proof]').forEach(b=>b.onclick=()=>showProof(b.dataset.proof));}}
 }
 const old=$('driverTour').value;
 $('driverTour').innerHTML=ordered.map(t=>`<option value="${esc(t.id)}">${esc(t.date||'Testtour')} · ${esc(t.type||t.name||'Tour')}</option>`).join('');
 if(ordered.some(t=>t.id===old))$('driverTour').value=old;
 renderDriver();renderTour();
}
async function showProof(stopId){
 if(role!=='office'||!selected||!requireOnline())return;
 try{
  const result=await downloadProof({tourId:selected,stopId});
  if(role!=='office')return;
  const bytes=Uint8Array.from(atob(result.data.base64),c=>c.charCodeAt(0));
  const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
  const link=document.createElement('a');link.href=url;link.download=result.data.filename;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
 }catch(e){err(e)}
}
function renderDriver(){
 const id=$('driverTour').value;
 if(!id){$('driverStops').innerHTML='<p>Keine zugewiesenen Touren vorhanden.</p>';return}
 $('driverStops').innerHTML=(stops[id]||[]).map(s=>{
  const waiting=queue.find(x=>x.input.tourId===id&&x.input.stopId===s.id);
  const status=waiting?(waiting.error?'Übertragung prüfen':'Übertragung ausstehend'):s.status;
  return `<div class="stop ${s.status==='zugestellt'?'done':''}"><b>${esc(s.name)}</b><div>${esc(s.address)}</div><small>${esc(s.type)} · ${euro(s.cents)} · ${esc(s.note)} · ${esc(status)}</small><div class="flex" style="margin-top:10px">${s.status==='offen'&&!waiting&&effectiveTourStatus(id)==='running'?`<button data-done="${esc(s.id)}">${s.type==='privat'?'Unterschrift & Zustellen':'Als zugestellt markieren'}</button><button class="secondary" data-fail="${esc(s.id)}">Nicht zugestellt</button>`:''}</div>${waiting?.error?'<p class="error">'+esc(waiting.error)+'</p>':''}${s.proofId?'<small>Sicher archiviert</small>':''}</div>`;
 }).join('')||'<p>Keine Stopps vorhanden.</p>';
 document.querySelectorAll('[data-done]').forEach(b=>b.onclick=()=>complete(b.dataset.done));
 document.querySelectorAll('[data-fail]').forEach(b=>b.onclick=()=>mark(b.dataset.fail,'nicht zugestellt'));
}
async function cacheCurrent(){
 if(role==='driver'&&current&&profileData?.active===true){
  await saveAssignments(current.uid,{profile:profileData,tours,stops,vehicles}).catch(()=>info('Tourcache konnte nicht gespeichert werden. Offline-Neustart ist nicht verfügbar.'));
  await offlineReadiness();
 }
}
async function offlineReadiness(){
 if(role!=='driver'||!current)return;
 const uid=current.uid;
 try{const [key,cache]=await Promise.all([getPublicKey(uid),loadAssignments(uid)]);if(current?.uid===uid&&role==='driver')$('offlineStatus').textContent=key&&cache?'Für Funklöcher vorbereitet. Ausstehende Abschlüsse anschließend übertragen.':'Noch nicht für Funklöcher vorbereitet. Bitte vor der Abfahrt mit Internet verbinden.';}
 catch(e){$('offlineStatus').textContent='Offline-Vorbereitung fehlgeschlagen. Bitte Büro kontaktieren.';}
}
function listen(){
 const uid=current.uid,epoch=sessionEpoch;
 const vehicleQuery=role==='office'?collection(db,'vehicles'):query(collection(db,'vehicles'),where('active','==',true));
 unsubVehicles=onSnapshot(vehicleQuery,{includeMetadataChanges:true},snap=>{
  if(current?.uid!==uid||sessionEpoch!==epoch||snap.metadata.fromCache)return;
  vehicles=snap.docs.map(d=>({id:d.id,...d.data()}));renderVehicles();renderTour();cacheCurrent();
 },err);
 const q=role==='office'?collection(db,'protectedTours'):query(collection(db,'protectedTours'),where('driverId','==',uid));
 if(role==='office')unsubEmployees=onSnapshot(query(collection(db,'users'),where('role','==','driver'),where('active','==',true)),snap=>{
  if(current?.uid!==uid||sessionEpoch!==epoch)return;
  employees=snap.docs.map(d=>({id:d.id,...d.data()}));
  const old=$('tourDriver').value;
  $('tourDriver').innerHTML='<option value="">Fahrer auswählen</option>'+employees.map(d=>`<option value="${esc(d.id)}">${esc(d.displayName||d.id)}</option>`).join('');
  if(employees.some(d=>d.id===old))$('tourDriver').value=old;
  display();
 },err);
 unsubTours=onSnapshot(q,{includeMetadataChanges:true},snap=>{
  if(current?.uid!==uid||sessionEpoch!==epoch||snap.metadata.fromCache)return;
  tours=snap.docs.map(d=>({id:d.id,...d.data()}));
  for(const u of unsubStops)u();unsubStops=[];
  const oldStops=stops;stops={};
  for(const t of tours){
   stops[t.id]=oldStops[t.id]||[];
   unsubStops.push(onSnapshot(collection(db,'protectedTours',t.id,'stops'),{includeMetadataChanges:true},s=>{
    if(current?.uid!==uid||sessionEpoch!==epoch||s.metadata.fromCache)return;
    stops[t.id]=s.docs.map(d=>({id:d.id,...d.data()}));display();cacheCurrent();
   },err));
  }
  display();cacheCurrent();info('Synchronisierung aktiv · '+(role==='office'?'Büro':'Fahrer')+' · '+tours.length+' Tour(en)');
 },err);
}
async function refreshQueue(){
 const uid=current?.uid,epoch=sessionEpoch,items=uid?await pending(uid):[];
 if(sessionEpoch!==epoch||current?.uid!==uid)return;
 queue=items;
 $('pendingStatus').textContent=queue.length?queue.length+' Abschluss/Abschlüsse warten auf Übertragung. '+(queue.some(x=>x.error)?'Bitte Hinweise bei den Lieferungen prüfen.':'Bei Funkloch Gerät bis zur Synchronisierung behalten.'):'Keine ausstehenden Abschlüsse.';
 $('syncNow').classList.toggle('hidden',role!=='driver'||queue.length===0);
 renderDriver();renderTour();
}
async function syncPending(){
 if(syncing||!navigator.onLine||role!=='driver'||!current)return;
 syncing=true;const uid=current.uid;
 try{
  const blockedTours=new Set();
  for(const item of await pending(uid)){
   if(blockedTours.has(item.input.tourId))continue;
   if(current?.uid!==uid||role!=='driver')break;
   try{
    const {action,...payload}=item.input;
    if(action==='start')await startTourCall(payload);
    else if(action==='finish')await finishTourCall(payload);
    else await finishDelivery(payload);
    await acknowledge(uid,item.input.completionId);
    const tour=tours.find(t=>t.id===item.input.tourId);
    if(action==='start'&&tour){tour.status='running';tour.vehicleId=payload.vehicleId;tour.vehicleLabel=vehicles.find(v=>v.id===payload.vehicleId)?.label||'';tour.startCapturedAtClient=payload.capturedAt}
    else if(action==='finish'&&tour){tour.status='finished';tour.endCapturedAtClient=payload.capturedAt}
    else {const stop=(stops[item.input.tourId]||[]).find(s=>s.id===item.input.stopId);if(stop)stop.status=item.input.status}
    await cacheCurrent();
   }
   catch(e){
    if(['functions/unavailable','functions/deadline-exceeded','functions/internal','functions/unknown'].includes(e.code))break;
    if(item.input.action==='start')blockedTours.add(item.input.tourId);
    await pendingError(uid,item,'Übertragung nicht bestätigt: '+(e.code||'Verbindung prüfen')+'. Bitte Büro informieren; Nachweis bleibt verschlüsselt gespeichert.');
   }
  }
 }finally{syncing=false;await refreshQueue()}
}
async function mark(id,status,signature=null,tourId=$('driverTour').value){
 const uid=current?.uid,s=(stops[tourId]||[]).find(x=>x.id===id);
 if(role!=='driver'||!s||s.status!=='offen'||effectiveTourStatus(tourId)!=='running'){info('Abschluss nicht gespeichert: Bitte aktive Tour und offenen Stopp prüfen.');return false;}
 const capturedAt=new Date().toISOString(),completionId=crypto.randomUUID();
 try{
  const key=signature?await getPublicKey(uid):null;
  if(signature&&!key)throw Error('Offline-Zustellung noch nicht vorbereitet. Bitte vor der Abfahrt mit Internet verbinden.');
  const identity={uid,tourId,stopId:id,completionId};
  const sealedSignature=signature?await sealSignature(key,identity,signature,capturedAt):null;
  await enqueue(uid,{action:'delivery',tourId,stopId:id,status,sealedSignature,completionId,capturedAt});
  await refreshQueue();info('Abschluss verschlüsselt auf diesem Gerät gespeichert. Übertragung wird versucht.');
  syncPending();return true;
 }catch(e){err(e);return false}
}
function complete(id){const s=(stops[$('driverTour').value]||[]).find(x=>x.id===id);if(!s||s.status!=='offen'||queue.some(x=>x.input.tourId===$('driverTour').value&&x.input.stopId===id))return;if(s.type!=='privat'){mark(id,'zugestellt');return}signStop={id,tourId:$('driverTour').value};hasInk=false;$('sigName').textContent=s.name;$('sigDialog').showModal();const c=$('signature');c.width=Math.max(300,Math.floor(c.getBoundingClientRect().width));c.height=150;c.getContext('2d').clearRect(0,0,c.width,c.height)}
for(const t of TYPES)$('tourType').add(new Option(t,t));$('tourDate').value=new Date().toLocaleDateString('sv-SE');
$('tourForm').onsubmit=async e=>{e.preventDefault();if(role!=='office'||!requireOnline())return;const b=e.submitter;if(b)b.disabled=true;try{const r=await addDoc(collection(db,'protectedTours'),{type:$('tourType').value,date:$('tourDate').value,driverId:$('tourDriver').value,createdBy:current.uid,status:'open',schemaVersion:2,createdAt:serverTimestamp()});selected=r.id;info('Tour erfolgreich synchronisiert')}catch(e){err(e)}finally{if(b)b.disabled=false}};
$('stopForm').onsubmit=async e=>{e.preventDefault();if(role!=='office'||!selected||!requireOnline())return;const cents=Math.round(Number($('amount').value)*100);if(!Number.isSafeInteger(cents)||cents<0)return alert('Ungültiger Betrag');const b=e.submitter;if(b)b.disabled=true;try{await addDoc(collection(db,'protectedTours',selected,'stops'),{type:$('type').value,name:$('name').value.trim(),address:$('address').value.trim(),note:$('note').value.trim(),cents,status:'offen',schemaVersion:2,proofId:null,completedAt:null,createdAt:serverTimestamp()});e.target.reset();info('Testlieferung synchronisiert')}catch(e){err(e)}finally{if(b)b.disabled=false}};
$('officeTab').onclick=()=>{$('office').classList.remove('hidden');$('driver').classList.add('hidden');display()};
$('driverTab').onclick=()=>{$('office').classList.add('hidden');$('driver').classList.remove('hidden');display()};
$('driverTour').onchange=()=>{renderDriver();renderTour()};
const canvas=$('signature'),ctx=canvas.getContext('2d');function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height}}canvas.addEventListener('pointerdown',e=>{writing=true;canvas.setPointerCapture(e.pointerId);const p=point(e);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineWidth=3;ctx.lineCap='round';ctx.strokeStyle='#142f40'});canvas.addEventListener('pointermove',e=>{if(!writing)return;const p=point(e);ctx.lineTo(p.x,p.y);ctx.stroke();hasInk=true});canvas.addEventListener('pointerup',()=>writing=false);canvas.addEventListener('pointercancel',()=>writing=false);$('clearSig').onclick=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);hasInk=false};function clearSignature(){ctx.clearRect(0,0,canvas.width,canvas.height);hasInk=false;writing=false;signStop=null}
$('cancelSig').onclick=()=>{$('sigDialog').close();clearSignature()};
$('sigDialog').addEventListener('cancel',clearSignature);
$('saveSig').onclick=async()=>{
 if(!hasInk||!signStop)return alert('Bitte erst unterschreiben.');
 const target=signStop;$('saveSig').disabled=true;$('sigStatus').textContent='Unterschrift wird verschlüsselt gespeichert …';
 try{if(await mark(target.id,'zugestellt',canvas.toDataURL('image/png'),target.tourId)){$('sigDialog').close();clearSignature()}else{$('sigStatus').textContent=$('firebaseStatus').textContent}}
 finally{$('saveSig').disabled=false}
};
function network(){$('network').textContent=navigator.onLine?'Online':'Offline – Abschlüsse werden zwischengespeichert';if(navigator.onLine){if(current&&role&&!unsubTours)listen();syncPending();if(role==='driver'&&current){const uid=current.uid;getEncryptionKey({}).then(r=>savePublicKey(uid,r.data)).catch(()=>{})}}}addEventListener('online',network);addEventListener('offline',network);network();
$('loginForm').onsubmit=async e=>{e.preventDefault();$('loginButton').disabled=true;$('loginStatus').textContent='Anmeldung läuft …';try{await signInWithEmailAndPassword(auth,$('loginEmail').value.trim(),$('loginPassword').value);$('loginPassword').value=''}catch(e){$('loginStatus').textContent='Anmeldung fehlgeschlagen. Bitte Zugangsdaten prüfen.'}finally{$('loginButton').disabled=false}};
$('logoutButton').onclick=async()=>{try{const uid=current?.uid;if(uid&&(await pending(uid)).length&&!confirm('Es gibt ausstehende Abschlüsse auf diesem Gerät. Sie bleiben verschlüsselt gespeichert und werden erst nach erneuter Anmeldung dieses Kontos übertragen. Trotzdem abmelden?'))return;if(uid)await clearAssignments(uid);await signOut(auth)}catch(e){err(e)}};
await setPersistence(auth,browserLocalPersistence).catch(err);
onAuthStateChanged(auth,async user=>{
 const epoch=++sessionEpoch;
 clearListeners();$('sigDialog').close();clearSignature();current=user;role='';profileData=null;queue=[];
 $('driverStops').textContent='';$('officeStops').textContent='';$('tours').textContent='';
 $('appMain').classList.add('hidden');$('sessionBar').classList.toggle('hidden',!user);$('authPanel').classList.toggle('hidden',!!user);
 if(!user){$('loginStatus').textContent='Bitte anmelden.';return}
 $('sessionUser').textContent='Angemeldet: '+(user.email||'Mitarbeiterkonto');
 try{
  if(!user.emailVerified)throw Error('Bitte zuerst die Mitarbeiter-E-Mail bestätigen.');
  let onlineProfile=false;
  if(navigator.onLine){
   let timer;
   try{const profile=await Promise.race([getDoc(doc(db,'users',user.uid)),new Promise((_,reject)=>timer=setTimeout(()=>reject(Object.assign(Error('Verbindung unterbrochen'),{code:'unavailable'})),8000))]);if(sessionEpoch!==epoch)return;if(!profile.exists())throw Error('Benutzerprofil fehlt');profileData=profile.data();onlineProfile=true}
   catch(e){if(e.code!=='unavailable'&&e.code!=='deadline-exceeded')throw e}
   finally{clearTimeout(timer)}
  }
  if(!onlineProfile){
   const cache=await loadAssignments(user.uid);if(sessionEpoch!==epoch)return;if(!cache)throw Error('Bitte vor der Abfahrt online anmelden und Touren laden.');
   profileData=cache.profile;tours=cache.tours;stops=cache.stops;vehicles=cache.vehicles||[];
  }
  if(current?.uid!==user.uid||sessionEpoch!==epoch)return;
  if(profileData.active!==true||!['office','driver'].includes(profileData.role))throw Error('Konto nicht freigegeben.');
  role=profileData.role;
  if(role==='office'&&!onlineProfile)throw Error('Büro benötigt eine Internetverbindung.');
  $('appMain').classList.remove('hidden');$('officeTab').classList.toggle('hidden',role!=='office');$('driverTab').classList.toggle('hidden',role!=='office');$('office').classList.toggle('hidden',role!=='office');$('driver').classList.toggle('hidden',role!=='driver');
  await refreshQueue();display();
  if(onlineProfile){
   listen();
   unsubProfile=onSnapshot(doc(db,'users',user.uid),snap=>{
    if(current?.uid!==user.uid||sessionEpoch!==epoch||snap.metadata.fromCache)return;
    if(!snap.exists()||snap.data().active!==true||snap.data().role!==role){
     $('sigDialog').close();clearSignature();
     clearAssignments(user.uid).catch(()=>{});role='';$('appMain').classList.add('hidden');$('authPanel').classList.remove('hidden');$('driverStops').textContent='';$('officeStops').textContent='';$('tours').textContent='';$('loginStatus').textContent='Zugriff wurde geändert. Bitte Büro kontaktieren und erneut anmelden.';
    }
   },err);
   if(role==='driver'){try{const result=await getEncryptionKey({});if(sessionEpoch!==epoch||current?.uid!==user.uid)return;await savePublicKey(user.uid,result.data);await offlineReadiness();await syncPending()}catch(e){if(sessionEpoch===epoch)err(e)}}
  }else {info('Offline: zuletzt geladene Touren verfügbar. Abschlüsse warten auf Übertragung.');await offlineReadiness();}
 }catch(e){if(sessionEpoch!==epoch)return;err(e);role='';$('authPanel').classList.remove('hidden');$('appMain').classList.add('hidden');$('loginStatus').textContent=e.message||'Kein freigegebenes Benutzerprofil.'}
},err);
$('syncNow').onclick=syncPending;
const reset=document.createElement('button');reset.type='button';reset.className='secondary';reset.textContent='Passwort einrichten / zurücksetzen';$('loginForm').after(reset);
reset.onclick=async()=>{try{const email=$('loginEmail').value.trim();if(!email)return alert('Bitte Mitarbeiter-E-Mail eingeben.');await sendPasswordResetEmail(auth,email);$('loginStatus').textContent='Falls ein Konto vorhanden ist, erhältst du eine E-Mail zum Einrichten des Passworts.'}catch(e){$('loginStatus').textContent='Versand fehlgeschlagen. E-Mail und Verbindung prüfen.'}};
const verify=document.createElement('button');verify.type='button';verify.className='secondary';verify.textContent='E-Mail bestätigen';reset.after(verify);
verify.onclick=async()=>{if(!auth.currentUser)return alert('Zuerst mit dem Mitarbeiterkonto anmelden.');try{await sendEmailVerification(auth.currentUser);$('loginStatus').textContent='Bestätigung wurde versendet. Bitte Link in der E-Mail öffnen und danach erneut anmelden.'}catch(e){$('loginStatus').textContent='Bestätigung konnte nicht versendet werden. Bitte später erneut versuchen.'}};
setInterval(()=>{if(navigator.onLine)syncPending()},30000);
let installPrompt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('installApp').classList.remove('hidden')});$('installApp').onclick=async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('installApp').classList.add('hidden')};
if('serviceWorker'in navigator&&location.protocol!=='file:'){navigator.serviceWorker.register('./sw.js').catch(()=>info('Offline-Appstart konnte nicht eingerichtet werden.'))}
function effectiveTourStatus(id){
 if(queue.some(x=>x.input.tourId===id&&x.input.action==='finish'))return 'finished';
 if(queue.some(x=>x.input.tourId===id&&x.input.action==='start'))return 'running';
 return tours.find(t=>t.id===id)?.status;
}
function renderVehicles(){
 const old=$('vehicleSelect').value;
 $('vehicleSelect').innerHTML='<option value="">Fahrzeug auswählen</option>'+vehicles.filter(v=>v.active).map(v=>`<option value="${esc(v.id)}">${esc(v.label)}</option>`).join('');
 if(vehicles.some(v=>v.id===old&&v.active))$('vehicleSelect').value=old;
 if(role==='office'){
  $('vehicles').innerHTML=vehicles.map(v=>`<div class="stop">${esc(v.label)} · ${v.active?'aktiv':'inaktiv'} <button type="button" class="secondary" data-car="${esc(v.id)}">${v.active?'Deaktivieren':'Aktivieren'}</button></div>`).join('');
  document.querySelectorAll('[data-car]').forEach(b=>b.onclick=async()=>{if(!requireOnline())return;const v=vehicles.find(x=>x.id===b.dataset.car);try{await updateDoc(doc(db,'vehicles',v.id),{active:!v.active})}catch(e){err(e)}});
 }
}
function renderTour(){
 const id=$('driverTour').value,tour=tours.find(t=>t.id===id),state=effectiveTourStatus(id);
 renderVehicles();
 const queuedStart=queue.find(x=>x.input.tourId===id&&x.input.action==='start');
 const queuedEnd=queue.find(x=>x.input.tourId===id&&x.input.action==='finish');
 if(tour?.vehicleId)$('vehicleSelect').value=tour.vehicleId;
 if(queuedStart)$('vehicleSelect').value=queuedStart.input.vehicleId;
 $('vehicleSelect').disabled=state!=='open';
 $('startTour').disabled=!tour||state!=='open';
 const outstanding=(stops[id]||[]).filter(s=>s.status==='offen'&&!queue.some(x=>x.input.tourId===id&&x.input.stopId===s.id&&x.input.action==='delivery')).length;
 $('finishTour').disabled=!tour||state!=='running'||outstanding>0;
 $('tourStatus').textContent=!tour?'Tour auswählen.':`Status: ${state==='open'?'Noch nicht gestartet':state==='running'?'Unterwegs':'Beendet'} · Start (Gerät): ${queuedStart?.input.capturedAt||tour.startCapturedAtClient||'offen'} · Ende (Gerät): ${queuedEnd?.input.capturedAt||tour.endCapturedAtClient||'offen'} · Server bestätigt: Start ${stamp(tour.startedAt)} / Ende ${stamp(tour.endedAt)}${queuedStart||queuedEnd?' · Übertragung ausstehend':''}${outstanding?' · '+outstanding+' offene Stopps':''}`;
}
async function queueTourAction(action){
 const uid=current?.uid,tourId=$('driverTour').value,tour=tours.find(t=>t.id===tourId);
 if(role!=='driver'||!uid||!tour)return;
 if(!navigator.onLine&&(!(await getPublicKey(uid))||!(await loadAssignments(uid))))return alert('Offline-Tourstart noch nicht vorbereitet. Bitte vor der Abfahrt mit Internet verbinden.');
 if(action==='start'&&(effectiveTourStatus(tourId)!=='open'||!$('vehicleSelect').value))return alert('Vor dem Tourstart ein Fahrzeug auswählen.');
 if(action==='finish'&&effectiveTourStatus(tourId)!=='running')return;
 const input={action,tourId,completionId:crypto.randomUUID(),capturedAt:new Date().toISOString()};
 if(action==='start')input.vehicleId=$('vehicleSelect').value;
 try{await enqueue(uid,input);await refreshQueue();syncPending()}catch(e){err(e)}
}
$('startTour').onclick=()=>queueTourAction('start');$('finishTour').onclick=()=>queueTourAction('finish');
$('vehicleForm').onsubmit=async e=>{e.preventDefault();if(role!=='office'||!requireOnline())return;const label=$('vehicleLabel').value.trim();if(!label)return;try{await addDoc(collection(db,'vehicles'),{label,active:true,createdAt:serverTimestamp()});e.target.reset()}catch(e){err(e)}};

