// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBcBR5q2UoVfZoy-wOvO_yCnTH99cNKl1c",
    authDomain: "cpt420-27b99.firebaseapp.com",
    projectId: "cpt420-27b99",
    storageBucket: "cpt420-27b99.firebasestorage.app",
    messagingSenderId: "751410599338",
    appId: "1:751410599338:web:a67a1b6eaa959527c8c7d3"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };