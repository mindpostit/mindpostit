importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBG5MofvBCD0y93vL-gT39bx76rNJWvztE",
  authDomain: "mindpostit-f0b48.firebaseapp.com",
  projectId: "mindpostit-f0b48",
  storageBucket: "mindpostit-f0b48.firebasestorage.app",
  messagingSenderId: "15997772650",
  appId: "1:15997772650:web:756fc4c75365316a74bb13",
  measurementId: "G-L8N7YGDBF4"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('백그라운드 메시지 수신:', payload);
  const title = payload.notification?.title || '마인드포스팃';
  const body = payload.notification?.body || '새 알림이 있어요.';

  self.registration.showNotification(title, {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    data: { url: 'https://mindpostit.live' }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('mindpostit.live') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('https://mindpostit.live');
    })
  );
});
