importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "your_firebase_web_api_key",
  authDomain: "rmsr-10cc3.firebaseapp.com",
  projectId: "rmsr-10cc3",
  messagingSenderId: "44136160531",
  appId: "your_firebase_app_id"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: payload.data
  });
});
