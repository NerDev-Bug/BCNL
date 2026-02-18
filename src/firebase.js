import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getFunctions, connectFunctionsEmulator } from "firebase/functions"

// 🔥 Your Firebase config - using environment variables for better security
// Note: Firebase client-side API keys are safe to expose, but using env vars is a best practice
// All values should be set in .env file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Services
export const db = getFirestore(app)
export const auth = getAuth(app)

// Initialize Functions with explicit region (us-central1)
export const functions = getFunctions(app, "us-central1")

// Connect to emulator in development (optional)
// if (import.meta.env.DEV) {
//   connectFunctionsEmulator(functions, "localhost", 5001)
// }

export default app
