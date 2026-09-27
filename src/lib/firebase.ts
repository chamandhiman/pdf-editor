/**
 * firebase.ts — Firebase app initialization.
 * Import `auth` from here wherever you need Firebase Auth.
 *
 * Credentials are read from VITE_FIREBASE_* environment variables
 * defined in .env.local (which is gitignored via *.local in .gitignore).
 */

import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
};

// Prevent re-initializing during hot-reload in dev
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Request additional profile scopes so we always get name + photo
googleProvider.addScope("profile");
googleProvider.addScope("email");
