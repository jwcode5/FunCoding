import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB3i0M5ddebQ-XsNvVf7KSom8g6YoMpAgo",
  authDomain: "embersmith-gaming.firebaseapp.com",
  projectId: "embersmith-gaming",
  storageBucket: "embersmith-gaming.firebasestorage.app",
  messagingSenderId: "596014572252",
  appId: "1:596014572252:web:e84051aa8e599846560a19",
  measurementId: "G-HBZ5QJMYV4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services we will need
export const auth = getAuth(app);
export const db = getFirestore(app);
