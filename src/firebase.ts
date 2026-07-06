import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Firebase configuration object.
 * You can set these values in your environment variables (.env file) with VITE_ prefixed keys,
 * or paste your Firebase configuration keys directly into this object.
 */
const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || "PASTE_YOUR_API_KEY_HERE",
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || "PASTE_YOUR_AUTH_DOMAIN_HERE",
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || "PASTE_YOUR_PROJECT_ID_HERE",
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || "PASTE_YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || "PASTE_YOUR_MESSAGING_SENDER_ID_HERE",
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || "PASTE_YOUR_APP_ID_HERE"
};

/**
 * Checks whether Firebase is configured with real credentials or placeholders
 */
export const isFirebaseConfigured = (): boolean => {
  return (
    !!firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "PASTE_YOUR_API_KEY_HERE" &&
    firebaseConfig.apiKey !== "" &&
    !!firebaseConfig.projectId &&
    firebaseConfig.projectId !== "PASTE_YOUR_PROJECT_ID_HERE" &&
    firebaseConfig.projectId !== ""
  );
};

let app;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn(
    "Firebase is not configured yet. The application is running in local storage fallback mode.\n" +
    "Please add your Firebase credentials to your environment variables or directly inside 'src/firebase.ts'."
  );
}

export { app, db, auth };
