const CACHE_NAME = "kept-shell-v2";
const DB_NAME = "kept-archive";
const DB_VERSION = 2;
const SHELL = [
  "/",
  "/share",
  "/site.webmanifest",
  "/kept-mark.svg",
  "/favicon-32x32.png",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(async () => {
        const clients = await self.clients.matchAll({ type: "window" });
        clients.forEach((client) => client.postMessage({ type: "KEPT_UPDATED" }));
      }),
  );
});

function openArchiveDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("items")) database.createObjectStore("items", { keyPath: "id" });
      if (!database.objectStoreNames.contains("collections")) database.createObjectStore("collections", { keyPath: "id" });
      if (!database.objectStoreNames.contains("assets")) database.createObjectStore("assets", { keyPath: "id" });
      if (!database.objectStoreNames.contains("meta")) database.createObjectStore("meta", { keyPath: "key" });
      if (!database.objectStoreNames.contains("sharePayloads")) database.createObjectStore("sharePayloads", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeSharePayload(request) {
  const form = await request.formData();
  const media = form.get("media");
  const payload = {
    id: crypto.randomUUID(),
    title: String(form.get("title") || ""),
    text: String(form.get("text") || ""),
    url: String(form.get("url") || ""),
    createdAt: new Date().toISOString(),
    ...(media instanceof Blob && media.size ? { media } : {}),
  };
  const database = await openArchiveDb();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction("sharePayloads", "readwrite");
    transaction.objectStore("sharePayloads").put(payload);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.method === "POST" && url.pathname === "/share") {
    event.respondWith(
      storeSharePayload(request)
        .then(() => Response.redirect("/?share=pending", 303))
        .catch(() => new Response("Kept could not store the shared payload.", { status: 503 })),
    );
    return;
  }
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && !url.search) {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(url.pathname, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(url.pathname)) || (await caches.match("/"))),
    );
    return;
  }

  event.respondWith(caches.match(request).then((cached) => {
    const refresh = fetch(request).then((response) => {
      if (response.ok) void caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      return response;
    });
    return cached || refresh;
  }));
});
