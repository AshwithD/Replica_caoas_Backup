// /* public/sw.js — Service Worker for push notifications
//    Place at: public/sw.js  (served at /sw.js from your frontend origin)
//    Replace /caoas-logo.png and /notification-sound.mp3 with your actual files.
// */

// self.addEventListener('install', () => self.skipWaiting());
// self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// const NOTIF_ICON  = '/caoas-logo.png';   // ← your notification icon
// const NOTIF_BADGE = '/caoas-logo.png';   // ← small badge (Android status bar)

// /* ── Handle push events (Web Push API — for true background push) ── */
// self.addEventListener('push', event => {
//   if (!event.data) return;
//   let data = {};
//   try { data = event.data.json(); } catch { data = { title: 'CAOAS', body: event.data.text() }; }

//   event.waitUntil(
//     self.registration.showNotification(data.title || 'CAOAS', {
//       body:    data.body || data.message || '',
//       icon:    NOTIF_ICON,
//       badge:   NOTIF_BADGE,
//       image:   NOTIF_ICON,
//       tag:     data.tag || `caoas-${Date.now()}`,
//       renotify: true,
//       vibrate: [200, 100, 200],
//       silent:  false,   // OS sound for true push (background)
//       requireInteraction: data.requireInteraction || false,
//       data:    { roomId: data.conversation_id || data.roomId || null },
//     })
//   );
// });

// /* ── Handle app-triggered notifications (showNotification from page) ── */
// // These are triggered by AppLayout when tab is open.
// // Sound is played by Audio API in the page — SW uses silent:true to avoid double sound.

// /* ── Notification click → focus or open the app ── */
// self.addEventListener('notificationclick', event => {
//   event.notification.close();
//   const roomId = event.notification.data?.roomId;

//   event.waitUntil(
//     self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
//       for (const client of clients) {
//         if (client.url.includes(self.registration.scope) && 'focus' in client) {
//           if (roomId) client.postMessage({ type: 'OPEN_ROOM', roomId });
//           return client.focus();
//         }
//       }
//       const url = roomId
//         ? `${self.registration.scope}?openRoom=${roomId}`
//         : self.registration.scope;
//       return self.clients.openWindow(url);
//     })
//   );
// });

// /* ── Messages from app ── */
// self.addEventListener('message', event => {
//   if (event.data?.type === 'SHOW_NOTIFICATION') {
//     const { title, body, tag, roomId, requireInteraction } = event.data;
//     self.registration.showNotification(title, {
//       body,
//       icon:    NOTIF_ICON,
//       badge:   NOTIF_BADGE,
//       image:   NOTIF_ICON,
//       tag:     tag || `caoas-${Date.now()}`,
//       renotify: true,
//       vibrate: [200, 100, 200],
//       silent:  true,   // audio played by page
//       requireInteraction: !!requireInteraction,
//       data: { roomId },
//     });
//   }
// });

/* public/sw.js — handles background push when app is closed */

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', e  => e.waitUntil(self.clients.claim()));

const ICON  = '/caoas-logo.png';
const BADGE = '/caoas-logo.png';

/* ── Background push (app closed / tab not open) ────────────────────────── */
self.addEventListener('push', event => {
  if (!event.data) return;

  let data = {};
  try   { data = event.data.json(); }
  catch { data = { title: 'CAOAS', body: event.data.text() }; }

  const options = {
    body:    data.body    || '',
    icon:    ICON,
    badge:   BADGE,
    tag:     data.tag     || `caoas-${Date.now()}`,
    renotify: true,
    vibrate: [200, 100, 200],
    requireInteraction: !!data.requireInteraction,
    data: {
      roomId:          data.conversation_id || data.roomId || null,
      url:             data.url || '/',
    },
    // actions shown on Android lock screen
    actions: [
      { action: 'open',    title: 'Open'    },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'CAOAS', options)
  );
});

/* ── Notification click ──────────────────────────────────────────────────── */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const roomId = event.notification.data?.roomId;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // Focus existing tab
      for (const client of clients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          if (roomId) client.postMessage({ type: 'OPEN_ROOM', roomId });
          return client.focus();
        }
      }
      // Open new tab
      const url = roomId
        ? `${self.registration.scope}?openRoom=${roomId}`
        : self.registration.scope;
      return self.clients.openWindow(url);
    })
  );
});

/* ── In-app notifications (tab is open, triggered from AppLayout) ────────── */
self.addEventListener('message', event => {
  if (event.data?.type !== 'SHOW_NOTIFICATION') return;
  const { title, body, tag, roomId, requireInteraction } = event.data;
  self.registration.showNotification(title, {
    body,
    icon:    ICON,
    badge:   BADGE,
    tag:     tag || `caoas-${Date.now()}`,
    renotify: true,
    vibrate: [200, 100, 200],
    requireInteraction: !!requireInteraction,
    data: { roomId },
  });
});