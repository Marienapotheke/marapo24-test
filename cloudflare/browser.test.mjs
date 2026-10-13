import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fixtureRuntime} from './fixture-runtime.mjs';
import {regularTours,localDate} from './domain.mjs';
const require=createRequire(import.meta.url),{chromium}=require('playwright'),backendRequire=createRequire(path.resolve('functions/package.json'));
test('free pilot tablet: claim, capture pharmacies, offline start/sign/end, restart, office PDF and safe shared-device logout',{timeout:180000},async()=>{
 const f=await fixtureRuntime();
 const issue=await f.call('admin','resetOfficePassword',{uid:'office',username:'erika.muster'}),password=issue.body.data.temporaryPassword;
 for(const [uid,pin] of [['driver-a','642893'],['driver-b','819264']])assert.equal((await f.call('admin','setDriverPin',{uid,pin})).status,200);
 const paired=await f.runtime.dispatchFetch('https://fictional.invalid/api/authorizeDriverDevice',{method:'POST',headers:{Authorization:'Bearer '+f.authToken('admin'),'X-Firebase-AppCheck':f.appToken(),'Content-Type':'application/json'},body:JSON.stringify({label:'Fiktives Testtablet'})});assert.equal(paired.status,200);const deviceToken=paired.headers.get('set-cookie').split(';')[0].split('=')[1];
 if(!regularTours(localDate()).length)await f.call('admin','createSpecialTour',{date:localDate(),type:'Fiktive Sonntags-Sondertour'});
 const files=new Set(['index.html','password-proof.mjs','app.mjs','app-config.js','offline-store.mjs','office-pdf.mjs','sw.js','manifest.webmanifest']);
 let loseStartReceipt=true,notifyLostReceipt;const lostReceipt=new Promise(resolve=>notifyLostReceipt=resolve);
 const server=http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://127.0.0.1:4174');
   if(url.pathname.startsWith('/api/')){
    // LOCAL TEST BRIDGE: validate emulator identity, then sign a synthetic token.
    // Production Worker accepts only Google-signed tokens; bridge is never deployed.
    if(req.headers.authorization)throw Error('Cookie-only browser test');
    let body='';for await(const chunk of req)body+=chunk;
    const response=await f.runtime.dispatchFetch(url.href,{method:'POST',headers:{'Content-Type':'application/json','X-Firebase-AppCheck':req.headers['x-firebase-appcheck'],Cookie:(req.headers.cookie||'').replaceAll('local-marapo24-','__Host-marapo24-'),...(req.headers.origin?{Origin:req.headers.origin}:{})},body});
    if(url.pathname==='/api/startProtectedTour'&&response.status===200&&loseStartReceipt){loseStartReceipt=false;res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:{code:'unavailable',message:'Fiktiv verlorene Bestätigung'}}));notifyLostReceipt();return;}
    const cookies=response.headers.getSetCookie().map(s=>s.replaceAll('__Host-marapo24-','local-marapo24-').replace('; Secure',''));res.writeHead(response.status,{'Content-Type':'application/json','Cache-Control':'no-store',...(cookies.length?{'Set-Cookie':cookies}:{})});res.end(Buffer.from(await response.arrayBuffer()));return;
   }
   const file=url.pathname.slice(1)||'index.html';if(!files.has(file)){res.writeHead(404);res.end();return;}
   res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('webmanifest')?'application/manifest+json':'text/javascript');
   if(file==='app-config.js')res.end('export const appConfig='+JSON.stringify({mode:'test',backend:'cloudflare',emulators:true,testAppCheckToken:f.appToken(),appCheckSiteKey:'',firebase:{projectId:'demo-marapo24',apiKey:'fake-api-key',authDomain:'demo-marapo24.firebaseapp.com'}})+';');
   else res.end(fs.readFileSync(path.join('dist-cloudflare',file)));
  }catch{res.writeHead(401,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{code:'unauthenticated',message:'Fictional bridge identity rejected'}}));}
 });
 await new Promise(resolve=>server.listen(4174,'127.0.0.1',resolve));let browser,page;const errors=[];
 try{
  browser=await chromium.launch();const tabletContext=await browser.newContext({viewport:{width:768,height:1024},isMobile:true,hasTouch:true}),officeContext=await browser.newContext();page=await tabletContext.newPage();const office=await officeContext.newPage();
  await tabletContext.addCookies([{name:'local-marapo24-device',value:deviceToken,url:'http://127.0.0.1:4174',httpOnly:true,sameSite:'Strict'}]);
  for(const p of [page,office])p.on('pageerror',e=>errors.push(e.message));
  async function login(p,uid){await p.goto('http://127.0.0.1:4174');if(uid==='office'){await p.locator('#chooseOffice').click();await p.locator('#officeUsername').fill('erika.muster');await p.locator('#officePassword').fill(password);await p.locator('#officeLoginButton').click();await p.locator('#passwordChangePanel:not(.hidden)').waitFor();assert.equal(await p.locator('#app:not(.hidden)').count(),0);await p.locator('#newPassword').fill('Fiktive-persoenliche-Passphrase-456!');await p.locator('#confirmPassword').fill('Fiktive-persoenliche-Passphrase-456!');await p.locator('#passwordChangeForm button').click();await p.locator('#officePassword').fill('Fiktive-persoenliche-Passphrase-456!');await p.locator('#officeLoginButton').click();}else{await p.locator('#driverName').selectOption(uid);await p.locator('#driverPin').fill(uid==='driver-a'?'642893':'819264');await p.locator('#pinButton').click();}await p.locator('#app:not(.hidden)').waitFor({timeout:30000});}
  await login(page,'driver-a');
  const claim=regularTours(localDate()).length?page.locator('[data-claim]:not([disabled])').first():page.locator('[data-special]').first();await claim.click();await page.locator('#packagePanel:not(.hidden)').waitFor();
  async function parcel(name,origin,amount){await page.locator('#origin').selectOption(origin);await page.locator('#recipient').fill(name);await page.locator('#street').fill('Musterweg 1');await page.locator('#postalCode').fill('54321');await page.locator('#city').fill('Musterstadt');await page.locator('#amount').fill(amount);await page.locator('#packageForm button').click();await page.waitForFunction(n=>document.querySelector('#driverStops').textContent.includes(n),name);}
  await parcel('Erika Muster','Marienapotheke','2.50');await parcel('Theo Muster','Cusanus-Apotheke','7.50');
  await page.waitForFunction(()=>document.querySelector('#offlineReady').textContent.startsWith('Für Funklöcher vorbereitet.'));
  await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.locator('#app:not(.hidden)').waitFor();await page.waitForFunction(()=>navigator.serviceWorker.controller&&document.querySelector('#offlineReady').textContent.startsWith('Für Funklöcher vorbereitet.'));
  await page.locator('#vehicle').selectOption('car1');await tabletContext.setOffline(true);await page.locator('#start').click();await page.locator('[data-done]').first().waitFor();await page.locator('[data-done]').first().click();
  const box=await page.locator('#signature').boundingBox();await page.mouse.move(box.x+20,box.y+30);await page.mouse.down();await page.mouse.move(box.x+160,box.y+80,{steps:20});await page.mouse.up();await page.locator('#saveSig').click();await page.waitForFunction(()=>!document.querySelector('#sigDialog').open);
  await page.locator('[data-fail]').click();await page.locator('#finish').click();await page.waitForFunction(()=>document.querySelector('#pendingStatus').textContent.startsWith('4 '));
  const queued=await page.evaluate(async()=>JSON.stringify(await (await import('/offline-store.mjs')).pending('driver-a')));assert.equal(queued.includes('data:image/png'),false);assert.equal(queued.includes('Erika Muster'),false);
  await page.reload();await page.locator('#app:not(.hidden)').waitFor();assert.ok((await page.locator('#pendingStatus').textContent()).startsWith('4 '));assert.equal(await page.locator('[data-done]').count(),0);
  await tabletContext.setOffline(false);await lostReceipt;await page.locator('#sync:not([disabled])').waitFor();assert.ok((await page.locator('#pendingStatus').textContent()).startsWith('4 '));await page.locator('#sync').click();await page.waitForFunction(()=>document.querySelector('#pendingStatus').textContent==='Keine ausstehenden Abschlüsse.',null,{timeout:40000});
  const tours=await f.db.prepare("SELECT * FROM tours WHERE driver_id='driver-a'").all();assert.equal(tours.results.length,1);assert.equal(tours.results[0].status,'finished');assert.ok(tours.results[0].started_at&&tours.results[0].ended_at);
  const count=await f.db.prepare('SELECT count(*) AS n FROM proofs').first();assert.equal(count.n,2);
  await login(office,'office');assert.equal(await office.locator('#specialPanel:not(.hidden)').count(),0);assert.match(await office.locator('#officeCash').textContent(),/2,50/);assert.equal((await office.locator('#officeCash').textContent()).includes('7,50'),false);
  const [download]=await Promise.all([office.waitForEvent('download'),office.locator('[data-proof]').first().click()]);assert.equal(fs.readFileSync(await download.path()).subarray(0,5).toString(),'%PDF-');
  await page.evaluate(()=>{document.getElementById('recipient').value='Unsubmitted fictional customer';document.getElementById('phone').value='0123456789';document.getElementById('officePassword').value='Unsubmitted-test-secret-123!';});
  await page.locator('#logout').click();await page.locator('#loginPanel:not(.hidden)').waitFor();assert.equal((await page.locator('body').textContent()).includes('Erika Muster'),false);assert.equal(await page.locator('#recipient').inputValue(),'');assert.equal(await page.locator('#phone').inputValue(),'');assert.equal(await page.locator('#officePassword').inputValue(),'');
  assert.equal(await page.evaluate(async()=>await (await import('/offline-store.mjs')).loadAssignments('driver-a')),null);
  await page.locator('#driverName').selectOption('driver-b');await page.locator('#driverPin').fill('819264');await page.locator('#pinButton').click();await page.locator('#app:not(.hidden)').waitFor();assert.equal(await page.locator('#driverTour option').count(),0);assert.equal((await page.locator('body').textContent()).includes('Erika Muster'),false);assert.equal(await page.locator('#recipient').inputValue(),'');assert.equal(await page.locator('#phone').inputValue(),'');assert.equal(await page.locator('#officePassword').inputValue(),'');
  assert.deepEqual(errors,[]);
 }catch(e){console.error('Fictional free-pilot browser failure:',JSON.stringify({errors,state:page?await page.evaluate(()=>({message:document.querySelector('#message')?.textContent,login:document.querySelector('#loginStatus')?.textContent,ready:document.querySelector('#offlineReady')?.textContent,pending:document.querySelector('#pendingStatus')?.textContent,signature:document.querySelector('#sigStatus')?.textContent})).catch(()=>null):null}));if(page){fs.mkdirSync('artifacts',{recursive:true});await page.screenshot({path:'artifacts/free-pilot-browser-failure.png',fullPage:true}).catch(()=>{});}throw e;}
 finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));await f.runtime.dispose();}
});
