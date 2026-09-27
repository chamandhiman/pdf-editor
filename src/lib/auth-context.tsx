/**
 * Auth context — Firebase Google sign-in with persistent session.
 *
 * Uses onAuthStateChanged so the user stays logged in across refreshes.
 * signInWithPopup opens the Google consent screen in a pop-up window.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** True while Firebase is restoring the previous session (initial load) */
  loading: boolean;
  /** True while a sign-in popup is open / in-flight */
  signingIn: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(u: User): AuthUser {
  return {
    uid: u.uid,
    displayName: u.displayName,
    email: u.email,
    photoURL: u.photoURL,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true); // true until onAuthStateChanged fires once
  const [signingIn, setSigningIn] = useState(false);

  // Listen for Firebase auth state changes (covers refresh / tab restore)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? toAuthUser(firebaseUser) : null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setSigningIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(toAuthUser(result.user));
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signingIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
