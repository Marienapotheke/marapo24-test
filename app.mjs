import { appConfig } from './app-config.js';
import { sealSignature, savePublicKey, getPublicKey, enqueue, pending, acknowledge, pendingError, saveAssignments, loadAssignments, clearAssignments } from './offline-store.mjs';
import { initializeAppCheck, ReCaptchaV3Provider } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app-check.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js';
import { getFirestore, collection, doc, addDoc, getDoc, query, where, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
const config=appConfig.firebase;
const TYPES=['Mosel','Hunsrück','Eifel','Morgentour Ärzte & Privatkunden','Partnerapotheken Bitburg/Badem','Zweite Morgentour Ärzte & Pflege'];
const $=id=>document.getElementById(id), esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const euro=c=>(Number(c||0)/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'});
const app=initializeApp(config),auth=getAuth(app),db=getFirestore(app,appConfig.databaseId),functions=getFunctions(app,appConfig.region);
if(appConfig.appCheckSiteKey)initializeAppCheck(app,{provider:new ReCaptchaV3Provider(appConfig.appCheckSiteKey),isTokenAutoRefreshEnabled:true});
const getEncryptionKey=httpsCallable(functions,'getDeliveryEncryptionKey');
const finishDelivery=httpsCallable(functions,'completeProtectedDelivery'),downloadProof=httpsCallable(functions,'downloadProtectedProof');
let employees=[],unsubEmployees=null,queue=[],syncing=false,profileData=null;
let role='',current=null,tours=[],stops={},selected=null,signStop=null,hasInk=false,writing=false,unsubTours=null,unsubStops=[];
function info(s){$('firebaseStatus').textContent=s}
function err(e){info('Fehler: '+(e?.code||e?.message||'Verbindung fehlgeschlagen')+'. Prüfe Firestore-Regeln und Internetverbindung.')}
function clearListeners(){if(unsubEmployees)unsubEmployees();unsubEmployees=null;employees=[];if(unsubTours)unsubTours();unsubTours=null;for(const u of unsubStops)u();unsubStops=[];tours=[];stops={};selected=null}
function requireOnline(){if(!navigator.onLine){alert('Keine Internetverbindung. Bitte online erneut versuchen.');return false}return true}
function display(){const ordered=[...tours].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
 if(role==='office'){
 $('tours').innerHTML=ordered.map(t=>`<div class="stop"><b>${esc(t.type||t.name||'Testtour')}</b> · ${esc(t.date||'ohne Datum')} · ${esc(employees.find(x=>x.id===t.driverId)?.displayName||'Fahrer')} <p>${(stops[t.id]||[]).length} Lieferungen</p><button data-edit="${esc(t.id)}">Öffnen</button></div>`).join('')||'<p>Noch keine Touren vorhanden.</p>';
 document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{selected=b.dataset.edit;display()});
 $('editPanel').classList.toggle('hidden',!selected);
 if(selected){const t=tours.find(x=>x.id===selected);if(!t){selected=null;$('editPanel').classList.add('hidden')}else{$('editTitle').textContent=(t.type||t.name||'Tour')+' · '+(t.date||'');$('officeStops').innerHTML=(stops[selected]||[]).map(s=>`<div class="stop ${s.status==='zugestellt'?'done':''}"><b>${esc(s.name)}</b> · ${esc(s.type)}<div>${esc(s.address)}</div><small>${euro(s.cents)} · ${esc(s.status)} ${s.proofId?'· Nachweis archiviert':''}</small>${s.proofId ? `<div style="margin-top:9px"><button type="button" data-proof="${esc(s.id)}">Zustellnachweis ansehen / PDF</button></div>` : ''}</div>`).join('')||'<p>Noch keine Lieferungen.</p>';document.querySelectorAll('[data-proof]').forEach(b=>b.onclick=()=>showProof(b.dataset.proof));}}
 }
 const old=$('driverTour').value;
 $('driverTour').innerHTML=ordered.map(t=>`<option value="${esc(t.id)}">${esc(t.date||'Testtour')} · ${esc(t.type||t.name||'Tour')}</option>`).join('');
 if(ordered.some(t=>t.id===old))$('driverTour').value=old;
 renderDriver();
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
  return `<div class="stop ${s.status==='zugestellt'?'done':''}"><b>${esc(s.name)}</b><div>${esc(s.address)}</div><small>${esc(s.type)} · ${euro(s.cents)} · ${esc(s.note)} · ${esc(status)}</small><div class="flex" style="margin-top:10px">${s.status==='offen'&&!waiting?`<button data-done="${esc(s.id)}">${s.type==='privat'?'Unterschrift & Zustellen':'Als zugestellt markieren'}</button><button class="secondary" data-fail="${esc(s.id)}">Nicht zugestellt</button>`:''}</div>${waiting?.error?'<p class="error">'+esc(waiting.error)+'</p>':''}${s.proofId?'<small>Sicher archiviert</small>':''}</div>`;
 }).join('')||'<p>Keine Stopps vorhanden.</p>';
 document.querySelectorAll('[data-done]').forEach(b=>b.onclick=()=>complete(b.dataset.done));
 document.querySelectorAll('[data-fail]').forEach(b=>b.onclick=()=>mark(b.dataset.fail,'nicht zugestellt'));
}
async function cacheCurrent(){
 if(role==='driver'&&current&&profileData?.active===true)
  await saveAssignments(current.uid,{profile:profileData,tours,stops}).catch(()=>info('Tourcache konnte nicht gespeichert werden. Offline-Neustart ist nicht verfügbar.'));
}
function listen(){
 const uid=current.uid;
 const q=role==='office'?collection(db,'protectedTours'):query(collection(db,'protectedTours'),where('driverId','==',uid));
 if(role==='office')unsubEmployees=onSnapshot(query(collection(db,'users'),where('role','==','driver'),where('active','==',true)),snap=>{
  employees=snap.docs.map(d=>({id:d.id,...d.data()}));
  const old=$('tourDriver').value;
  $('tourDriver').innerHTML='<option value="">Fahrer auswählen</option>'+employees.map(d=>`<option value="${esc(d.id)}">${esc(d.displayName||d.id)}</option>`).join('');
  if(employees.some(d=>d.id===old))$('tourDriver').value=old;
  display();
 },err);
 unsubTours=onSnapshot(q,{includeMetadataChanges:true},snap=>{
  if(current?.uid!==uid||snap.metadata.fromCache)return;
  tours=snap.docs.map(d=>({id:d.id,...d.data()}));
  for(const u of unsubStops)u();unsubStops=[];
  const oldStops=stops;stops={};
  for(const t of tours){
   stops[t.id]=oldStops[t.id]||[];
   unsubStops.push(onSnapshot(collection(db,'protectedTours',t.id,'stops'),{includeMetadataChanges:true},s=>{
    if(current?.uid!==uid||s.metadata.fromCache)return;
    stops[t.id]=s.docs.map(d=>({id:d.id,...d.data()}));display();cacheCurrent();
   },err));
  }
  display();cacheCurrent();info('Synchronisierung aktiv · '+(role==='office'?'Büro':'Fahrer')+' · '+tours.length+' Tour(en)');
 },err);
}
async function refreshQueue(){
 queue=current?await pending(current.uid):[];
 $('pendingStatus').textContent=queue.length?queue.length+' Abschluss/Abschlüsse warten auf Übertragung. '+(queue.some(x=>x.error)?'Bitte Hinweise bei den Lieferungen prüfen.':'Bei Funkloch Gerät bis zur Synchronisierung behalten.'):'Keine ausstehenden Abschlüsse.';
 $('syncNow').classList.toggle('hidden',role!=='driver'||queue.length===0);
 renderDriver();
}
async function syncPending(){
 if(syncing||!navigator.onLine||role!=='driver'||!current)return;
 syncing=true;const uid=current.uid;
 try{
  for(const item of await pending(uid)){
   if(current?.uid!==uid||role!=='driver')break;
   try{await finishDelivery(item.input);await acknowledge(uid,item.input.completionId);const stop=(stops[item.input.tourId]||[]).find(s=>s.id===item.input.stopId);if(stop)stop.status=item.input.status;await cacheCurrent()}
   catch(e){
    if(['functions/unavailable','functions/deadline-exceeded','functions/internal','functions/unknown'].includes(e.code))break;
    await pendingError(uid,item,'Übertragung nicht bestätigt: '+(e.code||'Verbindung prüfen')+'. Bitte Büro informieren; Nachweis bleibt verschlüsselt gespeichert.');
   }
  }
 }finally{syncing=false;await refreshQueue()}
}
async function mark(id,status,signature=null,tourId=$('driverTour').value){
 const uid=current?.uid,s=(stops[tourId]||[]).find(x=>x.id===id);
 if(role!=='driver'||!s||s.status!=='offen')return false;
 const capturedAt=new Date().toISOString(),completionId=crypto.randomUUID();
 try{
  const key=signature?await getPublicKey(uid):null;
  if(signature&&!key)throw Error('Vor der Abfahrt online anmelden und Verschlüsselungsschlüssel laden.');
  const identity={uid,tourId,stopId:id,completionId};
  const sealedSignature=signature?await sealSignature(key,identity,signature,capturedAt):null;
  await enqueue(uid,{tourId,stopId:id,status,sealedSignature,completionId,capturedAt});
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
$('driverTour').onchange=renderDriver;
const canvas=$('signature'),ctx=canvas.getContext('2d');function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height}}canvas.addEventListener('pointerdown',e=>{writing=true;canvas.setPointerCapture(e.pointerId);const p=point(e);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineWidth=3;ctx.lineCap='round';ctx.strokeStyle='#142f40'});canvas.addEventListener('pointermove',e=>{if(!writing)return;const p=point(e);ctx.lineTo(p.x,p.y);ctx.stroke();hasInk=true});canvas.addEventListener('pointerup',()=>writing=false);canvas.addEventListener('pointercancel',()=>writing=false);$('clearSig').onclick=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);hasInk=false};function clearSignature(){ctx.clearRect(0,0,canvas.width,canvas.height);hasInk=false;writing=false;signStop=null}
$('cancelSig').onclick=()=>{$('sigDialog').close();clearSignature()};
$('sigDialog').addEventListener('cancel',clearSignature);
$('saveSig').onclick=async()=>{
 if(!hasInk||!signStop)return alert('Bitte erst unterschreiben.');
 const target=signStop;$('saveSig').disabled=true;
 try{if(await mark(target.id,'zugestellt',canvas.toDataURL('image/png'),target.tourId)){$('sigDialog').close();clearSignature()}}
 finally{$('saveSig').disabled=false}
};
function network(){$('network').textContent=navigator.onLine?'Online':'Offline – Abschlüsse werden zwischengespeichert';if(navigator.onLine){if(current&&role&&!unsubTours)listen();syncPending();if(role==='driver'&&current){const uid=current.uid;getEncryptionKey({}).then(r=>savePublicKey(uid,r.data)).catch(()=>{})}}}addEventListener('online',network);addEventListener('offline',network);network();
$('loginForm').onsubmit=async e=>{e.preventDefault();$('loginButton').disabled=true;$('loginStatus').textContent='Anmeldung läuft …';try{await signInWithEmailAndPassword(auth,$('loginEmail').value.trim(),$('loginPassword').value);$('loginPassword').value=''}catch(e){$('loginStatus').textContent='Anmeldung fehlgeschlagen. Bitte Zugangsdaten prüfen.'}finally{$('loginButton').disabled=false}};
$('logoutButton').onclick=async()=>{try{const uid=current?.uid;if(uid&&(await pending(uid)).length&&!confirm('Es gibt ausstehende Abschlüsse auf diesem Gerät. Sie bleiben verschlüsselt gespeichert und werden erst nach erneuter Anmeldung dieses Kontos übertragen. Trotzdem abmelden?'))return;if(uid)await clearAssignments(uid);await signOut(auth)}catch(e){err(e)}};
setPersistence(auth,browserLocalPersistence).catch(err);
onAuthStateChanged(auth,async user=>{
 clearListeners();$('sigDialog').close();clearSignature();current=user;role='';profileData=null;queue=[];
 $('driverStops').textContent='';$('officeStops').textContent='';$('tours').textContent='';
 $('appMain').classList.add('hidden');$('sessionBar').classList.toggle('hidden',!user);$('authPanel').classList.toggle('hidden',!!user);
 if(!user){$('loginStatus').textContent='Bitte anmelden.';return}
 $('sessionUser').textContent='Angemeldet: '+(user.email||'Mitarbeiterkonto');
 try{
  if(navigator.onLine){
   const profile=await getDoc(doc(db,'users',user.uid));if(!profile.exists())throw Error('Benutzerprofil fehlt');profileData=profile.data();
  }else{
   const cache=await loadAssignments(user.uid);if(!cache)throw Error('Bitte vor der Abfahrt online anmelden und Touren laden.');
   profileData=cache.profile;tours=cache.tours;stops=cache.stops;
  }
  if(current?.uid!==user.uid)return;
  if(profileData.active!==true||!['office','driver'].includes(profileData.role))throw Error('Konto nicht freigegeben.');
  role=profileData.role;
  if(role==='office'&&!navigator.onLine)throw Error('Büro benötigt eine Internetverbindung.');
  $('appMain').classList.remove('hidden');$('officeTab').classList.toggle('hidden',role!=='office');$('driverTab').classList.toggle('hidden',role!=='office');$('office').classList.toggle('hidden',role!=='office');$('driver').classList.toggle('hidden',role!=='driver');
  await refreshQueue();display();
  if(navigator.onLine){
   listen();
   if(role==='driver'){try{const result=await getEncryptionKey({});await savePublicKey(user.uid,result.data);await syncPending()}catch(e){err(e)}}
  }else info('Offline: zuletzt geladene Touren verfügbar. Abschlüsse warten auf Übertragung.');
 }catch(e){err(e);role='';$('authPanel').classList.remove('hidden');$('appMain').classList.add('hidden');$('loginStatus').textContent=e.message||'Kein freigegebenes Benutzerprofil.'}
},err);
$('syncNow').onclick=syncPending;
setInterval(()=>{if(navigator.onLine)syncPending()},30000);
let installPrompt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('installApp').classList.remove('hidden')});$('installApp').onclick=async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('installApp').classList.add('hidden')};
if('serviceWorker'in navigator&&location.protocol!=='file:'){navigator.serviceWorker.register('./sw.js').catch(()=>info('Offline-Appstart konnte nicht eingerichtet werden.'))}
