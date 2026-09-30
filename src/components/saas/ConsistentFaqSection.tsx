import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export interface FaqEntry {
  q: string;
  a: string;
}

interface ConsistentFaqSectionProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  items: FaqEntry[];
  id?: string;
  className?: string;
}

export function ConsistentFaqSection({
  badge = "Got Questions?",
  title = "Frequently Asked Questions",
  subtitle = "Clear, accurate answers regarding features, browser privacy, and compatibility.",
  items,
  id = "faq",
  className = "",
}: ConsistentFaqSectionProps) {
  return (
    <section id={id} className={`py-16 md:py-24 bg-muted/30 border-y border-border/60 ${className}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-soft text-brand text-xs font-bold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{badge}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-3 text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        <Accordion type="single" collapsible className="w-full space-y-3.5">
          {items.map((item, index) => (
            <AccordionItem
              key={index}
              value={`faq-${index}`}
              className="rounded-2xl border border-border bg-card px-5 sm:px-6 py-1 data-[state=open]:border-brand/40 data-[state=open]:shadow-md transition-all pdf-card-glow"
            >
              <AccordionTrigger className="text-sm sm:text-base font-semibold text-foreground hover:no-underline py-4 text-left cursor-pointer group">
                <span className="group-hover:text-brand transition-colors">{item.q}</span>
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pb-4 pt-1">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
