const CACHE_NAME = "zolio-v2";
const OFFLINE_URL = "/offline.html";
// App shell + assets précachés pour le mode hors ligne
const STATIC_ASSETS = ["/", "/dashboard", OFFLINE_URL, "/manifest.json", "/logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // addAll échoue si un seul asset manque : on tolère les absences
      Promise.allSettled(STATIC_ASSETS.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Ne pas intercepter les domaines externes (Clerk, Stripe, CDN, etc.)
  if (url.origin !== self.location.origin) return;

  // Network-first pour les appels API, avec réponse JSON hors ligne
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(JSON.stringify({ error: "Hors ligne" }), {
            headers: { "Content-Type": "application/json" },
            status: 503,
          })
      )
    );
    return;
  }

  // Navigations (pages HTML) : network-first, repli sur le cache puis page hors ligne
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Mettre en cache la dernière version visitée
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const shell = await caches.match("/dashboard");
          if (shell) return shell;
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Autres ressources statiques : cache-first puis réseau (stale-while-revalidate léger)
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
