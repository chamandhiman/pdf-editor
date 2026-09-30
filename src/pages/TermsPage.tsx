import { useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FileCheck2, Scale, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { SaasHeader } from "@/components/saas/SaasHeader";
import { SaasFooter } from "@/components/saas/SaasFooter";
import { ConsistentFaqSection } from "@/components/saas/ConsistentFaqSection";
import { ConsistentCtaSection } from "@/components/saas/ConsistentCtaSection";
import { termsFaq } from "@/lib/faq-data";
import { setUploadedPdf } from "@/lib/pdf-store";

export function TermsPage() {
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
        onChange={(e) => {
          if (e.target.files?.[0]) handleProcessFile(e.target.files[0]);
        }}
      />

      <SaasHeader onOpenUploadModal={handleTriggerUpload} />

      <main className="flex-1 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-soft text-brand text-xs font-semibold mb-4">
              <Scale className="w-3.5 h-3.5" />
              <span>Terms & Agreements</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Terms of Use
            </h1>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground">
              Last updated: September 2026. Please read these terms carefully before using PDF Studio.
            </p>
          </div>

          <div className="prose prose-sm sm:prose max-w-none text-muted-foreground space-y-8">
            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing or using PDF Studio by WebToolOcean ("the Service"), whether as a guest or registered user, you agree to comply with and be bound by these Terms of Service. If you disagree with any portion of these terms, you should immediately discontinue use of the Service.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">2. User Accounts & Google Authentication</h2>
              <p className="leading-relaxed">
                You may access core editing features anonymously or opt to sign in using Google Single Sign-On (OAuth). When creating an account, you agree to maintain the security of your authentication credentials. You are solely responsible for all activities and saved workspace documents associated with your account.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">3. Document Ownership & Intellectual Property</h2>
              <p className="leading-relaxed">
                You retain complete, exclusive ownership and all intellectual property rights to any files, documents, text, images, or signatures you upload, process, or download through PDF Studio. WebToolOcean claims zero ownership or licensing rights over your content.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">4. Client-Side Processing Architecture</h2>
              <p className="leading-relaxed">
                PDF Studio runs PDF parsing, page manipulation, text editing, and document rendering locally within your device browser using modern WebAssembly and HTML5 Canvas technologies. In standard mode, your documents are never transmitted to or stored on remote servers.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">5. Acceptable Use Policy</h2>
              <p className="leading-relaxed">
                You agree not to use PDF Studio for any unlawful purpose, including processing documents containing malicious code, violating copyright or trademark laws, distributing fraudulent materials, or attempting to reverse engineer or disrupt the service infrastructure.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">6. Disclaimer of Warranties & Limitation of Liability</h2>
              <p className="leading-relaxed">
                The Service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied. WebToolOcean shall not be held liable for any data loss, document corruption, business interruption, or consequential damages resulting from the use or inability to use the Service.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">7. Modifications & Termination</h2>
              <p className="leading-relaxed">
                We reserve the right to amend or replace these Terms at our discretion. Notice of substantial revisions will be reflected by the "Last updated" date. Continued use of PDF Studio constitutes acceptance of the modified Terms.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* CONSISTENT FAQ */}
      <ConsistentFaqSection
        badge="Legal & Usage FAQs"
        title="Frequently Asked Terms & Licensing Questions"
        subtitle="Clear details regarding commercial rights, data sovereignty, and fair use."
        items={termsFaq}
      />

      {/* CONSISTENT CTA */}
      <ConsistentCtaSection
        title="Ready to Start Editing Your Documents?"
        subtitle="Completely free with no credit card required. Fast, private, and browser-powered."
        primaryCtaText="Launch PDF Studio"
        onPrimaryClick={handleTriggerUpload}
        secondaryCtaText="Explore All Tools"
        secondaryCtaLink="/tools"
      />

      <SaasFooter />
    </div>
  );
}
