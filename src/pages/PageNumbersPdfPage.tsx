import { useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Hash,
  FileUp,
  Download,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Zap,
  RefreshCw,
  Eye,
  FileText,
  Sliders,
  Layout,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SaasHeader } from "@/components/saas/SaasHeader";
import { SaasFooter } from "@/components/saas/SaasFooter";
import { HowItWorksSection } from "@/components/saas/HowItWorksSection";
import { WhyUseSection } from "@/components/saas/WhyUseSection";
import { ConsistentFaqSection } from "@/components/saas/ConsistentFaqSection";
import { ConsistentCtaSection } from "@/components/saas/ConsistentCtaSection";
import { ToolWorkspaceModal } from "@/components/saas/ToolWorkspaceModal";
import {
  addPageNumbersToPdf,
  getPdfPageCount,
  renderPageThumbnail,
  type PageNumberOptions,
} from "@/lib/pdf-operations";
import { setUploadedPdf } from "@/lib/pdf-store";
import { pageNumbersFaq } from "@/lib/faq-data";
import { type PdfTool } from "@/lib/pdf-tools-data";

const NUMBER_FORMATS = [
  { id: "page_n_of_total", label: "Page 1 of 10", format: "Page {n} of {total}" },
  { id: "n_slash_total", label: "1 / 10", format: "{n} / {total}" },
  { id: "page_n", label: "Page 1", format: "Page {n}" },
  { id: "n_only", label: "1", format: "{n}" },
];

const POSITIONS = [
  { id: "bottom-center", label: "Bottom Center" },
  { id: "bottom-right", label: "Bottom Right" },
  { id: "bottom-left", label: "Bottom Left" },
  { id: "top-center", label: "Top Center" },
  { id: "top-right", label: "Top Right" },
] as const;

export function PageNumbersPdfPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    buffer: ArrayBuffer;
    pageCount: number;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(NUMBER_FORMATS[0]!.format);
  const [selectedPosition, setSelectedPosition] = useState<PageNumberOptions["position"]>("bottom-center");
  const [startPage, setStartPage] = useState(1);
  const [fontSize, setFontSize] = useState(11);
  const [page1PreviewUrl, setPage1PreviewUrl] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [resultPdfBytes, setResultPdfBytes] = useState<Uint8Array | null>(null);
  const [activeToolModal, setActiveToolModal] = useState<PdfTool | null>(null);

  const handleProcessFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      toast.error("Please upload a valid PDF document.");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const count = await getPdfPageCount(buffer);

      if (count === 0) {
        toast.error("This PDF document contains no pages.");
        return;
      }

      setSelectedFile({
        file,
        buffer,
        pageCount: count,
      });
      setResultPdfBytes(null);

      try {
        const url = await renderPageThumbnail(buffer, 1, 320);
        setPage1PreviewUrl(url);
      } catch (e) {
        console.warn("Thumbnail render failed:", e);
      }

      toast.success(`Loaded ${file.name} (${count} ${count === 1 ? "page" : "pages"})`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to parse PDF document.");
    }
  };

  const handleApplyNumbers = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const bytes = await addPageNumbersToPdf(selectedFile.buffer, {
        format: selectedFormat,
        position: selectedPosition || "bottom-center",
        fontSize,
        startPage,
      });
      setResultPdfBytes(bytes);
      toast.success("Page numbers added to all pages!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to add page numbers.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultPdfBytes || !selectedFile) return;
    const blob = new Blob([resultPdfBytes as any], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const base = selectedFile.file.name.replace(/\.pdf$/i, "");
    a.href = url;
    a.download = `${base}_numbered.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Numbered PDF downloaded successfully!");
  };

  const handleOpenInEditor = () => {
    if (!resultPdfBytes || !selectedFile) return;
    const fileName = `${selectedFile.file.name.replace(/\.pdf$/i, "")}_numbered.pdf`;
    setUploadedPdf(resultPdfBytes.buffer as ArrayBuffer, fileName);
    navigate({
      to: "/editor",
      search: { file: fileName },
    });
  };

  const getPreviewText = () => {
    return selectedFormat
      .replace("{n}", String(startPage))
      .replace("{total}", String(selectedFile ? selectedFile.pageCount + startPage - 1 : 10));
  };

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-brand/10 selection:text-brand">
      <SaasHeader onSelectTool={setActiveToolModal} />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-brand-soft/20 via-background to-background py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-soft border border-brand/20 text-brand text-xs font-semibold uppercase tracking-wider mb-5">
            <Hash className="w-3.5 h-3.5" />
            <span>Document Pagination</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto">
            Add Page Numbers <span className="text-brand">to PDF</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Insert headers and footer numbering across your PDF document. 
            Choose position, typography, and numbering style with instant client-side execution.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              100% Client-Side Private
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand" />
              Customizable Positions & Formats
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              Zero Upload Delays
            </span>
          </div>
        </div>
      </section>

      {/* MAIN WORKSPACE */}
      <section className="flex-1 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {!selectedFile ? (
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleProcessFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 max-w-2xl mx-auto ${
              isDragging
                ? "border-brand bg-brand-soft/30 scale-[1.01]"
                : "border-border hover:border-brand/50 hover:bg-muted/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleProcessFile(file);
              }}
            />

            <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-4">
              <Hash className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-foreground mb-2">
              Select or Drop PDF File
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Drop your PDF here to configure and insert page numbers
            </p>

            <Button
              type="button"
              className="bg-brand text-brand-foreground hover:bg-brand/90 px-6 py-2.5 rounded-xl font-semibold shadow-md"
            >
              Choose PDF Document
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* CONFIGURATION COLUMN */}
            <div className="lg:col-span-7 bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Pagination Settings
                  </h3>
                  <p className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-md">
                    {selectedFile.file.name} ({selectedFile.pageCount} pages)
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setResultPdfBytes(null);
                  }}
                  className="text-xs rounded-xl"
                >
                  Change File
                </Button>
              </div>

              {/* NUMBERING FORMAT */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  Numbering Format
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {NUMBER_FORMATS.map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => {
                        setSelectedFormat(fmt.format);
                        setResultPdfBytes(null);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedFormat === fmt.format
                          ? "border-brand bg-brand-soft text-brand font-bold shadow-xs"
                          : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <span className="text-sm block">{fmt.label}</span>
                      <span className="text-[10px] opacity-75">{fmt.format}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* POSITION SELECTION */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  Page Number Position
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {POSITIONS.map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => {
                        setSelectedPosition(pos.id);
                        setResultPdfBytes(null);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        selectedPosition === pos.id
                          ? "border-brand bg-brand-soft text-brand font-bold shadow-xs"
                          : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <span className="text-xs block">{pos.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* START PAGE & FONT SIZE */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                    Start From Page
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={startPage}
                    onChange={(e) => {
                      setStartPage(Math.max(1, parseInt(e.target.value) || 1));
                      setResultPdfBytes(null);
                    }}
                    className="rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                    Font Size ({fontSize}pt)
                  </label>
                  <Input
                    type="number"
                    min={8}
                    max={20}
                    value={fontSize}
                    onChange={(e) => {
                      setFontSize(Math.max(8, Math.min(24, parseInt(e.target.value) || 11)));
                      setResultPdfBytes(null);
                    }}
                    className="rounded-xl font-medium"
                  />
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-4 border-t border-border/60 flex flex-wrap items-center gap-3">
                {!resultPdfBytes ? (
                  <Button
                    type="button"
                    onClick={handleApplyNumbers}
                    disabled={isProcessing}
                    className="bg-brand text-brand-foreground hover:bg-brand/90 px-6 py-2.5 rounded-xl font-bold shadow-md gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Adding Page Numbers...
                      </>
                    ) : (
                      <>
                        <Hash className="w-4 h-4" />
                        Add Numbers to All Pages
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      onClick={handleDownload}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Numbered PDF
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleOpenInEditor}
                      className="rounded-xl gap-2 font-semibold"
                    >
                      <Eye className="w-4 h-4 text-brand" />
                      Open in PDF Editor
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* PREVIEW COLUMN */}
            <div className="lg:col-span-5 bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground self-start mb-4">
                Placement Visualizer (Page 1)
              </span>

              <div className="w-full max-w-sm aspect-[3/4] bg-white rounded-2xl border border-border/80 shadow-md relative overflow-hidden flex items-center justify-center p-4">
                {page1PreviewUrl ? (
                  <img
                    src={page1PreviewUrl}
                    alt="Page 1 Preview"
                    className="max-h-full max-w-full object-contain pointer-events-none opacity-85 select-none"
                  />
                ) : (
                  <div className="text-muted-foreground text-xs flex flex-col items-center gap-2">
                    <FileText className="w-8 h-8 text-brand" />
                    <span>Loading Document Page...</span>
                  </div>
                )}

                {/* NUMBER PLACEMENT PREVIEW */}
                <div
                  className={`absolute pointer-events-none select-none text-neutral-800 font-medium px-2 py-0.5 rounded bg-brand-soft/80 border border-brand/30 shadow-xs text-xs ${
                    selectedPosition === "bottom-center"
                      ? "bottom-4 left-1/2 -translate-x-1/2"
                      : selectedPosition === "bottom-right"
                      ? "bottom-4 right-4"
                      : selectedPosition === "bottom-left"
                      ? "bottom-4 left-4"
                      : selectedPosition === "top-right"
                      ? "top-4 right-4"
                      : "top-4 left-1/2 -translate-x-1/2"
                  }`}
                >
                  {getPreviewText()}
                </div>
              </div>

              <p className="mt-4 text-xs text-muted-foreground text-center">
                Page numbers will be stamped across all {selectedFile.pageCount} pages upon export.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <HowItWorksSection
        title="How to Add Page Numbers to PDF"
        subtitle="Number your document pages seamlessly in three quick steps."
        steps={[
          {
            step: "01",
            title: "Upload Your PDF",
            description: "Drag and drop any PDF file. Processing happens locally in your browser memory.",
            badgeText: "Private & Safe",
            badgeIcon: FileUp,
            colorClass: "icon-edit",
          },
          {
            step: "02",
            title: "Configure Style & Position",
            description: "Pick header or footer alignment, font sizing, and preferred numbering formats.",
            badgeText: "Flexible Format",
            badgeIcon: Layout,
            colorClass: "icon-convert",
          },
          {
            step: "03",
            title: "Download Numbered File",
            description: "Export your perfectly paginated PDF file instantly with zero degradation.",
            badgeText: "Instant Ready",
            badgeIcon: Download,
            colorClass: "icon-organize",
          },
        ]}
      />

      {/* WHY USE */}
      <WhyUseSection
        title="Why Choose PDF Studio for Numbering"
        subtitle="Clean typography, professional styling, and zero server uploads."
        benefits={[
          {
            icon: ShieldCheck,
            title: "100% Client-Side Privacy",
            description: "Files are numbered in your browser RAM without leaving your computer.",
            colorClass: "icon-security",
          },
          {
            icon: Zap,
            title: "Lossless Geometry",
            description: "Standard Helvetica font embeds preserve vector layouts and existing document content.",
            colorClass: "icon-compress",
          },
          {
            icon: Sliders,
            title: "Flexible Positioning",
            description: "Place numbers at Bottom Center, Bottom Right, or Header positions with custom margins.",
            colorClass: "icon-edit",
          },
          {
            icon: CheckCircle2,
            title: "Print & Binder Ready",
            description: "Prepares legal exhibits, theses, and business reports for binding and archiving.",
            colorClass: "icon-organize",
          },
        ]}
      />

      {/* FAQS */}
      <ConsistentFaqSection
        title="Frequently Asked Questions About Page Numbers"
        subtitle="Learn more about pagination formats, margins, and document formatting."
        items={pageNumbersFaq}
      />

      {/* CTA */}
      <ConsistentCtaSection
        title="Need to Do More with Your Documents?"
        subtitle="Rotate pages, merge files, protect with passwords, or convert formats online."
        primaryCtaText="Explore All Tools"
        primaryCtaLink="/tools"
        secondaryCtaText="Open Full PDF Editor"
        secondaryCtaLink="/editor"
      />

      <SaasFooter onSelectTool={setActiveToolModal} />

      {activeToolModal && (
        <ToolWorkspaceModal
          tool={activeToolModal}
          isOpen={!!activeToolModal}
          onClose={() => setActiveToolModal(null)}
        />
      )}
    </div>
  );
}
