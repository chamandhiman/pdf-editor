import { useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Sparkles, Shield, Zap, Lock, Cloud, ShieldCheck, HeartHandshake, FileCheck } from "lucide-react";
import { toast } from "sonner";

import { SaasHeader } from "@/components/saas/SaasHeader";
import { SaasFooter } from "@/components/saas/SaasFooter";
import { ToolWorkspaceModal } from "@/components/saas/ToolWorkspaceModal";
import { HowItWorksSection } from "@/components/saas/HowItWorksSection";
import { WhyUseSection } from "@/components/saas/WhyUseSection";
import { ConsistentFaqSection } from "@/components/saas/ConsistentFaqSection";
import { ConsistentCtaSection } from "@/components/saas/ConsistentCtaSection";
import { pricingFaq } from "@/lib/faq-data";
import { type PdfTool } from "@/lib/pdf-tools-data";
import { setUploadedPdf } from "@/lib/pdf-store";

export function PricingPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTool, setSelectedTool] = useState<PdfTool | null>(null);

  const handleProcessFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      toast.error("Please select a valid PDF file.");
      return;
    }

    const toastId = toast.loading(`Loading ${file.name}...`);
    try {
      const buffer = await file.arrayBuffer();
      setUploadedPdf(buffer, file.name);

      toast.success("Document loaded successfully", { id: toastId });
      navigate({
        to: "/editor",
        search: { file: file.name },
      });
    } catch (err) {
      console.error("Failed to load PDF:", err);
      toast.error("Failed to read PDF file.", { id: toastId });
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSubscribeClick = (planName: string) => {
    if (planName === "Free") {
      handleTriggerUpload();
    } else {
      toast.info(`${planName} subscriptions are opening soon! All core tools are currently free during public preview.`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-brand selection:text-white">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleProcessFile(e.target.files[0]);
        }}
      />

      <SaasHeader
        onOpenUploadModal={handleTriggerUpload}
        onSelectTool={(tool) => setSelectedTool(tool)}
      />

      <main className="flex-1 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-soft text-brand text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Transparent & Predictable</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Simple Plans For Every Workflow
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground">
              Get started with our full suite of in-browser editing tools for free.
              Upgrade when your organization needs expanded team storage and automated batch pipelines.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {/* Free Plan */}
            <div className="rounded-3xl border border-border bg-card p-8 flex flex-col justify-between shadow-sm">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-xs font-semibold text-muted-foreground mb-4">
                  Community
                </div>
                <h2 className="text-2xl font-bold text-foreground">Free</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Core editing and annotation for personal documents.
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">$0</span>
                  <span className="text-sm text-muted-foreground">/ month</span>
                </div>

                <div className="mt-8 space-y-3.5">
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Basic PDF tools</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Upload and edit any PDF</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Basic downloads with zero watermarks</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Full text, heading & drawing overlays</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Private local in-browser processing</span>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={() => handleSubscribeClick("Free")}
                  className="w-full py-3 rounded-xl border border-input bg-card font-semibold text-sm text-foreground hover:bg-accent transition-colors cursor-pointer"
                >
                  Start Free Now
                </button>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="rounded-3xl border-2 border-brand bg-card p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-brand text-white text-[11px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">
                Most Popular
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-soft text-brand text-xs font-semibold mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  Professional
                </div>
                <h2 className="text-2xl font-bold text-foreground">Premium</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  High-speed processing and advanced format utilities.
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">$9</span>
                  <span className="text-sm text-muted-foreground">/ month</span>
                </div>

                <div className="mt-8 space-y-3.5">
                  <div className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                    <span>Everything in Free, plus:</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                    <span>Advanced tools & OCR recognition</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                    <span>More document storage & cloud sync</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                    <span>High-volume batch conversions</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                    <span>Priority features & early releases</span>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={() => handleSubscribeClick("Premium")}
                  className="w-full py-3 rounded-xl bg-brand text-white font-semibold text-sm shadow hover:bg-brand/90 transition-colors cursor-pointer"
                >
                  Join Premium Waitlist
                </button>
              </div>
            </div>

            {/* Team Plan */}
            <div className="rounded-3xl border border-border bg-card p-8 flex flex-col justify-between shadow-sm">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-xs font-semibold text-muted-foreground mb-4">
                  Organization
                </div>
                <h2 className="text-2xl font-bold text-foreground">Team</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Shared document workspaces, audit logs, and SSO.
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">$19</span>
                  <span className="text-sm text-muted-foreground">/ user / mo</span>
                </div>

                <div className="mt-8 space-y-3.5">
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Everything in Premium</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Centralized admin console</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Shared team document templates</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Audit history and access control</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Dedicated priority email support</span>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={() => handleSubscribeClick("Team")}
                  className="w-full py-3 rounded-xl border border-input bg-card font-semibold text-sm text-foreground hover:bg-accent transition-colors cursor-pointer"
                >
                  Contact Sales
                </button>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="mt-16 text-center max-w-2xl mx-auto">
            <div className="p-4 rounded-2xl bg-muted/50 border border-border text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 text-brand shrink-0" />
              <span>
                Payments are not currently billed. All core tools remain free to use with no credit card required.
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* 1. HOW IT WORKS */}
      <HowItWorksSection
        badge="Simple & Fair"
        title="How Subscription & Access Works"
        subtitle="Transparent onboarding designed for both individual creators and enterprise teams."
        steps={[
          {
            step: "01",
            title: "Choose Your Plan",
            description: "Start completely free with zero credit card required or unlock team-scale capacities.",
            badgeText: "Instant Activation",
            badgeIcon: Sparkles,
            colorClass: "icon-edit",
          },
          {
            step: "02",
            title: "Process Documents",
            description: "Edit, protect, annotate, and merge your PDFs with client-side zero-latency speed.",
            badgeText: "100% In-Browser",
            badgeIcon: Zap,
            colorClass: "icon-convert",
          },
          {
            step: "03",
            title: "Export & Share",
            description: "Download crystal-clear vector PDFs without watermarks or upload limits.",
            badgeText: "Zero Watermarks",
            badgeIcon: FileCheck,
            colorClass: "icon-organize",
          },
        ]}
      />

      {/* 2. WHY USE SECTION */}
      <WhyUseSection
        badge="Enterprise Guarantee"
        title="Why Choose WebToolOcean PDF Studio"
        subtitle="Unmatched privacy, high rendering fidelity, and transparent policies."
        benefits={[
          {
            icon: ShieldCheck,
            title: "Client-Side Zero-Knowledge",
            description: "Documents are processed locally in your browser memory. Your files never touch external clouds.",
            colorClass: "icon-security",
          },
          {
            icon: Zap,
            title: "High Performance Engine",
            description: "Instant loading and lightning-fast exports with no file upload queues or bandwidth throttling.",
            colorClass: "icon-convert",
          },
          {
            icon: Lock,
            title: "Bank-Grade Encryption",
            description: "All document protection adheres to ISO 32000 256-bit AES standards compatible with Adobe Acrobat.",
            colorClass: "icon-edit",
          },
          {
            icon: Cloud,
            title: "Cross-Platform Freedom",
            description: "Works on Windows, macOS, Linux, iOS, and Android without downloading any software.",
            colorClass: "icon-organize",
          },
          {
            icon: HeartHandshake,
            title: "No Hidden Paywalls",
            description: "Core features are free forever. No deceptive countdown timers or forced watermark stamps.",
            colorClass: "icon-edit",
          },
          {
            icon: Sparkles,
            title: "Continuous Enhancements",
            description: "New tools, OCR improvements, and format conversions roll out regularly with zero downtime.",
            colorClass: "icon-convert",
          },
        ]}
      />

      {/* 3. CONSISTENT FAQ */}
      <ConsistentFaqSection
        badge="Pricing FAQs"
        title="Frequently Asked Questions About Billing"
        subtitle="Transparent answers regarding our community tiers, team licensing, and refund guarantees."
        items={pricingFaq}
      />

      {/* 4. FINAL CTA BANNER */}
      <ConsistentCtaSection
        title="Start Using WebToolOcean PDF Studio Today"
        subtitle="No credit card, no sign-up barrier, and complete document privacy guaranteed."
        primaryCtaText="Launch Free Studio"
        onPrimaryClick={handleTriggerUpload}
        secondaryCtaText="Browse All Tools"
        secondaryCtaLink="/tools"
      />

      <SaasFooter onSelectTool={(tool) => setSelectedTool(tool)} />

      <ToolWorkspaceModal
        tool={selectedTool}
        isOpen={Boolean(selectedTool)}
        onClose={() => setSelectedTool(null)}
        onOpenEditor={handleTriggerUpload}
      />
    </div>
  );
}
