import type { ComponentType } from "react";
import { Sparkles } from "lucide-react";

export interface WorkflowStep {
  step: string; // e.g. "01"
  title: string;
  description: string;
  badgeText: string;
  badgeIcon: ComponentType<{ className?: string }>;
  colorClass: string; // e.g. "icon-edit", "icon-organize", "icon-convert", "icon-security"
}

interface HowItWorksSectionProps {
  badge?: string;
  title: string;
  subtitle?: string;
  steps: WorkflowStep[];
  id?: string;
  className?: string;
}

export function HowItWorksSection({
  badge = "Simple Workflow",
  title,
  subtitle = "Effortless steps to complete your document task directly in the browser.",
  steps,
  id = "how-it-works",
  className = "",
}: HowItWorksSectionProps) {
  return (
    <section id={id} className={`py-16 md:py-24 bg-muted/40 border-y border-border/60 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-soft text-brand text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
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

        <div className={`grid grid-cols-1 ${steps.length === 4 ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"} gap-6 sm:gap-8 relative`}>
          {steps.map((step) => {
            const BadgeIcon = step.badgeIcon;
            return (
              <div
                key={step.step}
                className="relative rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col items-center text-center pdf-card-glow overflow-hidden justify-between"
              >
                {/* Colored top accent strip */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${step.colorClass} rounded-t-2xl`} />

                <div>
                  <div className={`w-14 h-14 rounded-2xl ${step.colorClass} flex items-center justify-center font-extrabold text-xl mb-6 shadow-lg text-white mx-auto`}>
                    {step.step}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-6 w-full pt-4 border-t border-border/50 text-xs font-semibold text-brand flex items-center justify-center gap-1.5">
                  {BadgeIcon && <BadgeIcon className="w-4 h-4" />}
                  <span>{step.badgeText}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
