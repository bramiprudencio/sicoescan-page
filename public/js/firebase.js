import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBi-DM2RdufFQTejnLwlFVc-sD9FcHFajQ",
  authDomain: "empyrean-cubist-467813-u9.firebaseapp.com",
  projectId: "empyrean-cubist-467813-u9",
  storageBucket: "empyrean-cubist-467813-u9.firebasestorage.app",
  messagingSenderId: "376339585453",
  appId: "1:376339585453:web:dd5a47fc5664e76baaa924"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
