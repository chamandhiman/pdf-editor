import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, QrCode, CreditCard, Coffee, ShieldCheck, Sparkles } from "lucide-react";

interface SupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportModal({ open, onOpenChange }: SupportModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-6 text-center">
        <DialogHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 shadow-sm">
            <Heart className="h-6 w-6 fill-rose-500" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            Help us keep PDF Studio free
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-sm">
            PDF Studio is free to use. If it saves you time, consider supporting the project so we can keep improving and maintaining the service.
          </DialogDescription>
        </DialogHeader>

        {/* Structured Contribution Options (Ready for future payment gateway / QR integration) */}
        <div className="my-4 space-y-2.5 text-left">
          {/* Option 1: UPI / QR Code */}
          <div className="group flex items-center justify-between rounded-xl border border-border/80 bg-muted/30 p-3.5 hover:border-brand/30 transition-all">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background border border-border/60 text-brand shadow-xs">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">UPI / QR Code</p>
                <p className="text-[11px] text-muted-foreground">Google Pay, PhonePe, Paytm & BHIM</p>
              </div>
            </div>
            <span className="rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 text-[10px] font-semibold border border-emerald-500/20">
              Active
            </span>
          </div>

          {/* Option 2: PayPal */}
          <div className="group flex items-center justify-between rounded-xl border border-border/80 bg-muted/30 p-3.5 hover:border-brand/30 transition-all">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background border border-border/60 text-blue-600 shadow-xs">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">PayPal</p>
                <p className="text-[11px] text-muted-foreground">International cards & direct donations</p>
              </div>
            </div>
            <span className="rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 text-[10px] font-semibold border border-emerald-500/20">
              Active
            </span>
          </div>

          {/* Option 3: Other Support Options */}
          <div className="group flex items-center justify-between rounded-xl border border-border/80 bg-muted/30 p-3.5 hover:border-brand/30 transition-all">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background border border-border/60 text-amber-600 shadow-xs">
                <Coffee className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Other Support Options</p>
                <p className="text-[11px] text-muted-foreground">Buy Me a Coffee & GitHub Sponsors</p>
              </div>
            </div>
            <span className="rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 text-[10px] font-semibold border border-emerald-500/20">
              Active
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center gap-2.5 text-[11px] text-muted-foreground text-left mb-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>100% of community contributions go directly towards independent server & development maintenance.</span>
        </div>

        <div className="mt-2 flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
