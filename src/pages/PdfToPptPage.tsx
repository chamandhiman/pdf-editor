import { useState, useRef, useCallback, useEffect } from "react";
import {
  Presentation,
  FileUp,
  Download,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Layers,
  Image as ImageIcon,
  FileCheck,
  Monitor,
  PenLine,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";

import { Button } from "@/components/ui/button";
import { SaasHeader } from "@/components/saas/SaasHeader";
import { SaasFooter } from "@/components/saas/SaasFooter";
import { HowItWorksSection } from "@/components/saas/HowItWorksSection";
import { WhyUseSection } from "@/components/saas/WhyUseSection";
import { ConsistentFaqSection } from "@/components/saas/ConsistentFaqSection";
import { ConsistentCtaSection } from "@/components/saas/ConsistentCtaSection";
import { ToolWorkspaceModal } from "@/components/saas/ToolWorkspaceModal";
import { convertPdfToPptx, type PdfPptxConversionResult } from "@/lib/pdf-to-pptx";
import { loadPdfDocument } from "@/lib/pdf-loader";
import { renderAllDocumentThumbnails } from "@/lib/pdf-operations";
import { pdfToPptFaq } from "@/lib/faq-data";
import { type PdfTool } from "@/lib/pdf-tools-data";

export function PdfToPptPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    buffer: ArrayBuffer;
    pageCount: number;
  } | null>(null);

  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const dragCounter = useRef(0);

  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<{ current: number; total: number } | null>(null);
  const [conversionResult, setConversionResult] = useState<PdfPptxConversionResult | null>(null);
  const [activeToolModal, setActiveToolModal] = useState<PdfTool | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleProcessFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      toast.error("Please select a valid PDF file.");
      return;
    }
    const toastId = toast.loading(`Inspecting ${file.name}...`);
    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await loadPdfDocument(buffer.slice(0));
      setSelectedFile({ file, buffer, pageCount: pdfDoc.numPages });
      setConversionResult(null);
      setThumbnails({});
      toast.success(`${file.name} ready — ${pdfDoc.numPages} page(s) detected.`, { id: toastId });
      renderAllDocumentThumbnails(buffer, (pageNum, url) => {
        setThumbnails((prev) => ({ ...prev, [pageNum]: url }));
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load PDF file.", { id: toastId });
    }
  }, []);

  useEffect(() => {
    const onEnter = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types?.includes("Files")) { dragCounter.current += 1; setIsWindowDragging(true); }
    };
    const onLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) { dragCounter.current = 0; setIsWindowDragging(false); }
    };
    const onOver = (e: DragEvent) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"; };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0; setIsWindowDragging(false); setIsDragging(false);
      if (e.dataTransfer?.files?.[0]) handleProcessFile(e.dataTransfer.files[0]);
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [handleProcessFile]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.[0]) handleProcessFile(e.dataTransfer.files[0]);
  };

  const handleConvert = async () => {
    if (!selectedFile) return;
    setIsConverting(true);
    const toastId = toast.loading("Converting PDF to PowerPoint — rendering slides...");
    try {
      const result = await convertPdfToPptx(selectedFile.buffer, (current, total) => {
        setConversionProgress({ current, total });
      });
      setConversionResult(result);
      toast.success(`Converted ${result.totalSlides} slide(s) to PowerPoint!`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to convert PDF to PowerPoint.", { id: toastId });
    } finally {
      setIsConverting(false);
      setConversionProgress(null);
    }
  };

  const handleDownload = () => {
    if (!conversionResult || !selectedFile) return;
    const url = URL.createObjectURL(conversionResult.pptxBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selectedFile.file.name.replace(/\.pdf$/i, "") + ".pptx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("PowerPoint (.pptx) downloaded!");
  };

  const handleDownloadImagesZip = async () => {
    if (!conversionResult || !selectedFile) return;
    const toastId = toast.loading("Packaging slide images into ZIP...");
    try {
      const zip = new JSZip();
      const folder = zip.folder("slides")!;
      for (const slide of conversionResult.slides) {
        const base64 = slide.imageDataUrl.split(",")[1] ?? "";
        folder.file(`slide_${String(slide.pageNumber).padStart(3, "0")}.png`, base64, { base64: true });
      }
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = selectedFile.file.name.replace(/\.pdf$/i, "") + "_slides.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Slide images ZIP downloaded!", { id: toastId });
    } catch {
      toast.error("Failed to package slide images.", { id: toastId });
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setConversionResult(null);
    setThumbnails({});
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-brand selection:text-white">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        id="ppt-pdf-upload"
        onChange={(e) => { if (e.target.files?.[0]) handleProcessFile(e.target.files[0]); }}
      />

      <SaasHeader onToolSelect={setActiveToolModal} />

      {/* ── Hero / Upload ─────────────────────────────────────────── */}
      <section className="relative border-b border-border/30 pdf-hero-bg overflow-hidden">
        {/* Animated Background Icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 right-[8%] -translate-y-1/2 opacity-[0.07] animate-float">
            <Presentation className="w-64 h-64 text-brand" strokeWidth={0.6} />
          </div>
          <div className="absolute -top-6 left-[5%] opacity-[0.05] animate-float-1">
            <Layers className="w-48 h-48 text-brand" strokeWidth={0.7} />
          </div>
          <div className="absolute bottom-0 right-[30%] opacity-[0.04] animate-float-2">
            <Monitor className="w-36 h-36 text-brand" strokeWidth={0.8} />
          </div>
        </div>

        <div className="container max-w-6xl mx-auto px-4 relative z-10 py-6 md:py-8">
          {/* Header Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 leading-tight gradient-brand">
              PDF to PowerPoint Converter
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Convert every PDF page into a perfectly rendered PPTX slide — images, text, design &amp; all.
              No plain-text-only extraction. Full visual accuracy at 2.5× resolution.
            </p>
          </div>

          {/* STATE 1: Empty Dropzone */}
          {!selectedFile && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative cursor-pointer w-full max-w-2xl mx-auto
                rounded-3xl px-10 py-10 flex flex-col items-center
                transition-all duration-300 group
                ${isDragging
                  ? "border-2 border-primary drag-pattern-active scale-[1.01] shadow-[0_0_60px_oklch(0.55_0.24_22/0.18)]"
                  : "border-2 border-dashed border-primary/50 hover:border-primary/80 hover:shadow-[0_0_50px_oklch(0.55_0.24_22/0.14)] bg-white/70 dark:bg-card/70 backdrop-blur-md shadow-sm"
                }
              `}
            >
              {/* Animated icon */}
              <div className={`
                relative w-24 h-24 rounded-3xl flex items-center justify-center mb-6
                transition-all duration-500 shadow-xl
                ${isDragging ? "icon-ppt scale-110 rotate-6" : "icon-ppt group-hover:scale-110 group-hover:-rotate-3"}
              `}>
                <Presentation className="w-12 h-12 text-white drop-shadow-lg" />
                <span className="absolute inset-0 rounded-3xl border-2 border-white/25 animate-ping opacity-50" />
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1.5">
                Drop your PDF here
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mb-6">
                or click anywhere to browse your files
              </p>

              <Button
                size="lg"
                className="rounded px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-brand hover:bg-brand-hover text-white pointer-events-none"
                style={{ borderRadius: "4px" }}
                tabIndex={-1}
                id="ppt-browse-btn"
              >
                <FileUp className="w-5 h-5 mr-2" />
                Choose PDF File
              </Button>

              <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-brand" /> 100% Private</span>
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-brand" /> No Upload Needed</span>
                <span className="flex items-center gap-1.5"><FileCheck className="w-3.5 h-3.5 text-brand" /> Full Visual Fidelity</span>
              </div>
            </div>
          )}

          {/* STATE 2: File selected */}
          {selectedFile && (
            <div className="w-full max-w-2xl mx-auto bg-card border border-border rounded-3xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl icon-ppt flex items-center justify-center shadow-lg">
                    <Presentation className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground truncate max-w-xs">{selectedFile.file.name}</p>
                    <p className="text-muted-foreground text-sm">{formatFileSize(selectedFile.file.size)} · {selectedFile.pageCount} page(s)</p>
                  </div>
                </div>
                <button onClick={handleReset} className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {Object.keys(thumbnails).length > 0 && (
                <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
                  {Object.entries(thumbnails).slice(0, 8).map(([pg, url]) => (
                    <img key={pg} src={url} alt={`Page ${pg}`} className="h-20 w-auto rounded-lg border border-border flex-shrink-0 object-cover shadow" />
                  ))}
                  {selectedFile.pageCount > 8 && (
                    <div className="h-20 w-14 rounded-lg border border-border flex items-center justify-center text-muted-foreground text-xs flex-shrink-0 bg-muted">
                      +{selectedFile.pageCount - 8}
                    </div>
                  )}
                </div>
              )}

              {!conversionResult && (
                <Button
                  onClick={handleConvert}
                  disabled={isConverting}
                  className="w-full bg-brand hover:bg-brand-hover text-white font-semibold py-3 rounded-xl gap-2"
                  style={{ borderRadius: "4px" }}
                  id="ppt-convert-btn"
                >
                  {isConverting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {conversionProgress
                        ? `Rendering slide ${conversionProgress.current} of ${conversionProgress.total}...`
                        : "Initializing..."}
                    </>
                  ) : (
                    <>
                      <Presentation className="w-4 h-4" />
                      Convert to PowerPoint
                    </>
                  )}
                </Button>
              )}

              {isConverting && conversionProgress && (
                <div className="mt-3">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-500"
                      style={{ width: `${(conversionProgress.current / conversionProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-muted-foreground text-xs mt-1.5 text-center">
                    {Math.round((conversionProgress.current / conversionProgress.total) * 100)}% — {conversionProgress.current}/{conversionProgress.total} slides
                  </p>
                </div>
              )}

              {conversionResult && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-green-800 dark:text-green-200 font-medium">
                      {conversionResult.totalSlides} slide(s) converted successfully!
                    </span>
                  </div>

                  {conversionResult.slides.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {conversionResult.slides.slice(0, 6).map((slide) => (
                        <div key={slide.pageNumber} className="flex-shrink-0 relative">
                          <img
                            src={slide.imageDataUrl}
                            alt={`Slide ${slide.pageNumber}`}
                            className="h-20 w-auto rounded-lg border border-border object-cover shadow-lg"
                          />
                          <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md font-mono">
                            {slide.pageNumber}
                          </span>
                        </div>
                      ))}
                      {conversionResult.totalSlides > 6 && (
                        <div className="h-20 w-14 rounded-lg border border-border flex items-center justify-center text-muted-foreground text-xs flex-shrink-0 bg-muted">
                          +{conversionResult.totalSlides - 6}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleDownload}
                      className="w-full bg-brand hover:bg-brand-hover text-white font-semibold gap-2"
                      style={{ borderRadius: "4px" }}
                      id="ppt-download-pptx-btn"
                    >
                      <Download className="w-4 h-4" /> Download .pptx
                    </Button>
                    <Button
                      onClick={handleDownloadImagesZip}
                      variant="outline"
                      className="w-full font-semibold gap-2"
                      style={{ borderRadius: "4px" }}
                      id="ppt-download-zip-btn"
                    >
                      <Package className="w-4 h-4" /> Slide PNGs (.zip)
                    </Button>
                  </div>
                  <Button
                    onClick={handleReset}
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-foreground gap-2"
                    id="ppt-reset-btn"
                  >
                    <RefreshCw className="w-4 h-4" /> Convert another PDF
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Trust badges ─────────────────────────────────────────── */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            {[
              { icon: ShieldCheck, label: "100% Private — No Uploads" },
              { icon: Zap, label: "Instant In-Browser Processing" },
              { icon: FileCheck, label: "Full Visual Fidelity" },
              { icon: Layers, label: "Multi-Page PDF Support" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-brand" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HowItWorksSection
        title="How PDF to PowerPoint Works"
        steps={[
          {
            step: "01",
            title: "Upload Your PDF",
            description: "Drop your PDF file or click to browse. Any PDF — presentations, reports, brochures.",
            badgeText: "Any PDF accepted",
            badgeIcon: FileUp,
            colorClass: "icon-edit",
          },
          {
            step: "02",
            title: "Render to Slides",
            description: "Our engine renders each page at 2.5× resolution and packages them as real PPTX slides.",
            badgeText: "2.5× high-res rendering",
            badgeIcon: Monitor,
            colorClass: "icon-convert",
          },
          {
            step: "03",
            title: "Download & Present",
            description: "Download the .pptx file and open directly in Microsoft PowerPoint, Google Slides, or Keynote.",
            badgeText: "Valid PPTX output",
            badgeIcon: Download,
            colorClass: "icon-organize",
          },
        ]}
      />

      <WhyUseSection
        title="Why Use Our PDF to PowerPoint Converter?"
        subtitle="Full visual fidelity — not just plain text extraction"
        benefits={[
          { icon: ImageIcon, title: "Full Visual Fidelity", description: "Every image, graphic, chart, and design element is rendered at 2.5× resolution — not plain text extraction.", colorClass: "icon-edit" },
          { icon: PenLine, title: "Searchable Text Layer", description: "Invisible text boxes are overlaid on each slide so you can still search and copy content in PowerPoint.", colorClass: "icon-convert" },
          { icon: Monitor, title: "Per-Page Slide Sizing", description: "Each slide inherits the exact dimensions of its PDF page — no cropping, stretching, or white bars.", colorClass: "icon-organize" },
          { icon: ShieldCheck, title: "100% Private Processing", description: "All conversion runs locally in your browser. Your files never leave your device.", colorClass: "icon-security" },
          { icon: Zap, title: "Fast Multi-Page Conversion", description: "Large PDF decks are processed page-by-page with live progress so you always know the status.", colorClass: "icon-compress" },
          { icon: Package, title: "PPTX or ZIP Download", description: "Get a fully valid .pptx file for PowerPoint, or export slide PNGs as a ZIP archive.", colorClass: "icon-organize" },
        ]}
      />

      <ConsistentFaqSection
        title="Frequently Asked Questions"
        subtitle="Common questions about converting PDF to PowerPoint"
        items={pdfToPptFaq}
      />

      <ConsistentCtaSection
        title="Ready to convert your PDF presentation?"
        subtitle="Drop your PDF above — full slide rendering, 100% private, zero uploads."
        primaryCtaText="Convert PDF to PowerPoint"
        onPrimaryClick={() => fileInputRef.current?.click()}
        secondaryCtaText="Explore all tools"
        secondaryCtaLink="/tools"
      />

      <SaasFooter />

      <ToolWorkspaceModal
        tool={activeToolModal}
        open={Boolean(activeToolModal)}
        onOpenChange={(open) => { if (!open) setActiveToolModal(null); }}
      />
    </div>
  );
}
