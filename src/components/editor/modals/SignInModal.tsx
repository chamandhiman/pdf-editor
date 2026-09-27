import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/BrandMark";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Google "G" SVG logo */
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}

export function SignInModal({ open, onOpenChange }: SignInModalProps) {
  const { signInWithGoogle, signingIn } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      // Close the modal automatically on success
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed. Please try again.";
      // Filter Firebase popup-closed-by-user error — it's not an actual error
      if ((err as { code?: string })?.code === "auth/popup-closed-by-user") return;
      setError(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader className="items-center text-center">
          <div className="mb-3 flex items-center gap-2">
            <BrandMark />
            <span className="text-[15px] font-semibold tracking-tight">PDF Studio</span>
          </div>
          <DialogTitle className="text-[20px] font-semibold tracking-tight">
            Sign in to continue
          </DialogTitle>
          <DialogDescription className="text-[13.5px] text-muted-foreground">
            Save your work, access documents from any device, and unlock premium features.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-3">
          <Button
            id="sign-in-google-btn"
            variant="outline"
            size="lg"
            className="relative w-full gap-3 font-medium"
            onClick={handleGoogleSignIn}
            disabled={signingIn}
          >
            {signingIn ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <GoogleLogo />
            )}
            {signingIn ? "Signing in…" : "Continue with Google"}
          </Button>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">
              {error}
            </p>
          )}

          <p className="text-center text-[11.5px] leading-relaxed text-muted-foreground">
            By continuing you agree to our{" "}
            <a href="#" className="underline underline-offset-2 hover:text-foreground">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-2 hover:text-foreground">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
