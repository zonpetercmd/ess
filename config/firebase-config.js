// config/firebase-config.js

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyCGjj7oRIh1ndP6dT3YXmqdCg03ejnoLrE",
  authDomain: "dev-vidyalaya-ess.firebaseapp.com",
  databaseURL: "https://dev-vidyalaya-ess-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dev-vidyalaya-ess",
  storageBucket: "dev-vidyalaya-ess.firebasestorage.app",
  messagingSenderId: "849776467885",
  appId: "1:849776467885:web:b8a14a2905cc236115cb24"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
        firebase.initializeApp(window.FIREBASE_CONFIG);
        console.log("🔥 Firebase initialized for ESS Portal");
    }
}
