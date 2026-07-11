// Service worker de cache offline (cache-first para arquivos do próprio app).
const CACHE = 'ecl-cache-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const chaves = await caches.keys();
      await Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Só gerencia recursos do próprio domínio; deixa fontes/imagens externas passarem direto.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      if (cached) {
        // Atualiza em segundo plano.
        fetch(req).then((res) => { if (res && res.ok) cache.put(req, res.clone()); }).catch(() => {});
        return cached;
      }
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      } catch (err) {
        // Offline: navegações caem no index (SPA).
        if (req.mode === 'navigate') {
          const shell = await cache.match(new URL('index.html', self.registration.scope));
          if (shell) return shell;
        }
        throw err;
      }
    })(),
  );
});
