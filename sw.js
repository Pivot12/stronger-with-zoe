/* Service worker — cache the app shell so it opens offline (videos stream from YouTube). */
const VER = "swz-v1.0.1";
const SHELL = ["./", "./index.html", "./app.js", "./config.js", "./data.js", "./videos.js", "./thumbs.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return; // never touch YouTube / Apps Script
  // network-first for shell files so updates land quickly; fall back to cache offline
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(VER).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html"))));
});
