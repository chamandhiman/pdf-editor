/**
 * Auth context — keeps track of the signed-in user.
 * Firebase / real OAuth can be wired in here later without touching the rest of the app.
 * For now the state is ephemeral (cleared on refresh) so we never fake a persistent session.
 */

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** True while a sign-in attempt is in flight */
  signingIn: boolean;
  /** Call this to initiate Google sign-in (stub — wire Firebase here later) */
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const signInWithGoogle = useCallback(async () => {
    setSigningIn(true);
    try {
      /**
       * TODO: Replace this stub with real Firebase Google sign-in.
       *
       * import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
       * const result = await signInWithPopup(getAuth(), new GoogleAuthProvider());
       * setUser({ uid: result.user.uid, displayName: result.user.displayName,
       *           email: result.user.email, photoURL: result.user.photoURL });
       */
      // Simulate network latency so the loading state is visible
      await new Promise((res) => setTimeout(res, 1200));
      // Stub: never resolves to a real user — show error instead
      throw new Error("Google sign-in is not configured yet. Connect Firebase to enable it.");
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, signingIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
