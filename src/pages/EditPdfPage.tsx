import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  FilePenLine,
  FileUp,
  Download,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Zap,
  ArrowRight,
  ExternalLink,
  Layers,
  Lock,
  Eye,
  Type,
  Signature,
  PenTool,
  Highlighter,
  Shapes,
  RotateCw,
  FolderOpen,
  PlusCircle,
  Clock,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { SaasHeader } from "@/components/saas/SaasHeader";
import { SaasFooter } from "@/components/saas/SaasFooter";
import { HowItWorksSection } from "@/components/saas/HowItWorksSection";
import { WhyUseSection } from "@/components/saas/WhyUseSection";
import { ConsistentFaqSection } from "@/components/saas/ConsistentFaqSection";
import { ConsistentCtaSection } from "@/components/saas/ConsistentCtaSection";
import { ToolWorkspaceModal } from "@/components/saas/ToolWorkspaceModal";
import { setUploadedPdf } from "@/lib/pdf-store";
import { createBlankPdfDocument } from "@/lib/pdf-create";
import { editPdfFaq } from "@/lib/faq-data";
import { type PdfTool } from "@/lib/pdf-tools-data";

export function EditPdfPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const dragCounter = useRef(0);
  const [loading, setLoading] = useState(false);
  const [activeToolModal, setActiveToolModal] = useState<PdfTool | null>(null);

  // Global window drag detection
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current += 1;
      if (e.dataTransfer && e.dataTransfer.types.includes("Files")) {
        setIsWindowDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setIsWindowDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsWindowDragging(false);
      setIsDragging(false);
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  const handleProcessFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        toast.error("Please select a valid PDF file.");
        return;
      }

      setLoading(true);
      const toastId = toast.loading("Opening document in PDF Editor...");
      try {
        const buffer = await file.arrayBuffer();
        setUploadedPdf(buffer, file.name);
        toast.dismiss(toastId);
        toast.success("Ready for editing!");
        navigate({
          to: "/editor",
          search: { file: file.name },
        });
      } catch (err) {
        console.error("Failed to load PDF:", err);
        toast.dismiss(toastId);
        toast.error("Failed to open the PDF. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [navigate],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setIsWindowDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleProcessFile(files[0]!);
      }
    },
    [handleProcessFile],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]!);
    }
    e.target.value = "";
  };

  const handleCreateBlank = async () => {
    setLoading(true);
    const toastId = toast.loading("Creating blank PDF canvas...");
    try {
      const blank = await createBlankPdfDocument("Untitled.pdf");
      setUploadedPdf(blank.bytes, blank.fileName);
      toast.dismiss(toastId);
      toast.success("Blank document created!");
      navigate({
        to: "/editor",
        search: { file: blank.fileName },
      });
    } catch (err) {
      console.error("Failed to create blank document:", err);
      toast.dismiss(toastId);
      toast.error("Could not create blank document.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary/20">
      <SaasHeader onToolSelect={(tool) => setActiveToolModal(tool)} />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <main className="flex-1">
        {/* ──────────────── FULL-WIDTH TOOL ZONE ──────────────── */}
        <section className="relative border-b border-border/30 pdf-hero-bg overflow-hidden py-6 md:py-10">
          {/* Continuous floating background icons (customized for Edit PDF) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            {/* Giant FilePenLine slow float */}
            <div className="absolute top-1/2 right-[6%] -translate-y-1/2 opacity-[0.06] animate-float">
              <FilePenLine className="w-64 h-64 text-brand" strokeWidth={0.6} />
            </div>
            {/* Type top-left */}
            <div className="absolute -top-4 left-[5%] opacity-[0.05] animate-float-1">
              <Type className="w-52 h-52 text-brand" strokeWidth={0.7} />
            </div>
            {/* Signature bottom-right */}
            <div className="absolute bottom-4 right-[26%] opacity-[0.04] animate-float-2">
              <Signature className="w-36 h-36 text-brand-accent" strokeWidth={0.8} />
            </div>
            {/* Shapes top-right */}
            <div className="absolute top-8 right-[24%] opacity-[0.04] animate-float-1">
              <Shapes className="w-24 h-24 text-brand-accent" strokeWidth={1} />
            </div>
            {/* FileText bottom-left */}
            <div className="absolute bottom-2 left-[18%] opacity-[0.04] animate-float-2">
              <FileText className="w-32 h-32 text-brand" strokeWidth={0.7} />
            </div>
          </div>

          {/* Ambient radial glow overlays */}
          <div
            className="absolute inset-0 pointer-events-none -z-10"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 70% 60% at 50% 0%, oklch(0.72 0.175 65 / 0.08) 0%, transparent 65%), radial-gradient(circle at 85% 60%, oklch(0.55 0.24 22 / 0.06) 0%, transparent 45%)",
            }}
          />

          <div className="container max-w-5xl mx-auto px-4 relative z-10">
            <div className="flex flex-col items-center justify-center text-center">
              {/* Page title ABOVE the box */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-2 leading-tight gradient-brand">
                Edit PDF
              </h1>
              <p className="max-w-md mx-auto text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed">
                Add text, insert signatures, draw shapes, and edit documents in your browser.
              </p>

              {/* ── Dropzone card matching Compress PDF ── */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative cursor-pointer w-full max-w-2xl mx-auto
                  rounded-3xl px-8 py-8 md:px-10 md:py-10 flex flex-col items-center
                  transition-all duration-300 group
                  ${
                    isDragging || isWindowDragging
                      ? "border-2 border-primary drag-pattern-active scale-[1.01] shadow-[0_0_60px_oklch(0.55_0.24_22/0.18)]"
                      : "border-2 border-dashed border-primary/50 hover:border-primary/80 hover:shadow-[0_0_50px_oklch(0.55_0.24_22/0.14)] bg-white/70 dark:bg-card/70 backdrop-blur-md shadow-sm"
                  }
                `}
              >
                {/* Corner accent blobs inside box */}
                <div className="absolute top-0 left-0 w-20 h-20 rounded-tl-3xl overflow-hidden pointer-events-none">
                  <div className="absolute -top-5 -left-5 w-24 h-24 bg-gradient-to-br from-brand/15 to-transparent rounded-full" />
                </div>
                <div className="absolute bottom-0 right-0 w-20 h-20 rounded-br-3xl overflow-hidden pointer-events-none">
                  <div className="absolute -bottom-5 -right-5 w-24 h-24 bg-gradient-to-tl from-brand-accent/15 to-transparent rounded-full" />
                </div>

                {/* Animated icon */}
                <div
                  className={`
                  relative w-24 h-24 rounded-3xl flex items-center justify-center mb-6
                  transition-all duration-500 shadow-xl
                  ${
                    isDragging || isWindowDragging
                      ? "icon-edit scale-110 rotate-6"
                      : "icon-edit group-hover:scale-110 group-hover:-rotate-3"
                  }
                `}
                >
                  <FilePenLine className="w-12 h-12 text-white drop-shadow-lg" />
                  <span className="absolute inset-0 rounded-3xl border-2 border-white/25 animate-ping opacity-50" />
                </div>

                {/* Heading inside box */}
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1.5">
                  Drop your PDF here
                </h2>

                <p className="text-sm md:text-base text-muted-foreground">
                  or click anywhere to browse files
                </p>

                {/* OR divider */}
                <div className="mt-6 flex items-center justify-center gap-3 w-36">
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
                  <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
                    or
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
                </div>

                {/* Large CTA button */}
                <Button
                  size="lg"
                  className="mt-5 rounded-[4px] px-14 h-14 text-base font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all pointer-events-none animate-pulse-glow"
                >
                  <FileUp className="w-5 h-5 mr-2" />
                  Choose PDF File
                </Button>
              </div>

              {/* Blank document option below box */}
              <div className="mt-6 flex items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground">Don&apos;t have a PDF yet?</span>
                <button
                  type="button"
                  onClick={handleCreateBlank}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline cursor-pointer"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Create a Blank PDF
                </button>
              </div>

              {/* Privacy pill */}
              <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-full px-4 py-1.5 border border-border/60">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Files never leave your device · Processed 100% locally in your browser</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="py-16 md:py-24 bg-card/40 border-b border-border/40">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Everything You Need to Edit PDFs
              </h2>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground">
                All the advanced capabilities of desktop editors, delivered right in your web browser with zero lag.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-brand/40 hover:shadow-md transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand mb-4">
                  <Type className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">Edit PDF Text & Headings</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Click any existing text to modify typos, update addresses, or replace paragraphs. Customize font styles, sizes, line heights, and colors.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-brand/40 hover:shadow-md transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  <Signature className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">Sign PDF Documents</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Sign contracts and forms electronically. Draw your signature by hand, type with beautiful handwriting calligraphy, or upload a signature image.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-brand/40 hover:shadow-md transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4">
                  <Shapes className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">Shapes & Freehand Drawings</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Insert rectangles, circles, lines, callout arrows, and freehand pencil sketches. Customize stroke weights, fill opacities, and border styles.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-brand/40 hover:shadow-md transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4">
                  <Highlighter className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">Annotate, Highlight & Notes</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Highlight key passages with translucent marker tints, add strikethrough or underline, and place sticky notes with comments anywhere on pages.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-brand/40 hover:shadow-md transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-4">
                  <RotateCw className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">Organize, Rotate & Delete</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Manage all document pages with the visual sidebar. Reorder pages with drag and drop, rotate pages 90° or 180°, duplicate, or delete extra pages.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-brand/40 hover:shadow-md transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-4">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">100% Client-Side Privacy</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Your confidential documents never upload to remote servers. All vector rendering, text modifications, and exports occur locally in browser memory.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <HowItWorksSection
          badge="Simple 3-Step Process"
          title="How to Edit PDF Documents Online"
          subtitle="Add text, signatures, and edits to your documents in seconds with zero learning curve."
          steps={[
            {
              step: "01",
              title: "Select or Drop PDF",
              description: "Upload your document or start with a clean blank canvas. Your file loads instantly in your browser.",
              badgeText: "Instant browser loading",
              badgeIcon: FileUp,
              colorClass: "icon-edit",
            },
            {
              step: "02",
              title: "Edit, Annotate & Sign",
              description: "Modify text, add shapes, draw, insert signatures, highlight sections, and reorganize or rotate pages.",
              badgeText: "Full creative control",
              badgeIcon: PenTool,
              colorClass: "icon-organize",
            },
            {
              step: "03",
              title: "Download Vector PDF",
              description: "Export your modified document with crisp vector resolution and zero watermarks in seconds.",
              badgeText: "High-resolution output",
              badgeIcon: Download,
              colorClass: "icon-convert",
            },
          ]}
        />

        {/* Why Use Section */}
        <WhyUseSection
          badge="High-Performance PDF Editing"
          title="Why Edit PDFs with WebToolOcean"
          subtitle="Engineered for professionals, students, and businesses who need powerful document editing without privacy compromises."
          benefits={[
            {
              icon: ShieldCheck,
              title: "100% In-Browser Privacy",
              description: "Your confidential files never leave your device. All editing runs locally in your browser's private memory.",
              colorClass: "icon-security",
            },
            {
              icon: Type,
              title: "Direct In-Place Text Editing",
              description: "Modify existing typos and words seamlessly with auto-detected fonts and styles.",
              colorClass: "icon-edit",
            },
            {
              icon: Signature,
              title: "Electronic Signatures",
              description: "Sign contracts and approvals by drawing, typing with handwriting fonts, or uploading signature images.",
              colorClass: "icon-organize",
            },
            {
              icon: Zap,
              title: "Zero Waiting or Upload Queues",
              description: "Because editing executes client-side, documents open and save in fractions of a second.",
              colorClass: "icon-compress",
            },
            {
              icon: Layers,
              title: "Page Management & Rotation",
              description: "Reorder pages with drag and drop, rotate 90° or 180°, duplicate, or delete pages easily.",
              colorClass: "icon-convert",
            },
            {
              icon: CheckCircle2,
              title: "No Subscriptions or Watermarks",
              description: "Edit unlimited documents with zero added watermarks, zero page caps, and no mandatory account sign-up.",
              colorClass: "icon-ocr",
            },
          ]}
        />

        {/* FAQ Section */}
        <ConsistentFaqSection
          badge="Editor FAQs"
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about modifying, signing, and annotating PDF files in PDF Studio."
          items={editPdfFaq}
        />

        {/* Consistent CTA */}
        <ConsistentCtaSection
          title="Ready to edit your PDF document?"
          subtitle="Start editing right now with no account, no software download, and zero payment."
          primaryCtaText="Open PDF in Editor"
          onPrimaryClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            fileInputRef.current?.click();
          }}
          secondaryCtaText="Explore All PDF Tools"
          secondaryCtaLink="/tools"
        />
      </main>

      <SaasFooter onSelectTool={(tool) => setActiveToolModal(tool)} />

      <ToolWorkspaceModal
        tool={activeToolModal}
        open={Boolean(activeToolModal)}
        onOpenChange={(open) => {
          if (!open) setActiveToolModal(null);
        }}
      />
    </div>
  );
}
