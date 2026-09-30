import type { ComponentType } from "react";
import { ShieldCheck } from "lucide-react";

export interface BenefitItem {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  colorClass?: string;
}

interface WhyUseSectionProps {
  badge?: string;
  title: string;
  subtitle?: string;
  benefits: BenefitItem[];
  id?: string;
  className?: string;
}

export function WhyUseSection({
  badge = "Enterprise Quality",
  title,
  subtitle = "Engineered with client-side cryptography, speed, and cross-platform simplicity.",
  benefits,
  id = "why-use",
  className = "",
}: WhyUseSectionProps) {
  return (
    <section id={id} className={`py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-soft text-brand text-xs font-bold uppercase tracking-wider mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{badge}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 text-muted-foreground text-sm sm:text-base">
            {subtitle}
          </p>
        )}
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${benefits.length > 3 ? "3" : "3"} gap-6`}>
        {benefits.map((benefit, idx) => {
          const Icon = benefit.icon;
          const colorClass = benefit.colorClass || "icon-edit";
          return (
            <div
              key={idx}
              className="rounded-2xl border border-border bg-card p-6 pdf-card-glow flex flex-col justify-between"
            >
              <div>
                <div className={`w-11 h-11 rounded-xl ${colorClass} flex items-center justify-center mb-4 shadow-sm text-white`}>
                  {Icon && <Icon className="w-5 h-5" />}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-1.5">
                  {benefit.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
