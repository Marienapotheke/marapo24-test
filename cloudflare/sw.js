const CACHE='marapo24-free-pilot-v4';
const ASSETS=['./','./index.html','./app.mjs','./payment.mjs','./password-proof.mjs','./app-config.js','./offline-store.mjs','./office-pdf.mjs','./manifest.webmanifest'];
const SDK=['app','auth','app-check'].map(name=>'https://www.gstatic.com/firebasejs/11.10.0/firebase-'+name+'.js');
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll([...ASSETS,...SDK]))));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{const request=e.request,url=new URL(request.url),local=url.origin===self.location.origin,sdk=url.origin==='https://www.gstatic.com'&&/^\/firebasejs\/11\.10\.0\/firebase-[a-z-]+\.js$/.test(url.pathname);if(request.method!=='GET'||(!local&&!sdk)||(local&&!ASSETS.some(p=>new URL(p,self.registration.scope).pathname===url.pathname)))return;
 e.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(request);if(response.ok)await cache.put(request,response.clone());return response;}catch(error){const saved=await cache.match(request);if(saved)return saved;throw error;}})());
});
