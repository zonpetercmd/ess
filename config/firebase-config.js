// config/firebase-config.js
// DEV Vidyalaya - Employee Self Services (ESS)

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyDMwE-Vg6Q10VUQi41fQpW-fQGIwNidqqg",
  authDomain: "dev-vidyalaya-erp.firebaseapp.com",
  databaseURL: "https://dev-vidyalaya-erp-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dev-vidyalaya-erp",
  storageBucket: "dev-vidyalaya-erp.firebasestorage.app",
  messagingSenderId: "677011391483",
  appId: "1:677011391483:web:f12522edb952292912815e"
};

// Initialize Firebase globally for the frontend
if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
        firebase.initializeApp(window.FIREBASE_CONFIG);
        console.log("🔥 Firebase initialized for ESS Portal");
    }
} else {
    console.error("❌ Firebase SDK not loaded. Check script tags.");
}
