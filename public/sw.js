// KEJA HALISI — offline shell service worker
// Strategy:
//   • navigations  → network-first, fall back to cached "/" then /offline
//   • static assets (hashed /_next/static, images, fonts) → stale-while-revalidate
//   • GET /api/*   → network-first (6s timeout), stale catalog copy when offline
//   • never touches non-GET, cross-origin, or Next.js HMR traffic
const SHELL = "keja-shell-v1";
const ASSETS = "keja-assets-v1";
const API = "keja-api-v1";

// dev mode (registered as /sw.js?dev=1): Turbopack chunk hashes change on every
// rebuild — skip asset/API caching there so the offline shell can never serve
// a stale or mismatched chunk. Full caching is a production-only behavior.
const IS_DEV = self.location.search.includes("dev=1");

const SHELL_URLS = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/logo/icon-192.png",
  "/logo/icon-512.png",
];

self.addEventListener("install", (event) => {
  const urls = IS_DEV ? ["/offline.html"] : SHELL_URLS;
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(urls.map((u) => new Request(u, { cache: "reload" }))))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => ![SHELL, ASSETS, API].includes(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

const HMR_RE = /_next\/webpack-hmr|\.hot-update\.|_next\/static\/development|\?_rsc=/;
const IMG_RE = /\.(png|jpe?g|gif|svg|webp|avif|ico|woff2?)$/i;

function withTimeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);
  return cached || refresh;
}

async function networkFirst(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);
  try {
    const res = await Promise.race([fetch(request), withTimeout(timeoutMs)]);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error("offline");
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // TikTok oEmbed etc — leave alone
  if (HMR_RE.test(url.pathname + url.search)) return; // dev HMR — pass through

  // page navigations: network first → cached shell → offline page
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (!IS_DEV && res && res.ok) {
            caches.open(SHELL).then((c) => c.put("/", res.clone()));
          }
          return res;
        })
        .catch(async () => {
          const shell = await caches.open(SHELL);
          return (
            (await shell.match("/")) ||
            (await shell.match("/offline.html")) ||
            new Response("<h1>Offline</h1>", { headers: { "Content-Type": "text/html" } })
          );
        })
    );
    return;
  }

  if (IS_DEV) return; // dev: everything else straight to the network

  // hashed build assets + images/fonts: stale-while-revalidate
  if (url.pathname.startsWith("/_next/static/") || IMG_RE.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, ASSETS));
    return;
  }

  // catalog API: fresh when online, honest stale copy when offline
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      networkFirst(request, API, 6000).catch(async () => {
        const api = await caches.open(API);
        const fallback = await api.match(request);
        return (
          fallback ||
          new Response(JSON.stringify({ offline: true, error: "You are offline" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          })
        );
      })
    );
  }
});
