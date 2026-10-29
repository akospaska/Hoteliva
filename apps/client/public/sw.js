// Online-only PWA: ügyféladatot és API-választ nem gyorsítótárazunk.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
