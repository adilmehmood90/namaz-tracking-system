// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBpQcT_ZPye0ULxDLYFYS-_KZn0DvUUAAo",
  authDomain: "namaz-tracking-system-c69dd.firebaseapp.com",
  projectId: "namaz-tracking-system-c69dd",
  storageBucket: "namaz-tracking-system-c69dd.firebasestorage.app",
  messagingSenderId: "5817285401",
  appId: "1:5817285401:web:f8ba69976ad2aaef146388"
};

firebase.initializeApp(firebaseConfig);

// Export Firebase services for use in app.js
const auth = firebase.auth();
const db = firebase.firestore();

// Optional: Enable offline persistence (useful for web apps)
// db.enablePersistence()
//   .catch(err => {
//     if (err.code == 'failed-precondition') {
//       console.warn('Multiple tabs open, persistence might not work.');
//     } else if (err.code == 'unimplemented') {
//       console.warn('The current browser does not support persistence.');
//     }
//   });