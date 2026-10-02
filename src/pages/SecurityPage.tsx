import { useRef } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Lock,
  HardDrive,
  EyeOff,
  ServerOff,
  KeyRound,
  FileCheck,
  Bug,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { SaasHeader } from "@/components/saas/SaasHeader";
import { SaasFooter } from "@/components/saas/SaasFooter";
import { ConsistentFaqSection } from "@/components/saas/ConsistentFaqSection";
import { ConsistentCtaSection } from "@/components/saas/ConsistentCtaSection";
import { securityFaq } from "@/lib/faq-data";
import { setUploadedPdf } from "@/lib/pdf-store";

export function SecurityPage() {
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
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-Knowledge Document Architecture</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
              Security Architecture & Data Integrity
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
              We engineered PDF Studio on a strict zero-knowledge security foundation. Your files are isolated and executed entirely within your browser's private memory sandbox.
            </p>
          </header>

          {/* Core Security Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="rounded-3xl border border-border bg-card p-8 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5">
                <ServerOff className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">Zero-Server Storage</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Documents are never transmitted, ingested, or stored on remote servers in standard editing mode. All file operations execute on your local CPU.
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-8 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-5">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">256-Bit AES Encryption</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Password protection uses native Web Crypto hardware-accelerated 256-bit AES encryption conforming strictly to ISO 32000 PDF standards.
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-8 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5">
                <HardDrive className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">Isolated Local Sandbox</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Drafts and signatures reside in your browser's private IndexedDB storage, protected by origin-isolated browser security boundaries.
              </p>
            </div>
          </div>

          {/* In-Depth Security Specifications */}
          <article className="space-y-8 text-muted-foreground text-sm">
            <section className="rounded-3xl border border-border bg-card p-8 sm:p-10">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-brand" />
                <span>1. The Client-Side Sandboxing Model</span>
              </h2>
              <div className="space-y-3 leading-relaxed">
                <p>
                  Most web-based PDF editors function as file relay proxies: you upload your document over HTTPS to a remote backend server, an automated headless worker parses the file, and you receive the edited file back. This introduces multiple points of exposure: transit interception risks, server disk storage persistence, and backend database vulnerabilities.
                </p>
                <p>
                  WebToolOcean PDF Studio completely eliminates this attack surface by executing PDF parsing, font subsetting, graphical rasterization, and vector manipulation <strong>locally inside your device's web browser</strong> via WebAssembly and Web Workers.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card p-8 sm:p-10">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-brand" />
                <span>2. Cryptographic Security & Password Protection</span>
              </h2>
              <div className="space-y-3 leading-relaxed">
                <p>
                  When you protect a PDF file using our <strong>Protect PDF</strong> tool:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Algorithm:</strong> Standard 256-bit AES (Advanced Encryption Standard) encryption in Galois/Counter Mode (GCM) or Cipher Block Chaining (CBC) with ISO 32000 standard compliance.
                  </li>
                  <li>
                    <strong>Key Derivation:</strong> Cryptographic keys are derived on-device using PBKDF2 with SHA-256 and high iteration counts to resist brute-force dictionary attacks.
                  </li>
                  <li>
                    <strong>Zero-Knowledge:</strong> We have no master keys, backdoor decryption utilities, or password escrow mechanisms. Passwords are never sent over the wire.
                  </li>
                </ul>
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card p-8 sm:p-10">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand" />
                <span>3. Transport & Transport Security (TLS 1.3)</span>
              </h2>
              <p className="leading-relaxed">
                All traffic between your web browser and WebToolOcean static delivery networks is encrypted in transit using modern TLS 1.3 and HTTP/2 protocols with Strict-Transport-Security (HSTS) headers enforced. We employ strict Content Security Policies (CSP) to mitigate cross-site scripting (XSS) and data exfiltration threats.
              </p>
            </section>

            <section className="rounded-3xl border border-border bg-card p-8 sm:p-10">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Bug className="w-5 h-5 text-brand" />
                <span>4. Vulnerability Reporting & Responsible Disclosure</span>
              </h2>
              <div className="space-y-3 leading-relaxed">
                <p>
                  Security is an ongoing commitment. If you are a security researcher or engineer and believe you have discovered a security vulnerability in WebToolOcean PDF Studio, we encourage responsible disclosure.
                </p>
                <p>
                  Please email your detailed technical findings to{" "}
                  <a href="mailto:security@webtoolocean.com" className="text-brand font-semibold hover:underline">
                    security@webtoolocean.com
                  </a>. We acknowledge all legitimate reports within 48 hours and work expeditiously to remediate verified vulnerabilities.
                </p>
              </div>
            </section>
          </article>
        </div>
      </main>

      {/* CONSISTENT FAQ */}
      <ConsistentFaqSection
        badge="Security FAQs"
        title="Security & Data Integrity Questions"
        subtitle="Detailed technical answers regarding client-side isolation and encryption."
        items={securityFaq}
      />

      {/* CONSISTENT CTA */}
      <ConsistentCtaSection
        title="Experience Private, Zero-Upload PDF Tools"
        subtitle="Your documents never leave your computer. High-speed, local processing at your fingertips."
        primaryCtaText="Launch PDF Studio"
        onPrimaryClick={handleTriggerUpload}
        secondaryCtaText="Explore All Tools"
        secondaryCtaLink="/tools"
      />

      <SaasFooter />
    </div>
  );
}
