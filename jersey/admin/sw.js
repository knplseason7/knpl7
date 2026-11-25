/* KNPL-7 Jersey Admin – receives images shared from WhatsApp (Android "Share" menu) and hands them to the page. */
const SHARE_CACHE = 'knpl-jersey-share';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method === 'POST' && url.pathname.endsWith('/jersey/admin/share')) {
    e.respondWith((async () => {
      let n = 0;
      try {
        const fd = await e.request.formData();
        const files = fd.getAll('files').filter(f => f && typeof f === 'object' && f.size);
        const c = await caches.open(SHARE_CACHE);
        for (const k of await c.keys()) await c.delete(k);
        for (const f of files) {
          await c.put(new Request(self.registration.scope + '__shared/' + n), new Response(f, {headers: {
            'content-type': f.type || 'application/octet-stream', 'x-name': encodeURIComponent(f.name || ('file-' + n)), 'x-at': String(Date.now())}}));
          n++;
        }
      } catch (err) { /* page will show nothing received */ }
      return Response.redirect(self.registration.scope + '?shared=' + n, 303);
    })());
  }
});
