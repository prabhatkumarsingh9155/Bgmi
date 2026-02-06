// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCudyWEuaW8FGs3YzTWq2Wn0tHWMk2ALSc",
  authDomain: "untilited7-c8984.firebaseapp.com",
  projectId: "untilited7-c8984",
  storageBucket: "untilited7-c8984.firebasestorage.app",
  messagingSenderId: "455605350883",
  appId: "1:455605350883:web:f43e28b3b0e9a01346f0d6",
  measurementId: "G-SK7CC9187K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { auth, db, storage, analytics };
