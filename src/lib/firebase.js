// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "parent2-d8cdb.firebaseapp.com",
  projectId: "parent2-d8cdb",
  storageBucket: "parent2-d8cdb.firebasestorage.app",
  messagingSenderId: "426713882468",
  appId: "1:426713882468:web:bca04b73a5c5cfc68be471",
  measurementId: "G-9Z8T6330JM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
