/* Service worker: оболонка додатка працює офлайн, дані з таблиці в кеш не потрапляють
   (запити до Apps Script ідуть напряму в мережу). Оновлення файлів підтягуються у фоні
   і діють з наступного запуску. Змінили структуру файлів — піднімте номер у CACHE. */
const CACHE = "orders-v1";
const SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "fonts/onest-cyrillic-wght-normal.woff2",
  "fonts/onest-latin-wght-normal.woff2"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      });
      if (hit) {
        net.catch(() => {});          // фонове оновлення; без мережі просто лишається кеш
        return hit;
      }
      return net.catch(() => caches.match("index.html"));
    })
  );
});
