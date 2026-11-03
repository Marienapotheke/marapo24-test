import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import crypto from 'node:crypto';import {productionHtml,productionOffline} from '../scripts/free-app-view.mjs';
const base=new URL('../recovery/cloudflare-20261030/',import.meta.url),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),normalize=s=>s.replace(/\r\n/g,'\n');
test('recovered executable, all public files and schema remain byte-exact against the verified Cloudflare snapshot',async()=>{
 const manifest=JSON.parse(await fs.readFile(new URL('manifest.json',base),'utf8'));assert.equal(manifest.version,'4872e4c6-766d-4647-8aed-44c325d1df67');assert.equal(manifest.files.length,24);for(const f of manifest.files)assert.equal(sha(await fs.readFile(new URL(f.path,base))),f.sha256,f.path);assert.equal(manifest.databaseJurisdiction,'eu');assert.equal(manifest.customerRowsExported,false);assert.equal(manifest.deploymentPerformed,false);
});
test('recovered offline namespace is translated only for isolated tests and production returns to the existing database',async()=>{
 const source=await fs.readFile(new URL('../cloudflare/offline-store.mjs',import.meta.url),'utf8'),baseline=await fs.readFile(new URL('assets/offline-store.mjs',base),'utf8');assert.equal(normalize(productionOffline(source)),normalize(baseline));assert.ok(source.includes("DB_NAME='marapo24-protected-offline-v1'"));
});
test('recovered HTML retains its test-only notice without dropping controls from the running version',async()=>{
 const source=await fs.readFile(new URL('../cloudflare/index.html',import.meta.url),'utf8');assert.ok(source.includes('TEST · NUR FIKTIVE DATEN'));const html=productionHtml(source);for(const id of ['packageForm','sigDialog','createStaffForm'])assert.ok(html.includes('id="'+id+'"'),id);assert.equal(normalize(html),normalize(await fs.readFile(new URL('assets/index.html',base),'utf8')));
});
