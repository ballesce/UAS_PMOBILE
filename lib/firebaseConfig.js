// lib/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Add this import

const firebaseConfig = {
  apiKey: "AIzaSyCouGiN7fsChVC5v0oHmHdxBXmKrZtDWWk",
  authDomain: "ukm-sistem.firebaseapp.com",
  projectId: "ukm-sistem",
  storageBucket: "ukm-sistem.firebasestorage.app",
  messagingSenderId: "166217195831",
  appId: "1:166217195831:web:c325945298ee5125a0bab2"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Add this line

export { auth, db, storage }; // Add storage to exports