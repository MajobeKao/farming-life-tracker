// Service Worker for Farming & Life Tracker
const CACHE_NAME = "farm-tracker-v1.0.0";
const ASSETS = [
  "index.html",
  "manifest.json",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css",
  "https://cdn.jsdelivr.net/npm/chart.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
];

// Install event - cache assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Caching app assets...");
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting()),
  );
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((response) => {
          // Don't cache if not a success
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Offline fallback
          return new Response("Offline - please connect to internet", {
            status: 503,
            statusText: "Service Unavailable",
          });
        });
    }),
  );
});

// Handle push notifications
self.addEventListener("push", (event) => {
  const data = event.data.json();
  const options = {
    body: data.body || "Time to check your farm!",
    icon: "icons/icon-192x192.png",
    badge: "icons/icon-72x72.png",
    vibrate: [200, 100, 200],
    actions: [
      { action: "open", title: "Open App" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };
  event.waitUntil(
    self.registration.showNotification(
      data.title || "Farming Tracker",
      options,
    ),
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "open") {
    event.waitUntil(clients.openWindow("/"));
  }
});
