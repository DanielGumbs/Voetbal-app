// Retire the old caching worker without reloading an open form or deleting login data.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      await self.registration.unregister();
    })(),
  );
});
// No fetch handler: all requests use the browser's normal network/cache policy.
