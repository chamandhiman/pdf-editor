import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const consent = localStorage.getItem("cookie_consent_status");
      if (!consent) {
        timer = setTimeout(() => setIsVisible(true), 800);
      }
    } catch (e) {
      console.warn("Could not read cookie consent status", e);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem("cookie_consent_status", "accepted_all");
      localStorage.setItem("cookie_consent_date", new Date().toISOString());
    } catch (e) {
      console.warn("Could not save cookie consent", e);
    }
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    try {
      localStorage.setItem("cookie_consent_status", "essential_only");
      localStorage.setItem("cookie_consent_date", new Date().toISOString());
    } catch (e) {
      console.warn("Could not save cookie consent", e);
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie and Privacy Preferences"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md p-5 shadow-2xl text-card-foreground">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <span>Cookie & Privacy Choice</span>
              </h3>
              <button
                type="button"
                onClick={handleEssentialOnly}
                aria-label="Close cookie banner"
                className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              We use essential cookies and browser storage to keep your document workspace secure. We also partner with Google AdSense to show relevant ads. Learn more in our{" "}
              <Link to="/cookies" className="text-brand font-semibold hover:underline">
                Cookie Policy
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-brand font-semibold hover:underline">
                Privacy Policy
              </Link>.
            </p>

            <div className="mt-4 flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="flex-1 rounded-xl text-xs font-bold bg-[#e5322d] hover:bg-[#c92a26] text-white shadow-xs cursor-pointer"
              >
                Accept All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEssentialOnly}
                className="flex-1 rounded-xl text-xs font-semibold border-border hover:bg-muted cursor-pointer"
              >
                Essential Only
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
