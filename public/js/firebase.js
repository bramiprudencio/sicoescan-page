// ===== CONFIG & GLOBALS =====
const firebaseConfig = {
  apiKey: "AIzaSyBi-DM2RdufFQTejnLwlFVc-sD9FcHFajQ",
  authDomain: "empyrean-cubist-467813-u9.firebaseapp.com",
  projectId: "empyrean-cubist-467813-u9",
  storageBucket: "empyrean-cubist-467813-u9.firebasestorage.app",
  messagingSenderId: "376339585453",
  appId: "1:376339585453:web:dd5a47fc5664e76baaa924"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

export { auth, db };
