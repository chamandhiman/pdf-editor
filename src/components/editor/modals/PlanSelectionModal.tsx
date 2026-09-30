import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  PLANS,
  type PlanId,
  type SupportedCurrency,
  detectUserCurrency,
} from "@/lib/pricing-plans";
import { Check, Sparkles, Shield, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFreePlan: () => void;
  isSaving?: boolean;
}

export function PlanSelectionModal({
  open,
  onOpenChange,
  onSelectFreePlan,
  isSaving = false,
}: PlanSelectionModalProps) {
  const [currency, setCurrency] = useState<SupportedCurrency>(() => detectUserCurrency());
  const [proModalOpen, setProModalOpen] = useState(false);
  const [selectedProPlanName, setSelectedProPlanName] = useState<string>("");

  const handleChoosePro = (planName: string) => {
    setSelectedProPlanName(planName);
    setProModalOpen(true);
  };

  const handleContinueWithFree = () => {
    setProModalOpen(false);
    onSelectFreePlan();
  };

  return (
    <>
      <Dialog open={open && !proModalOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[760px] p-6 max-h-[92vh] overflow-y-auto">
          <DialogHeader className="text-center pb-2">
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                  Choose how you want to save
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  Select a plan to continue saving your documents.
                </DialogDescription>
              </div>
            </div>

            {/* Currency indicator / selector */}
            <div className="flex justify-center mt-3">
              <div className="inline-flex items-center rounded-lg border border-border bg-muted/50 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setCurrency("INR")}
                  className={cn(
                    "px-3 py-1 font-semibold rounded-md transition-all cursor-pointer",
                    currency === "INR"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  🇮🇳 INR (₹)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={cn(
                    "px-3 py-1 font-semibold rounded-md transition-all cursor-pointer",
                    currency === "USD"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  🌐 USD ($)
                </button>
              </div>
            </div>
          </DialogHeader>

          {/* 3 Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            {/* 1. FREE TRIAL */}
            {(() => {
              const plan = PLANS.free;
              const pricing = plan.pricing[currency];
              return (
                <div className="relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-brand/40 transition-all">
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      {plan.name}
                    </div>
                    <div className="flex items-baseline gap-1 my-2">
                      <span className="text-3xl font-extrabold text-foreground">
                        {pricing.displayPrice}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground italic mb-4">
                      "{plan.tagline}"
                    </p>

                    <div className="border-t border-border/60 pt-3 space-y-2">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-2 text-xs text-foreground">
                          <Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button
                      variant="brand"
                      size="sm"
                      className="w-full text-xs font-semibold"
                      onClick={handleContinueWithFree}
                      disabled={isSaving}
                      style={{ borderRadius: "4px" }}
                    >
                      {isSaving ? "Saving…" : plan.ctaText}
                    </Button>
                  </div>
                </div>
              );
            })()}

            {/* 2. PRO MONTHLY */}
            {(() => {
              const plan = PLANS.pro_monthly;
              const pricing = plan.pricing[currency];
              return (
                <div className="relative flex flex-col justify-between rounded-2xl border-2 border-brand/40 bg-card p-5 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-brand text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-lg">
                    {plan.badge}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-brand uppercase tracking-wider mb-1">
                      {plan.name}
                    </div>
                    <div className="flex items-baseline gap-1 my-2">
                      <span className="text-3xl font-extrabold text-foreground">
                        {pricing.displayPrice}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {pricing.periodLabel}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground italic mb-4">
                      "{plan.tagline}"
                    </p>

                    <div className="border-t border-border/60 pt-3 space-y-2">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-2 text-xs text-foreground">
                          <Check className="h-3.5 w-3.5 text-brand mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs font-semibold border-brand/50 text-brand hover:bg-brand/10"
                      onClick={() => handleChoosePro(plan.name)}
                      disabled={isSaving}
                      style={{ borderRadius: "4px" }}
                    >
                      {plan.ctaText}
                    </Button>
                  </div>
                </div>
              );
            })()}

            {/* 3. PRO ANNUAL */}
            {(() => {
              const plan = PLANS.pro_annual;
              const pricing = plan.pricing[currency];
              return (
                <div className="relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-brand/40 transition-all overflow-hidden">
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-lg">
                    {plan.badge}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      {plan.name}
                    </div>
                    <div className="flex items-baseline gap-1 my-2">
                      <span className="text-3xl font-extrabold text-foreground">
                        {pricing.displayPrice}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {pricing.periodLabel}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground italic mb-4">
                      "{plan.tagline}"
                    </p>

                    <div className="border-t border-border/60 pt-3 space-y-2">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-2 text-xs text-foreground">
                          <Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs font-semibold border-border hover:bg-muted"
                      onClick={() => handleChoosePro(plan.name)}
                      disabled={isSaving}
                      style={{ borderRadius: "4px" }}
                    >
                      {plan.ctaText}
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>

          <p className="mt-4 text-center text-[11.5px] text-muted-foreground">
            You can always change or cancel plans from your dashboard. Basic download is always free.
          </p>
        </DialogContent>
      </Dialog>

      {/* Pro Confirmation Notice Dialog ("Pro payments are coming soon") */}
      <Dialog open={proModalOpen} onOpenChange={setProModalOpen}>
        <DialogContent className="sm:max-w-[420px] p-6 text-center">
          <DialogHeader className="items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand mb-2">
              <Sparkles className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold">
              Pro payments are coming soon.
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
              We are currently finalizing direct payment processing for {selectedProPlanName}.
              In the meantime, you can save your current document using the Free Trial (1 saved document, 7-day cloud storage).
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-2">
            <Button
              variant="brand"
              size="sm"
              className="w-full text-xs font-semibold"
              onClick={handleContinueWithFree}
              style={{ borderRadius: "4px" }}
            >
              Continue with Free
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={() => setProModalOpen(false)}
              style={{ borderRadius: "4px" }}
            >
              Back to Plans
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
