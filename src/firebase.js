import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

// 🔥 Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAVfnAb51e_fV2q_Ar7th2tPk1lUHFKh8k",
  authDomain: "bcnl-8c365.firebaseapp.com",
  projectId: "bcnl-8c365",
  storageBucket: "bcnl-8c365.firebasestorage.app",
  messagingSenderId: "1049132543384",
  appId: "1:1049132543384:web:37164a37d94fb0bfaa4fed"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Services
export const db = getFirestore(app)
export const auth = getAuth(app)

export default app