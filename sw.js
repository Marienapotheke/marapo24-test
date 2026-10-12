const CACHE='marapo24-protected-app-v1';
const ASSETS=['./','./index.html','./app.mjs','./app-config.js','./offline-store.mjs','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  const local=url.origin===self.location.origin;
  const sdk=url.origin==='https://www.gstatic.com'&&/^\/firebasejs\/11\.10\.0\/firebase-[a-z-]+\.js$/.test(url.pathname);
  if(request.method!=='GET'||(!local&&!sdk))return;
  if(local&&!ASSETS.some(x=>new URL(x,self.registration.scope).pathname===url.pathname))return;
  // Auth/API/PDF responses and customer data never enter Cache Storage.
  event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(request);if(response.ok)await cache.put(request,response.clone());return response;}catch(e){const saved=await cache.match(request);if(saved)return saved;throw e;}})());
});
