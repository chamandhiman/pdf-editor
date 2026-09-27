import { useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ShieldCheck, Lock, EyeOff, Server, HardDrive, FileUp } from "lucide-react";
import { toast } from "sonner";

import { SaasHeader } from "@/components/saas/SaasHeader";
import { SaasFooter } from "@/components/saas/SaasFooter";
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
              <p className="leading-relaxed">
                When you use PDF Studio, your document binary data is loaded directly into your client browser's memory using standard Web APIs (such as FileReader, Uint8Array, and IndexedDB). By default in community mode, your PDF files are not permanently stored on our servers.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">2. Document Storage and Security</h2>
              <p className="leading-relaxed">
                PDF Studio uses local browser storage (IndexedDB) solely to provide uninterrupted editing continuity—allowing you to refresh your browser or resume an active session without losing page overlays, annotations, and drawn signatures.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">3. Cookies and Analytics</h2>
              <p className="leading-relaxed">
                We may collect aggregated, non-personally identifiable diagnostic metrics (such as browser type, error crash logs, and anonymized feature usage) to improve performance and stability across different devices. We do not use third-party invasive tracking pixels.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">4. Third-Party Services</h2>
              <p className="leading-relaxed">
                PDF Studio is self-contained. When you export or print your PDF, the rendering engine runs locally within your browser tab. No document content is sent to third-party AI training corpora.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-3">5. Contact Regarding Privacy</h2>
              <p className="leading-relaxed">
                If you have questions regarding this Privacy Policy or wish to request data deletion, please reach out via our contact page.
              </p>
            </section>
          </div>
        </div>
      </main>

      <SaasFooter />
    </div>
  );
}
