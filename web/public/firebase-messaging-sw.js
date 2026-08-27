// Handles push notifications while the app isn't in the foreground.
//
// This is a plain static file (not processed by Vite), so it can't read
// import.meta.env — the config below is duplicated from web/.env. That's
// fine: Firebase web config values aren't secret (they're already visible
// in the deployed JS bundle), and this is Firebase's own documented pattern
// for this exact file.
//
// Registered at a dedicated scope (see registerMessagingServiceWorker in
// features/notifications/api.ts), separate from the Workbox PWA service
// worker at "/" — a page can only be controlled by one service worker per
// scope, so this keeps push handling from fighting with offline caching.
// Kept in sync with the "firebase" version in web/package.json.
importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBB-NZtE4BfzeBoRPNGjKQKZeT-JJ9UmQQ',
  authDomain: 'farm-management-by.firebaseapp.com',
  projectId: 'farm-management-by',
  storageBucket: 'farm-management-by.firebasestorage.app',
  messagingSenderId: '547351086465',
  appId: '1:547351086465:web:8b9530cfe2f1f2e4595480',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  self.registration.showNotification(title ?? 'Farm Management', {
    body: body ?? '',
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
  });
});
