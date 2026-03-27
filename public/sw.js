// Service Worker pour les notifications Web Push
// Ce fichier doit être à la racine du domaine (/sw.js)

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "Zolio";
    const options = {
      body: data.body || "Nouvelle notification",
      icon: data.icon || "/logo.png",
      badge: "/logo.png",
      data: data.url || "/dashboard",
      actions: data.actions || [],
      tag: data.tag || "zolio-notification",
      requireInteraction: data.requireInteraction || false,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error("Push notification error:", error);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Passer toutes les requêtes fetch au réseau (ne pas intercepter)
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
