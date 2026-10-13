'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const backendRequire=require('node:module').createRequire(path.resolve('functions/package.json'));
const {initializeApp}=backendRequire('firebase-admin/app'),{getAuth}=backendRequire('firebase-admin/auth'),{getFirestore}=backendRequire('firebase-admin/firestore');
test('real browser: office setup, offline start/signature/end, offline reload and exactly-once sync', {timeout:180000},async()=>{
 assert.equal(process.env.GCLOUD_PROJECT,'demo-marapo24');assert.ok(process.env.FIRESTORE_EMULATOR_HOST);assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST);
 const app=initializeApp({projectId:'demo-marapo24'}),admin=getAuth(app),db=getFirestore(app);
 const officeId='browser-office',driverId='browser-driver',password='Fiktives-Passwort-123!';
 for(const [uid,role,name] of [[officeId,'office','Fiktives Büro'],[driverId,'driver','Fiktiver Browser-Fahrer']]){
  await admin.createUser({uid,emailVerified:true,email:uid+'@example.test',password});await db.doc('users/'+uid).set({role,active:true,displayName:name});
 }
 const allowed=['index.html','app.mjs','app-config.js','offline-store.mjs','sw.js','manifest.webmanifest'];
 const server=http.createServer((req,res)=>{
  const file=new URL(req.url,'http://127.0.0.1').pathname.slice(1)||'index.html';
  if(!allowed.includes(file)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.webmanifest')?'application/manifest+json':'text/javascript');
  if(file==='app-config.js')res.end('export const appConfig='+JSON.stringify({mode:'test',emulators:true,databaseId:'(default)',region:'europe-west3',appCheckSiteKey:'',firebase:{apiKey:'fake-api-key',authDomain:'demo-marapo24.firebaseapp.com',projectId:'demo-marapo24'}})+';');
  else res.end(fs.readFileSync(file));
 });
 await new Promise(resolve=>server.listen(4173,'127.0.0.1',resolve));
 let browser,driverPage;const failures=[],alerts=[];
 try{
  browser=await chromium.launch();
  const officeContext=await browser.newContext(),driverContext=await browser.newContext();
  const office=await officeContext.newPage();driverPage=await driverContext.newPage();
  office.on('pageerror',e=>failures.push(e.message));driverPage.on('pageerror',e=>failures.push(e.message));
  driverPage.on('dialog',async d=>{alerts.push(d.message());await d.dismiss();});
  async function login(page,id){await page.goto('http://127.0.0.1:4173');await page.locator('#loginEmail').fill(id+'@example.test');await page.locator('#loginPassword').fill(password);await page.locator('#loginButton').click();await page.locator('#appMain:not(.hidden)').waitFor({timeout:30000});}
  await login(office,officeId);
  await office.locator('#vehicleLabel').fill('Fiktives Testauto B');await office.locator('#vehicleForm button').click();
  await office.waitForFunction(()=>document.querySelector('#tourDriver option[value="browser-driver"]'));
  await office.locator('#tourDriver').selectOption(driverId);await office.locator('#tourForm button').click();
  await office.locator('#editPanel:not(.hidden)').waitFor();
  await office.locator('#name').fill('Erika Muster');await office.locator('#address').fill('Musterweg 1, Musterstadt');await office.locator('#stopForm button').click();
  await office.waitForFunction(()=>document.querySelector('#officeStops').textContent.includes('Erika Muster'));
  await login(driverPage,driverId);
  await driverPage.waitForFunction(()=>document.querySelector('#driverStops').textContent.includes('Erika Muster'));
  await driverPage.waitForFunction(async()=>{const m=await import('/offline-store.mjs');return Boolean(await m.getPublicKey('browser-driver'));},null,{timeout:30000});
  await driverPage.waitForFunction(()=>document.querySelectorAll('#vehicleSelect option').length>1);
  await driverPage.waitForFunction(async()=>!!(await import('/offline-store.mjs')).getPublicKey && !!(await (await import('/offline-store.mjs')).getPublicKey('browser-driver')));
  await driverPage.evaluate(()=>navigator.serviceWorker.ready);
  // A newly installed worker controls the next navigation reliably.
  await driverPage.reload();await driverPage.locator('#appMain:not(.hidden)').waitFor({timeout:30000});
  await driverPage.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await driverPage.waitForFunction(()=>document.querySelector('#driverStops').textContent.includes('Erika Muster'));
  const car=await driverPage.locator('#vehicleSelect option').nth(1).getAttribute('value');await driverPage.locator('#vehicleSelect').selectOption(car);
  await driverContext.setOffline(true);await driverPage.locator('#startTour').click();
  await driverPage.locator('[data-done]').waitFor();await driverPage.locator('[data-done]').click();
  const box=await driverPage.locator('#signature').boundingBox();
  await driverPage.mouse.move(box.x+20,box.y+30);await driverPage.mouse.down();await driverPage.mouse.move(box.x+120,box.y+70,{steps:20});await driverPage.mouse.up();
  await driverPage.locator('#saveSig').click();await driverPage.waitForFunction(()=>!document.querySelector('#sigDialog').open);
  await driverPage.locator('#finishTour').click();
  await driverPage.waitForFunction(()=>document.querySelector('#pendingStatus').textContent.startsWith('3 '));
  const stored=await driverPage.evaluate(async()=>{const m=await import('/offline-store.mjs');return JSON.stringify(await m.pending('browser-driver'));});
  assert.equal(stored.includes('data:image/png'),false);assert.equal(stored.includes('Erika Muster'),false);
  await driverPage.reload();await driverPage.locator('#appMain:not(.hidden)').waitFor({timeout:30000});
  assert.ok((await driverPage.locator('#pendingStatus').textContent()).startsWith('3 '));
  assert.equal(await driverPage.locator('[data-done]').count(),0);
  await driverContext.setOffline(false);await driverPage.locator('#syncNow').click();
  await driverPage.waitForFunction(()=>document.querySelector('#pendingStatus').textContent==='Keine ausstehenden Abschlüsse.',null,{timeout:40000});
  const tours=await db.collection('protectedTours').where('driverId','==',driverId).get();assert.equal(tours.size,1);
  const tour=tours.docs[0].data();assert.equal(tour.status,'finished');assert.equal(tour.vehicleLabel,'Fiktives Testauto B');assert.ok(tour.startedAt&&tour.endedAt);
  const proofs=await db.collection('protectedDeliveryProofs').where('driverId','==',driverId).get();assert.equal(proofs.size,1);assert.match(proofs.docs[0].data().signature,/^data:image\/png/);
  await office.locator('[data-proof]').waitFor({timeout:15000});
  const [download]=await Promise.all([office.waitForEvent('download'),office.locator('[data-proof]').click()]);
  const file=await download.path();assert.equal(fs.readFileSync(file).subarray(0,5).toString(),'%PDF-');
  assert.deepEqual(failures,[]);
 }catch(e){if(driverPage){console.error('Fictional browser diagnostics:',JSON.stringify({failures,alerts,state:await driverPage.evaluate(async()=>({status:document.querySelector('#firebaseStatus')?.textContent,pending:document.querySelector('#pendingStatus')?.textContent,tour:document.querySelector('#tourStatus')?.textContent,captureStatus:document.querySelector('#sigStatus')?.textContent,saveDisabled:document.querySelector('#saveSig')?.disabled,stops:document.querySelector('#driverStops')?.textContent,dialogOpen:document.querySelector('#sigDialog')?.open,queue:(await (await import('/offline-store.mjs')).pending('browser-driver')).map(x=>({action:x.input.action,error:x.error}))})).catch(()=>null)}));fs.mkdirSync('artifacts',{recursive:true});await driverPage.screenshot({path:'artifacts/browser-failure.png',fullPage:true}).catch(()=>{});}throw e;}
 finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
});
