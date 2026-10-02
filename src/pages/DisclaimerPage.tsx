import { useRef } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { AlertCircle, FileCheck2, Scale, ShieldAlert, Sparkles, CheckCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { SaasHeader } from "@/components/saas/SaasHeader";
import { SaasFooter } from "@/components/saas/SaasFooter";
import { ConsistentFaqSection } from "@/components/saas/ConsistentFaqSection";
import { ConsistentCtaSection } from "@/components/saas/ConsistentCtaSection";
import { disclaimerFaq } from "@/lib/faq-data";
import { setUploadedPdf } from "@/lib/pdf-store";

export function DisclaimerPage() {
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Title */}
          <header className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-semibold mb-4 border border-brand/20">
              <Scale className="w-3.5 h-3.5" />
              <span>Legal Disclaimers & Usage Notices</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Disclaimer
            </h1>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground">
              Last updated: September 2026. Important information regarding document fidelity, warranties, and third-party advertising on WebToolOcean PDF Studio.
            </p>
          </header>

          {/* Quick Notice Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            <div className="rounded-2xl border border-border bg-card p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-foreground text-sm">"As-Is" Software</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Tools are provided without express warranties of fitness or error-free operation.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-foreground text-sm">Not Legal Advice</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Signature and contract tools do not constitute legal counsel or enforceability guarantees.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-3">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-foreground text-sm">Zero-Knowledge Security</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Forgotten PDF encryption passwords cannot be recovered by our team under any circumstances.
              </p>
            </div>
          </div>

          {/* Detailed Sections */}
          <article className="prose prose-sm sm:prose max-w-none text-muted-foreground space-y-8">
            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">
                1. General Information & Website Use
              </h2>
              <p className="text-sm leading-relaxed">
                The information and software utilities provided by <strong>PDF Studio</strong> ("we", "us", or "our") on{" "}
                <code>pdf.webtoolocean.com</code> are intended for general document editing, viewing, and conversion purposes. All software tools, documentation, guides, and templates are made available in good faith; however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information or output generated by the Service.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">
                2. Document Conversion, Rendering & OCR Accuracy
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  PDF Studio utilizes advanced client-side parsing engines (including PDF.js and WebAssembly) to extract text, tables, images, and form inputs for conversion into formats like Microsoft Word (.docx), Excel (.xlsx), PowerPoint (.pptx), JPEG, and PNG.
                </p>
                <p>
                  While our algorithms strive for maximum layout and typographical fidelity, complex document structures — including customized embedded fonts, complex mathematical formulas, layered vector graphics, scanned handwritten text, or multi-column layouts — may experience subtle formatting shifts. <strong>Users must inspect and verify the completeness and accuracy of all converted files before relying upon them for mission-critical, regulatory, or commercial purposes.</strong>
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">
                3. Electronic Signatures & Legal Enforceability
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  PDF Studio provides graphical signature drawing and stamping capabilities to allow users to sign documents quickly. However, PDF Studio does not function as a licensed Certificate Authority (CA) or certified trust service provider under electronic identification statutes (such as the US ESIGN Act or EU eIDAS regulation).
                </p>
                <p>
                  Use of our electronic signing tools does not constitute legal, tax, or regulatory advice. You are solely responsible for determining whether a digital or drawn signature created via PDF Studio meets the statutory requirements of your jurisdiction and specific agreement.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">
                4. Password Protection & Loss of Passwords
              </h2>
              <p className="text-sm leading-relaxed">
                Our Protect PDF tool applies standard 256-bit AES encryption locally within your device browser using the Web Crypto API. Because PDF Studio operates under a strict zero-knowledge architecture, WebToolOcean does not transmit, log, or store your passwords. <strong>If you lose or forget the password configured for an encrypted PDF, neither WebToolOcean nor any automated system can recover or decrypt your file.</strong>
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">
                5. Third-Party Links & Advertising Disclaimer (Google AdSense)
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  This website may display advertisements served by third-party ad networks, including <strong>Google AdSense</strong>, and may contain links to external third-party websites or services that are not owned or controlled by WebToolOcean.
                </p>
                <p>
                  WebToolOcean does not warrant, endorse, guarantee, or assume responsibility for the accuracy or reliability of any information, products, or claims made by third-party advertisers or websites linked through the Service. Any transactions, purchases, or interactions between you and third-party advertisers are strictly between you and that third party.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">
                6. Limitation of Liability
              </h2>
              <p className="text-sm leading-relaxed">
                In no event shall WebToolOcean, its developers, affiliates, or contributors be held liable for any direct, indirect, incidental, special, consequential, or punitive damages — including but not limited to loss of data, document corruption, computer hardware failure, lost profits, or business interruption — arising out of or in connection with your access to, use of, or inability to use PDF Studio or any output generated by our tools.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">
                7. Contact Information
              </h2>
              <p className="text-sm leading-relaxed">
                If you have any questions or require clarification regarding this Disclaimer, please contact our team via email at{" "}
                <a href="mailto:support@webtoolocean.com" className="text-brand font-semibold hover:underline">
                  support@webtoolocean.com
                </a>{" "}
                or visit our{" "}
                <Link to="/contact" className="text-brand font-semibold hover:underline">
                  Contact Support
                </Link>{" "}
                page.
              </p>
            </section>
          </article>
        </div>
      </main>

      {/* CONSISTENT FAQ */}
      <ConsistentFaqSection
        badge="Legal & Warranty FAQs"
        title="Frequently Asked Disclaimer Questions"
        subtitle="Clear explanations regarding software warranties, document accuracy, and encryption limits."
        items={disclaimerFaq}
      />

      {/* CONSISTENT CTA */}
      <ConsistentCtaSection
        title="Ready to Edit or Convert Your PDF?"
        subtitle="100% private, client-side document processing in your browser. Fast, free, and secure."
        primaryCtaText="Launch PDF Studio"
        onPrimaryClick={handleTriggerUpload}
        secondaryCtaText="Explore All Tools"
        secondaryCtaLink="/tools"
      />

      <SaasFooter />
    </div>
  );
}
