import { useRef } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Globe,
  Heart,
  FileBadge,
  Boxes,
  Users,
  CheckCircle2,
  Lock,
  Cpu,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

import { SaasHeader } from "@/components/saas/SaasHeader";
import { SaasFooter } from "@/components/saas/SaasFooter";
import { ConsistentFaqSection } from "@/components/saas/ConsistentFaqSection";
import { ConsistentCtaSection } from "@/components/saas/ConsistentCtaSection";
import { aboutFaq } from "@/lib/faq-data";
import { setUploadedPdf } from "@/lib/pdf-store";

export function AboutPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-brand selection:text-white">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        aria-hidden="true"
        onChange={(e) => {
          if (e.target.files?.[0]) handleProcessFile(e.target.files[0]);
        }}
      />

      <SaasHeader onOpenUploadModal={handleTriggerUpload} />

      <main className="flex-1 py-16 md:py-24" id="main-content">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Header */}
          <header className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-semibold mb-4 border border-brand/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>About WebToolOcean PDF Studio</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
              Empowering the World with Fast, Private & Browser-Powered PDF Tools
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
              We started WebToolOcean PDF Studio with a clear conviction: you shouldn't have to upload your most sensitive contracts, financial statements, and personal records to mysterious cloud servers just to edit text or convert a file.
            </p>
          </header>

          {/* Core Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="rounded-3xl border border-border bg-card p-8 shadow-xs hover:border-brand/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-5">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">Zero-Upload Privacy</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                By harnessing modern WebAssembly and HTML5 Canvas, PDF Studio parses and edits documents strictly inside your browser's private memory. Your data never leaves your device.
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-8 shadow-xs hover:border-brand/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5">
                <Zap className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">Instant Execution</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No upload queues, no server upload delays, and no file size bottlenecks. Operations execute with sub-second latency directly on your local hardware.
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-8 shadow-xs hover:border-brand/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5">
                <Globe className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">Universal Accessibility</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Engineered to meet WCAG 2.1 AA accessibility guidelines with full screen reader compatibility, keyboard navigation, and responsive typography on any device.
              </p>
            </div>
          </div>

          {/* Deep Narrative Sections */}
          <div className="space-y-12">
            <section className="rounded-3xl border border-border bg-card p-8 sm:p-12">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand mb-3">
                  <Cpu className="w-4 h-4" />
                  <span>The Technology Behind PDF Studio</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  Transforming the Browser into a Workstation
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    Traditional PDF platforms operate on an antiquated architecture: you upload your confidential documents to an external web server, wait for a batch job to run, and download the resulting file. This architecture introduces security risks, privacy vulnerabilities, and unnecessary bandwidth delays.
                  </p>
                  <p>
                    WebToolOcean PDF Studio flips this paradigm completely. We compile high-performance PDF manipulation engines (including Mozilla's PDF.js and pdf-lib) and cryptographic modules into high-efficiency client-side JavaScript and WebAssembly.
                  </p>
                  <p>
                    Whether you are performing 256-bit AES password encryption, merging 50 pages into a consolidated portfolio, or converting slides to Microsoft PowerPoint (.pptx), computation happens right inside your local browser sandbox.
                  </p>
                </div>
              </div>
            </section>

            {/* Part of WebToolOcean Suite */}
            <section className="rounded-3xl border border-border bg-card p-8 sm:p-12">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand mb-3">
                <Boxes className="w-4 h-4" />
                <span>WebToolOcean Ecosystem</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Part of the WebToolOcean Family of Productivity Apps
              </h2>
              <p className="text-sm text-muted-foreground mb-8 max-w-2xl leading-relaxed">
                WebToolOcean is dedicated to crafting intuitive, accessible, and high-performance digital tools that empower students, professionals, and businesses worldwide.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <a
                  href="https://Resume.webtoolocean.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 rounded-2xl border border-border bg-background hover:border-brand/40 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <FileBadge className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-1 group-hover:text-brand">
                    Resume Builder <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI-powered modern resume builder with ATS-friendly templates.
                  </p>
                </a>

                <a
                  href="https://builder.webtoolocean.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 rounded-2xl border border-border bg-background hover:border-brand/40 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Globe className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-1 group-hover:text-brand">
                    Website Builder <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    No-code drag and drop website builder for modern landing pages.
                  </p>
                </a>

                <a
                  href="https://webtoolocean.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 rounded-2xl border border-border bg-background hover:border-brand/40 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-1 group-hover:text-brand">
                    WebToolOcean Suite <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    All-in-one suite of web utilities, calculators, and converters.
                  </p>
                </a>
              </div>
            </section>

            {/* Accessibility & Ethical Commitment */}
            <section className="rounded-3xl border border-border bg-card p-8 sm:p-12">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Our Standards & Ethics</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  Built for Everyone, Everywhere
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    <strong>Accessibility by Default:</strong> We believe essential document utilities should be accessible to all users, regardless of physical ability or device constraints. PDF Studio is actively optimized for screen readers, keyboard-only navigation, and high-contrast environments.
                  </p>
                  <p>
                    <strong>Ad Transparency:</strong> To maintain high-quality free tools for millions of users without locking basic features behind paywalls, we display carefully vetted, non-intrusive advertisements through reputable partners like Google AdSense. We do not sell or monetize personal document data.
                  </p>
                  <p>
                    Have ideas, feedback, or need enterprise collaboration? Reach out to our team at{" "}
                    <a href="mailto:support@webtoolocean.com" className="text-brand font-semibold hover:underline">
                      support@webtoolocean.com
                    </a>{" "}
                    or explore our{" "}
                    <Link to="/contact" className="text-brand font-semibold hover:underline">
                      Contact Page
                    </Link>.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* CONSISTENT FAQ */}
      <ConsistentFaqSection
        badge="About Us FAQs"
        title="Frequently Asked Questions About PDF Studio"
        subtitle="Learn more about our technology, mission, and how we protect user privacy."
        items={aboutFaq}
      />

      {/* CONSISTENT CTA */}
      <ConsistentCtaSection
        title="Experience the Future of PDF Editing"
        subtitle="Fast, private, and 100% browser-powered. Start working with your document today."
        primaryCtaText="Launch PDF Studio"
        onPrimaryClick={handleTriggerUpload}
        secondaryCtaText="Explore All Tools"
        secondaryCtaLink="/tools"
      />

      <SaasFooter />
    </div>
  );
}
