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
import { Loader2, Cloud, ShieldCheck, Clock } from "lucide-react";

interface SaveDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinueWithGoogle: () => Promise<void>;
  isSaving?: boolean;
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

export function SaveDocumentModal({
  open,
  onOpenChange,
  onContinueWithGoogle,
  isSaving = false,
}: SaveDocumentModalProps) {
  const { signingIn } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleAction = async () => {
    setError(null);
    try {
      await onContinueWithGoogle();
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") return;
      const msg = err instanceof Error ? err.message : "Authentication or save failed. Please try again.";
      setError(msg);
    }
  };

  const isLoading = signingIn || isSaving;

  return (
    <Dialog open={open} onOpenChange={(val) => !isLoading && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[420px] p-6">
        <DialogHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Cloud className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            Save your document
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Sign in to save this document and access it later.
          </DialogDescription>
        </DialogHeader>

        {/* Cloud feature perk callout */}
        <div className="my-3 rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-2">
          <div className="flex items-start gap-2.5 text-xs text-foreground">
            <Clock className="h-4 w-4 text-brand shrink-0 mt-0.5" />
            <span>
              <strong>Free trial includes 7 days</strong> of cloud document storage. Access and resume your edits from any browser.
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>End-to-end private & encrypted cloud storage</span>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="mt-2 flex flex-col gap-2.5">
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-3 font-semibold h-11 border-border/80 hover:bg-muted"
            onClick={handleAction}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-brand" />
            ) : (
              <GoogleLogo />
            )}
            {signingIn
              ? "Signing in with Google…"
              : isSaving
              ? "Saving to cloud…"
              : "Continue with Google"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
        </div>

        <p className="mt-3 text-center text-[11px] text-muted-foreground leading-relaxed">
          Download is always free and unlimited without an account.
        </p>
      </DialogContent>
    </Dialog>
  );
}
