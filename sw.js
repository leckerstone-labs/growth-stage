// Service worker: makes Growth Stage work offline after the first visit.
//
// scripts/build-site.sh stamps two things into the copy in dist/:
//   - VERSION: a hash of every shipped file (and nothing else, not the git
//     commit), so sw.js changes exactly when the site does. The browser
//     notices the byte change, installs the new worker alongside the old one
//     and the page shows an "Update available" toast (src/pwa.js).
//   - PRECACHE: every file in dist/, so the whole app is cached on install.
// Unbuilt (npm run serve with ?sw=1) the tokens are left as they are: the
// version reads "dev" and nothing is precached, but files are still cached as
// they are fetched.
const VERSION = '__BUILD_VERSION__'.startsWith('__') ? 'dev' : '__BUILD_VERSION__';
const PRECACHE = /*__PRECACHE__*/ [] /*__END__*/;
const CACHE = `growth-stage-${VERSION}`;

// The root URL stands in for index.html: Cloudflare redirects /index.html to /,
// and a redirected response can't be used to answer a page load.
const SHELL = new URL('./', self.registration.scope).href;

self.addEventListener('install', (event) => {
  // Fetch past the HTTP cache so the new version never caches stale files.
  // No skipWaiting here: the page asks for it when the user taps Reload.
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(PRECACHE.map(async (path) => {
        const res = await fetch(new Request(path, { cache: 'reload' }));
        if (!res.ok) throw new Error(`precache ${path}: ${res.status}`);
        await cache.put(path, await clean(res));
      })),
    ),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('growth-stage-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // e.g. Cloudflare analytics

  // Page loads (any ?crop=… query) all get the one cached index page.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(SHELL, { ignoreSearch: true });
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok && url.pathname === new URL(SHELL).pathname) cache.put(SHELL, await clean(res.clone()));
      return res;
    })());
    return;
  }

  // Everything else: cache first, then the network (keeping a copy).
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok && res.type === 'basic') cache.put(req, await clean(res.clone()));
    return res;
  })());
});

// A response that followed a redirect is flagged "redirected" and browsers
// refuse to use it for a navigation, so store a plain copy.
async function clean(res) {
  if (!res.redirected) return res;
  return new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: res.headers });
}
