/* ASDC — this device's copy of the app (24 Oct 2026: "I don't want it to lag").
   The app page opens at once from the copy kept on this device, and a fresh copy is fetched in the background for next
   time. When a new version is out, the app's own bar ("A new version of the app is available — Update now") switches to it.
   Only the app page itself is kept. Data, cause lists, OneDrive papers, Firestore, version checks always go to the network. */
const SHELL="asdc-shell-v1";
self.addEventListener("install", e=>{ e.waitUntil(caches.open(SHELL).then(c=>c.add(new Request("./",{cache:"reload"}))).catch(()=>{})); });
self.addEventListener("activate", e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.indexOf("asdc-shell-")===0&&k!==SHELL).map(k=>caches.delete(k))))); });
self.addEventListener("message", e=>{ if(e.data==="skipWaiting") self.skipWaiting(); });
self.addEventListener("fetch", e=>{
  const r=e.request; if(r.method!=="GET"||r.mode!=="navigate") return;
  const u=new URL(r.url); if(u.origin!==location.origin) return;
  const scope=new URL(self.registration.scope);
  if(u.pathname!==scope.pathname&&u.pathname!==scope.pathname+"index.html") return;   // only the app page
  e.respondWith((async()=>{
    const c=await caches.open(SHELL), key=scope.pathname, hit=await c.match(key);
    const net=fetch(u.origin+key,{cache:"no-cache",credentials:"same-origin"}).then(res=>{ if(res&&res.ok&&!res.redirected&&res.type==="basic") c.put(key,res.clone()); return res; });
    if(hit){ e.waitUntil(net.catch(()=>{})); return hit; }
    try{ return await net; }catch(err){ return hit||Response.error(); }
  })());
});
