const CACHE_NAME = 'backstage-pro-v1';
const RUNTIME_CACHE = 'backstage-runtime-v1';

const URLS_TO_CACHE = [
  '/',
  '/index.html'
];

// Install - cache inicial
self.addEventListener('install', event => {
  console.log('🔧 Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .catch(err => console.warn('⚠️ Erro ao fazer cache:', err))
  );
  self.skipWaiting();
});

// Activate - limpar caches antigos
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker ativando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('🗑️ Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - estratégia Network First para API, Cache First para assets
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar não-GET
  if (request.method !== 'GET') {
    return;
  }

  // API - Network First
  if (url.pathname.includes('/api/') || url.hostname !== location.hostname) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Guardar cópia em cache
          if (response.ok) {
            const cache = caches.open(RUNTIME_CACHE);
            cache.then(c => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // Offline - retornar cache se existir
          return caches.match(request).then(response => {
            if (response) return response;
            return new Response('Offline - dados não disponíveis', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({ 'Content-Type': 'text/plain' })
            });
          });
        })
    );
    return;
  }

  // Assets - Cache First
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) return response;

        return fetch(request).then(response => {
          if (!response || response.status !== 200) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseToCache);
          });

          return response;
        });
      })
      .catch(() => {
        // Fallback para imagens offline
        if (request.destination === 'image') {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#ccc" width="100" height="100"/></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
      })
  );
});
