// sw.js - Service Worker for Guardian Offline Mode
const CACHE_NAME = 'guardian-cache-v1';

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/static/js/app.js',
        '/static/css/app.css'
        // Add more static assets as needed
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // For now, just network-first for dynamic content, cache-first for static
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If offline, could return cached response, but for now, let it fail
        return new Response(JSON.stringify({ error: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'send-messages') {
    event.waitUntil(syncQueuedMessages());
  } else if (event.tag === 'sync-profile-edits') {
    event.waitUntil(syncProfileEdits());
  }
});

async function syncQueuedMessages() {
  console.log('Syncing queued messages...');
  try {
    const { db } = await import('./utils/db.js');
    const queuedMessages = await db.messageQueue.toArray();
    for (const msg of queuedMessages) {
      // Send to API
      await fetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify(msg.message),
        headers: { 'Content-Type': 'application/json' }
      });
      await db.messageQueue.delete(msg.id);
    }
    console.log('Messages synced successfully.');
  } catch (error) {
    console.error('Failed to sync messages:', error);
  }
}

async function syncProfileEdits() {
  console.log('Syncing profile edits...');
  try {
    const { db } = await import('./utils/db.js');
    const queuedEdits = await db.profileEdits.toArray();
    for (const edit of queuedEdits) {
      // Send to API
      await fetch('/api/guardians/profile', {
        method: 'PUT',
        body: JSON.stringify(edit.changes),
        headers: { 'Content-Type': 'application/json' }
      });
      await db.profileEdits.delete(edit.id);
    }
    console.log('Profile edits synced successfully.');
  } catch (error) {
    console.error('Failed to sync profile edits:', error);
  }
}
