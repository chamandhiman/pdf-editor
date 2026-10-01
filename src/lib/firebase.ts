/**
 * firebase.ts — Firebase app initialization.
 * Import `auth` from here wherever you need Firebase Auth.
 *
 * Credentials are read from VITE_FIREBASE_* environment variables
 * defined in .env.local (which is gitignored via *.local in .gitignore).
 */

import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, setLogLevel } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Request additional profile scopes so we always get name + photo
googleProvider.addScope("profile");
googleProvider.addScope("email");

// Silence Firestore internal SDK logs
try {
  setLogLevel("silent");
} catch {}

// Suppress unconfigured Firestore and Storage errors in console
if (typeof window !== "undefined") {
  const origError = console.error;
  const origWarn = console.warn;

  console.error = (...args: any[]) => {
    const text = args
      .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
      .join(" ");
    if (
      text.includes("Database '(default)' not found") ||
      text.includes("@firebase/firestore") ||
      text.includes("firebasestorage.googleapis.com")
    ) {
      try {
        localStorage.setItem("pdfstudio_firestore_disabled", "true");
        localStorage.setItem("pdfstudio_storage_disabled", "true");
      } catch {}
      return;
    }
    origError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    const text = args
      .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
      .join(" ");
    if (
      text.includes("Database '(default)' not found") ||
      text.includes("@firebase/firestore") ||
      text.includes("firebasestorage.googleapis.com")
    ) {
      try {
        localStorage.setItem("pdfstudio_firestore_disabled", "true");
        localStorage.setItem("pdfstudio_storage_disabled", "true");
      } catch {}
      return;
    }
    origWarn.apply(console, args);
  };
}


