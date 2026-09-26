// Bump this when the app shell or its offline behavior changes. Old Golden
// caches are removed at activation; caches belonging to other apps are kept.
const CACHE_PREFIX = "golden-pwa-";
const CACHE_NAME = `${CACHE_PREFIX}v4`; // v4 (2026-09-25): infinite hill v175 / site v105 replaces golden v150
const APP_SHELL = ["/", "/site.html", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/favicon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          // Clean the cache name used by the previous Golden worker too.
          .concat(keys.includes("golden-shell-v1") ? ["golden-shell-v1"] : [])
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

function isPrivateRoute(pathname) {
  return /^\/(?:api(?:\/|$)|\.netlify\/functions(?:\/|$)|auth(?:\/|$))/i.test(pathname);
}

function isPublicAsset(pathname) {
  return pathname === "/site.html" ||
    pathname === "/manifest.webmanifest" ||
    /^\/(?:icon-(?:192|512)|favicon|apple-touch-icon)\.png$/.test(pathname) ||
    /^\/assets\/.+\.(?:js|mjs|css|png|jpe?g|webp|avif|svg|ico|woff2?|ttf)$/i.test(pathname);
}

function canStore(response) {
  if (!response || !response.ok || response.status !== 200 || response.type !== "basic") return false;
  const cacheControl = response.headers.get("cache-control") || "";
  return !/(?:^|,)\s*(?:private|no-store)\b/i.test(cacheControl);
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isPrivateRoute(url.pathname)) return;

  if (request.mode === "navigate") {
    // Navigation responses can contain user-specific content. Use the network
    // while online and fall back only to the static app shell when offline.
    event.respondWith(
      fetch(request).catch(async () => (await caches.match("/")) || Response.error()),
    );
    return;
  }

  // Only cache versioned build assets and the known public site resources.
  // Query-string URLs are left to the browser/network and never persisted.
  if (!url.search && isPublicAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (canStore(response)) {
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone())),
            );
          }
          return response;
        });
      }),
    );
  }
});
