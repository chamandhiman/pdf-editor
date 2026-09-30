import { Link } from "@tanstack/react-router";
import { FileText, ArrowRight, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConsistentCtaSectionProps {
  title?: string;
  subtitle?: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  onPrimaryClick?: () => void;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  badge?: string;
  className?: string;
}

export function ConsistentCtaSection({
  title = "Ready to Supercharge Your PDF Workflow?",
  subtitle = "Zero installations, military-grade client-side encryption, and instant high-fidelity document exports.",
  primaryCtaText = "Start Free — No Sign-Up Needed",
  primaryCtaLink,
  onPrimaryClick,
  secondaryCtaText = "Explore All Tools",
  secondaryCtaLink = "/tools",
  badge = "Free • Instant • 100% Private in Browser",
  className = "",
}: ConsistentCtaSectionProps) {
  return (
    <section className={`py-20 md:py-28 relative overflow-hidden ${className}`}>
      {/* Bold red gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand to-orange-600 pointer-events-none" />

      {/* Decorative circles and watermarks */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/3" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mx-auto mb-6 shadow-lg border border-white/20">
          <FileText className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          {title}
        </h2>
        <p className="mt-4 text-base sm:text-lg text-white/85 max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>

        {/* Rating stars */}
        <div className="mt-6 flex items-center justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 text-amber-300 fill-amber-300" />
          ))}
          <span className="text-xs text-white/90 font-semibold ml-2">
            Trusted by 50,000+ professionals worldwide
          </span>
        </div>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {onPrimaryClick ? (
            <Button
              size="xl"
              onClick={onPrimaryClick}
              className="w-full sm:w-auto px-8 py-4 bg-white text-brand font-bold text-base hover:bg-white/90 shadow-2xl transition-all hover:scale-105 cursor-pointer rounded-xl"
            >
              <span>{primaryCtaText}</span>
              <ArrowRight className="w-5 h-5 ml-2 text-brand" />
            </Button>
          ) : primaryCtaLink ? (
            <Button
              size="xl"
              asChild
              className="w-full sm:w-auto px-8 py-4 bg-white text-brand font-bold text-base hover:bg-white/90 shadow-2xl transition-all hover:scale-105 cursor-pointer rounded-xl"
            >
              <Link to={primaryCtaLink}>
                <span>{primaryCtaText}</span>
                <ArrowRight className="w-5 h-5 ml-2 text-brand" />
              </Link>
            </Button>
          ) : (
            <Button
              size="xl"
              asChild
              className="w-full sm:w-auto px-8 py-4 bg-white text-brand font-bold text-base hover:bg-white/90 shadow-2xl transition-all hover:scale-105 cursor-pointer rounded-xl"
            >
              <Link to="/tools">
                <span>{primaryCtaText}</span>
                <ArrowRight className="w-5 h-5 ml-2 text-brand" />
              </Link>
            </Button>
          )}

          {secondaryCtaLink && (
            <Button
              variant="outline"
              size="xl"
              asChild
              className="w-full sm:w-auto px-7 py-4 bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white font-semibold text-base transition-colors rounded-xl"
            >
              <Link to={secondaryCtaLink}>{secondaryCtaText}</Link>
            </Button>
          )}
        </div>

        <p className="mt-6 text-xs text-white/70 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-white/90" />
          <span>{badge}</span>
        </p>
      </div>
    </section>
  );
}
