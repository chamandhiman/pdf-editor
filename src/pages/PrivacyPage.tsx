import { useRef } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { ShieldCheck, Lock, EyeOff, Server, HardDrive, FileUp } from "lucide-react";
import { toast } from "sonner";

import { SaasHeader } from "@/components/saas/SaasHeader";
import { SaasFooter } from "@/components/saas/SaasFooter";
import { ConsistentFaqSection } from "@/components/saas/ConsistentFaqSection";
import { ConsistentCtaSection } from "@/components/saas/ConsistentCtaSection";
import { privacyFaq } from "@/lib/faq-data";
import { setUploadedPdf } from "@/lib/pdf-store";

export function PrivacyPage() {
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
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Data Protection</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Privacy Policy
            </h1>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground">
              Last updated: September 2026. How PDF Studio respects and protects your document privacy.
            </p>
          </div>

          {/* Privacy Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            <div className="rounded-2xl border border-border bg-card p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <HardDrive className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-foreground text-sm">Local Client Processing</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Your PDF files are parsed and edited in your browser's local memory.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                <EyeOff className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-foreground text-sm">Zero Ad Profiling</h2>
              <p className="text-xs text-muted-foreground mt-1">
                We do not sell document contents or metadata to third-party ad networks.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-foreground text-sm">You Own Your Data</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Your uploaded documents remain your exclusive intellectual property.
              </p>
            </div>
          </div>

          {/* Document Content */}
          <div className="prose prose-sm sm:prose max-w-none text-muted-foreground space-y-8">
            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">1. Information We Collect</h2>
              <div className="space-y-3 leading-relaxed">
                <p>
                  <strong>Document Data:</strong> When you open or edit a document in PDF Studio, your file is processed directly in your device's browser memory using client-side JavaScript and WebAssembly. Your files are not uploaded to, parsed by, or stored on external servers in standard editing mode.
                </p>
                <p>
                  <strong>Google Authentication Data:</strong> If you choose to sign in using Google Single Sign-On (OAuth), we collect your name, email address, and profile picture provided by Google. This data is used solely to authenticate your identity, provide access to your cloud dashboard, and display your user profile.
                </p>
                <p>
                  We do not request or access your Google contacts, Google Drive files, or any other sensitive account scopes.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">2. How We Use and Share Information</h2>
              <p className="leading-relaxed">
                We strictly use account information to authenticate users and manage saved document workspaces. We do <strong>not</strong> sell, rent, monetize, or share your personal data or document contents with third-party advertisers, data brokers, or AI model training datasets.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">3. Local Storage, Cookies & Advertising Partners</h2>
              <div className="space-y-3 leading-relaxed">
                <p>
                  PDF Studio utilizes browser local storage (IndexedDB and localStorage) to preserve your document drafts, signature presets, and recent workspace files locally on your own machine.
                </p>
                <p>
                  <strong>Google AdSense & DoubleClick DART Cookie:</strong> We use Google AdSense and third-party advertising partners to serve ads when you visit our website. Google, as a third-party vendor, uses cookies to serve ads on our site. Google's use of the DoubleClick DART cookie enables it and its partners to serve ads to users based on their visit to our site and/or other sites on the internet.
                </p>
                <p>
                  Users may opt out of the use of the DART cookie for interest-based advertising by visiting the{" "}
                  <a
                    href="https://adssettings.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand font-semibold hover:underline"
                  >
                    Google Ad and Content Network Privacy Policy
                  </a>{" "}
                  or the{" "}
                  <a
                    href="https://optout.aboutads.info/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand font-semibold hover:underline"
                  >
                    Digital Advertising Alliance Opt-Out Page
                  </a>. For more information, please see our dedicated <Link to="/cookies" className="text-brand font-semibold hover:underline">Cookie Policy</Link>.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">4. California Consumer Privacy Act (CCPA / CPRA)</h2>
              <div className="space-y-3 leading-relaxed">
                <p>
                  Under the CCPA, California consumers have the right to:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Request disclosure of the categories and specific pieces of personal data collected.</li>
                  <li>Request immediate deletion of any personal data collected.</li>
                  <li><strong>Do Not Sell My Personal Information:</strong> WebToolOcean does not sell your personal information or document contents to any third parties for monetary or other considerations.</li>
                  <li>Not be discriminated against for exercising any of your consumer privacy rights.</li>
                </ul>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">5. European Union (GDPR) & UK Data Subject Rights</h2>
              <div className="space-y-3 leading-relaxed">
                <p>
                  If you reside in the European Economic Area (EEA) or United Kingdom, you are entitled to rights under the General Data Protection Regulation (GDPR), including the right of access, rectification, erasure, restriction of processing, data portability, and the right to object to processing.
                </p>
                <p>
                  Because PDF Studio functions strictly on client-side technology, your document contents never enter our custody. To exercise rights over account information or request total profile erasure, email us at <a href="mailto:privacy@webtoolocean.com" className="text-brand font-semibold hover:underline">privacy@webtoolocean.com</a>.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">6. Children's Online Privacy Protection (COPPA)</h2>
              <p className="leading-relaxed">
                We believe in protecting children's privacy online. WebToolOcean PDF Studio does not knowingly collect or solicit any personally identifiable information from children under the age of 13. If you believe that a child has provided us with personal information, please contact us immediately and we will promptly delete such records.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">7. Contact Information & Policy Updates</h2>
              <p className="leading-relaxed">
                We may periodically update this policy to reflect new capabilities or regulatory requirements. For any privacy inquiries, reach out through our <Link to="/contact" className="text-brand font-semibold hover:underline">Contact Page</Link> or directly via email at{" "}
                <a href="mailto:privacy@webtoolocean.com" className="text-brand font-semibold hover:underline">
                  privacy@webtoolocean.com
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* CONSISTENT FAQ */}
      <ConsistentFaqSection
        badge="Privacy & Security FAQs"
        title="Data Privacy Frequently Asked Questions"
        subtitle="Transparent explanations regarding browser-only processing and zero telemetry."
        items={privacyFaq}
      />

      {/* CONSISTENT CTA */}
      <ConsistentCtaSection
        title="Experience 100% Private PDF Processing"
        subtitle="No document uploads to remote servers. All operations execute strictly in your local device memory."
        primaryCtaText="Launch PDF Studio Free"
        onPrimaryClick={handleTriggerUpload}
        secondaryCtaText="Explore All Tools"
        secondaryCtaLink="/tools"
      />

      <SaasFooter />
    </div>
  );
}
