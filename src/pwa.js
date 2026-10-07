// Progressive Web App glue: registers the service worker (sw.js), shows an
// "Update available" toast when a new version has downloaded, and offers
// "Install app" where the browser supports it. Independent of the plant model
// and main.js; loaded as its own module from index.html.

const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------------------
// Service worker. Skipped on localhost so `npm run serve` always shows your
// latest edits. To test it locally, open the page once with ?sw=1 (remembered
// for that address until you open it with ?sw=0).
// ---------------------------------------------------------------------------
const LOCAL = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
const swParam = new URLSearchParams(location.search).get('sw');
let localSW = false;
try {
  if (swParam === '1') localStorage.setItem('gs-sw', '1');
  if (swParam === '0') localStorage.removeItem('gs-sw');
  localSW = localStorage.getItem('gs-sw') === '1';
} catch { localSW = swParam === '1'; }
const WANT_SW = 'serviceWorker' in navigator && (!LOCAL || localSW);

// Locally with the worker off, remove any left from an earlier ?sw=1 test so
// it can't keep serving old cached files during development.
if (LOCAL && !WANT_SW && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister())).catch(() => {});
}

if (WANT_SW) {
  // Reload once, after the new worker has taken over (the user tapped Reload).
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!reloading && updateRequested) { reloading = true; location.reload(); }
  });

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      // A worker already waiting from an earlier visit.
      if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        if (!w) return;
        w.addEventListener('statechange', () => {
          // "installed" with an existing controller = an update (not the first install).
          if (w.state === 'installed' && navigator.serviceWorker.controller) showUpdate(w);
        });
      });
      // Phones keep installed apps open for days: look for updates when the
      // app comes back to the foreground, and hourly while it stays open.
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    } catch (err) {
      console.warn('Service worker registration failed:', err);
    }
  });
}

let updateRequested = false;
function showUpdate(worker) {
  const toast = $('update-toast');
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add('show'));
  $('update-reload').onclick = () => {
    updateRequested = true;
    $('update-reload').disabled = true;
    worker.postMessage('skipWaiting');
  };
  $('update-dismiss').onclick = () => {
    toast.classList.remove('show');
    setTimeout(() => (toast.hidden = true), 300);
  };
}

// ---------------------------------------------------------------------------
// Install. Chrome/Edge/Android fire beforeinstallprompt when the app can be
// installed; iOS Safari never does, so there we show a one-line how-to.
// Nothing is shown once the app is running installed (standalone).
// ---------------------------------------------------------------------------
const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const installBtn = $('install-btn');
const installHint = $('install-hint');
let deferred = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e;
  if (!standalone) installBtn.hidden = false;
});
installBtn.addEventListener('click', async () => {
  if (!deferred) return;
  deferred.prompt();
  await deferred.userChoice.catch(() => {});
  deferred = null;
  installBtn.hidden = true;
});
window.addEventListener('appinstalled', () => { installBtn.hidden = true; installHint.hidden = true; });

const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if (iOS && !standalone) installHint.hidden = false;
