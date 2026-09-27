import { useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FileCheck2, Scale, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { SaasHeader } from "@/components/saas/SaasHeader";
import { SaasFooter } from "@/components/saas/SaasFooter";
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
                By accessing or using the PDF Studio web application, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using the platform.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">2. Acceptable Use</h2>
              <p className="leading-relaxed">
                You agree to use PDF Studio only for lawful purposes. You must not use the service to process or distribute materials that infringe on copyright, contain malicious software, or violate any applicable municipal, state, or international laws.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">3. Document Ownership</h2>
              <p className="leading-relaxed">
                PDF Studio claims no ownership rights over any documents, images, text, or signatures you upload, edit, or create within the application. You retain full ownership and intellectual property rights at all times.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">4. Disclaimer of Warranties</h2>
              <p className="leading-relaxed">
                PDF Studio is provided on an "as is" and "as available" basis. While we strive to maintain high rendering fidelity and data reliability, we make no representations or warranties regarding uninterrupted availability or suitability for specific legal compliance mandates.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">5. Modifications</h2>
              <p className="leading-relaxed">
                We reserve the right to revise or update these terms at any time. Continued use of PDF Studio constitutes acceptance of the current terms.
              </p>
            </section>
          </div>
        </div>
      </main>

      <SaasFooter />
    </div>
  );
}
