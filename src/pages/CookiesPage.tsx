import { useRef } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Cookie, ShieldCheck, Settings, ExternalLink, Info, CheckCircle2, Sliders, ToggleLeft } from "lucide-react";
import { toast } from "sonner";

import { SaasHeader } from "@/components/saas/SaasHeader";
import { SaasFooter } from "@/components/saas/SaasFooter";
import { ConsistentFaqSection } from "@/components/saas/ConsistentFaqSection";
import { ConsistentCtaSection } from "@/components/saas/ConsistentCtaSection";
import { cookiesFaq } from "@/lib/faq-data";
import { setUploadedPdf } from "@/lib/pdf-store";

export function CookiesPage() {
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
              <Cookie className="w-3.5 h-3.5" />
              <span>Cookie Transparency & Consent</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Cookie Policy
            </h1>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground">
              Last updated: September 2026. How PDF Studio by WebToolOcean uses cookies, local storage, and third-party advertising partners like Google AdSense.
            </p>
          </header>

          {/* Quick Highlights Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            <div className="rounded-2xl border border-border bg-card p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-foreground text-sm">Essential Storage Only</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Local storage is used solely to maintain user sessions and active drafts on your machine.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                <Sliders className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-foreground text-sm">You Have Full Control</h2>
              <p className="text-xs text-muted-foreground mt-1">
                You can easily block or delete cookies anytime through your web browser preferences.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-3">
                <ToggleLeft className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-foreground text-sm">Google AdSense Standards</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Fully compliant with Google advertising policies, GDPR consent, and CCPA privacy standards.
              </p>
            </div>
          </div>

          {/* Policy Content Sections */}
          <article className="prose prose-sm sm:prose max-w-none text-muted-foreground space-y-8">
            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                <span>1. What Are Cookies and Local Storage?</span>
              </h2>
              <div className="space-y-3 leading-relaxed text-sm">
                <p>
                  Cookies are tiny text files stored in your web browser by websites you visit. They allow websites to remember user actions, retain login sessions, and optimize site performance.
                </p>
                <p>
                  In addition to traditional HTTP cookies, <strong>WebToolOcean PDF Studio</strong> uses modern browser storage mechanisms, such as <code>localStorage</code> and <code>IndexedDB</code>. Because PDF Studio operates on a client-side architecture, your documents, temporary edit states, and custom signature drawings are stored directly inside your browser's private memory sandbox rather than on external cloud servers.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">
                2. Categories of Cookies We Use
              </h2>
              <div className="space-y-4 text-sm leading-relaxed">
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">A. Strictly Necessary / Essential Cookies</h3>
                  <p>
                    These cookies are necessary for the website to function properly. They handle authentication sessions (via Google OAuth), security protections against CSRF/XSS attacks, and basic document workspace navigation. The website cannot function without these items.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">B. Functional & Preference Cookies</h3>
                  <p>
                    Functional cookies allow us to remember choices you make, such as your preferred UI theme (dark mode or light mode), your active PDF zoom level, or your most recently used font selections in the editor.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">C. Performance & Analytics Cookies</h3>
                  <p>
                    These cookies collect aggregated, anonymous statistics about how visitors interact with our pages (such as which PDF conversion tools are used most frequently). This information allows us to optimize loading speeds, diagnose client errors, and improve tool responsiveness.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">D. Third-Party Advertising Cookies (Google AdSense)</h3>
                  <p>
                    We may partner with third-party advertising networks, primarily <strong>Google AdSense</strong>, to display advertisements on our website. These third-party vendors use cookies to serve ads based on your previous visits to this website or other sites on the internet.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">
                3. Google AdSense & The DoubleClick DART Cookie
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  Google is a third-party vendor on our site. Google uses cookies, specifically the <strong>DoubleClick DART cookie</strong>, to serve targeted advertisements to our users based on their visits to <code>pdf.webtoolocean.com</code> and other destinations across the web.
                </p>
                <div className="p-4 rounded-xl bg-brand/5 border border-brand/20 text-xs text-foreground/90 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-brand">
                    <Info className="w-4 h-4" />
                    <span>How to Opt Out of Google Personalized Ads:</span>
                  </div>
                  <p>
                    Users may opt out of personalized advertising by visiting{" "}
                    <a
                      href="https://adssettings.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand font-semibold hover:underline inline-flex items-center gap-0.5"
                    >
                      Google Ads Settings <ExternalLink className="w-3 h-3" />
                    </a>.
                  </p>
                  <p>
                    Alternatively, you can opt out of a third-party vendor's use of cookies for personalized advertising by visiting{" "}
                    <a
                      href="https://optout.aboutads.info/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand font-semibold hover:underline inline-flex items-center gap-0.5"
                    >
                      aboutads.info <ExternalLink className="w-3 h-3" />
                    </a>{" "}
                    or the{" "}
                    <a
                      href="https://optout.networkadvertising.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand font-semibold hover:underline inline-flex items-center gap-0.5"
                    >
                      Network Advertising Initiative Opt-Out <ExternalLink className="w-3 h-3" />
                    </a>.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">
                4. Cookie Inventory & Storage Breakdown
              </h2>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-foreground font-bold">
                      <th className="p-3">Item / Cookie</th>
                      <th className="p-3">Provider</th>
                      <th className="p-3">Purpose</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="p-3 font-mono text-[11px]">pdf_workspace_state</td>
                      <td className="p-3">WebToolOcean</td>
                      <td className="p-3">Stores active document edits locally in your browser memory</td>
                      <td className="p-3 font-semibold text-emerald-600">Essential</td>
                      <td className="p-3">Session</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[11px]">firebase_auth_token</td>
                      <td className="p-3">Google Firebase</td>
                      <td className="p-3">Secure authentication state for Google Single Sign-On</td>
                      <td className="p-3 font-semibold text-emerald-600">Essential</td>
                      <td className="p-3">Persistent (until sign-out)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[11px]">theme_preference</td>
                      <td className="p-3">WebToolOcean</td>
                      <td className="p-3">Remembers Dark / Light mode UI preference</td>
                      <td className="p-3 font-semibold text-blue-600">Functional</td>
                      <td className="p-3">1 Year</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[11px]">cookie_consent</td>
                      <td className="p-3">WebToolOcean</td>
                      <td className="p-3">Stores your cookie preferences & consent choices</td>
                      <td className="p-3 font-semibold text-emerald-600">Essential</td>
                      <td className="p-3">1 Year</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[11px]">__gads, __gpi, IDE</td>
                      <td className="p-3">Google AdSense / DoubleClick</td>
                      <td className="p-3">Provides ad serving, fraud prevention, and performance metrics</td>
                      <td className="p-3 font-semibold text-amber-600">Advertising</td>
                      <td className="p-3">13 Months</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">
                5. How to Control and Manage Cookies in Your Browser
              </h2>
              <p className="text-sm leading-relaxed mb-4">
                You can prevent the setting of cookies or delete existing cookies through your browser settings. Please note that disabling essential cookies may impact certain interactive features such as cloud document persistence.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-border bg-background hover:bg-muted transition-colors flex items-center justify-between"
                >
                  <span className="font-semibold text-foreground">Google Chrome</span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
                <a
                  href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-border bg-background hover:bg-muted transition-colors flex items-center justify-between"
                >
                  <span className="font-semibold text-foreground">Apple Safari</span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
                <a
                  href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-border bg-background hover:bg-muted transition-colors flex items-center justify-between"
                >
                  <span className="font-semibold text-foreground">Mozilla Firefox</span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
                <a
                  href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-border bg-background hover:bg-muted transition-colors flex items-center justify-between"
                >
                  <span className="font-semibold text-foreground">Microsoft Edge</span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">
                6. Updates to This Cookie Policy
              </h2>
              <p className="text-sm leading-relaxed">
                We may periodically update this Cookie Policy to reflect changes in our operational technologies or applicable privacy regulations. We encourage you to review this page occasionally. For any questions regarding our cookies or data handling, reach out at{" "}
                <a href="mailto:privacy@webtoolocean.com" className="text-brand font-semibold hover:underline">
                  privacy@webtoolocean.com
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
        badge="Cookie FAQs"
        title="Frequently Asked Cookie & Privacy Questions"
        subtitle="Transparent explanations regarding browser-only processing and advertising cookies."
        items={cookiesFaq}
      />

      {/* CONSISTENT CTA */}
      <ConsistentCtaSection
        title="Edit and Convert Your PDFs Securely"
        subtitle="100% private, in-browser PDF utilities. No hidden telemetry or document transmission."
        primaryCtaText="Launch PDF Studio"
        onPrimaryClick={handleTriggerUpload}
        secondaryCtaText="Explore All Tools"
        secondaryCtaLink="/tools"
      />

      <SaasFooter />
    </div>
  );
}
