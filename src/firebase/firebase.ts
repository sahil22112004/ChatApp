// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth,GoogleAuthProvider} from "firebase/auth"
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD4m3FVZt3L87zDQZHlVZ1NOcr6CpE9Y3A",
  authDomain: "chatapp-bd88b.firebaseapp.com",
  projectId: "chatapp-bd88b",
  storageBucket: "chatapp-bd88b.firebasestorage.app",
  messagingSenderId: "265308449838",
  appId: "1:265308449838:web:c377b3149bc255719e83bf",
  measurementId: "G-WSQ9Q7GTSD"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
