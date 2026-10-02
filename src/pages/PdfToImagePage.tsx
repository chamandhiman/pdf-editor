import { useState, useRef, useCallback, useEffect } from "react";
import {
  FileImage,
  FileUp,
  Download,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Layers,
  FileCheck,
  ZoomIn,
  Image as ImageIcon,
  Package,
  Sliders,
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
import { convertPdfToImages } from "@/lib/pdf-to-pptx";
import { loadPdfDocument } from "@/lib/pdf-loader";
import { renderAllDocumentThumbnails } from "@/lib/pdf-operations";
import { pdfToJpgFaq, pdfToPngFaq } from "@/lib/faq-data";
import { type PdfTool } from "@/lib/pdf-tools-data";

interface PdfToImagePageProps {
  format: "jpeg" | "png";
}

const FORMAT_CONFIG = {
  jpeg: {
    label: "JPG",
    ext: "jpg",
    colorFrom: "#f97316",
    colorTo: "#ef4444",
    textGradFrom: "from-orange-300",
    textGradVia: "via-red-300",
    textGradTo: "to-pink-300",
    longDescription: "Convert each PDF page to a crisp, high-resolution JPG image at 2.5× render scale — perfect for sharing, printing, or embedding.",
    badge: "High-Resolution JPG Export",
    supportsQuality: true,
  },
  png: {
    label: "PNG",
    ext: "png",
    colorFrom: "#10b981",
    colorTo: "#0ea5e9",
    textGradFrom: "from-emerald-300",
    textGradVia: "via-teal-300",
    textGradTo: "to-sky-300",
    longDescription: "Export every PDF page as a lossless PNG image with full detail — ideal for design, archiving, and high-fidelity reproduction.",
    badge: "Lossless PNG Export",
    supportsQuality: false,
  },
};

export function PdfToImagePage({ format }: PdfToImagePageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cfg = FORMAT_CONFIG[format];

  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    buffer: ArrayBuffer;
    pageCount: number;
  } | null>(null);

  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const dragCounter = useRef(0);

  const [quality, setQuality] = useState(95);
  const [dpiScale, setDpiScale] = useState<1.5 | 2 | 2.5 | 3>(2.5);

  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<{ current: number; total: number } | null>(null);
  const [convertedImages, setConvertedImages] = useState<{ pageNumber: number; dataUrl: string; widthPx: number; heightPx: number }[]>([]);
  const [activeToolModal, setActiveToolModal] = useState<PdfTool | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

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
    const toastId = toast.loading(`Loading ${file.name}...`);
    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await loadPdfDocument(buffer.slice(0));
      setSelectedFile({ file, buffer, pageCount: pdfDoc.numPages });
      setConvertedImages([]);
      setThumbnails({});
      setPreviewIndex(0);
      toast.success(`${file.name} ready — ${pdfDoc.numPages} page(s).`, { id: toastId });
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
    const q = format === "jpeg" ? quality / 100 : 1;
    const toastId = toast.loading(`Rendering ${selectedFile.pageCount} page(s) as ${cfg.label}...`);
    try {
      const images = await convertPdfToImages(
        selectedFile.buffer,
        format,
        q,
        dpiScale,
        (current, total) => setConversionProgress({ current, total })
      );
      setConvertedImages(images);
      setPreviewIndex(0);
      toast.success(`${images.length} ${cfg.label} image(s) ready!`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || `Failed to convert PDF to ${cfg.label}.`, { id: toastId });
    } finally {
      setIsConverting(false);
      setConversionProgress(null);
    }
  };

  const handleDownloadSingle = (img: { pageNumber: number; dataUrl: string }) => {
    if (!selectedFile) return;
    const a = document.createElement("a");
    a.href = img.dataUrl;
    a.download = `${selectedFile.file.name.replace(/\.pdf$/i, "")}_page_${img.pageNumber}.${cfg.ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Page ${img.pageNumber} downloaded as .${cfg.ext}`);
  };

  const handleDownloadAll = async () => {
    if (!convertedImages.length || !selectedFile) return;
    if (convertedImages.length === 1) {
      handleDownloadSingle(convertedImages[0]!);
      return;
    }
    const toastId = toast.loading(`Packaging ${convertedImages.length} images into ZIP...`);
    try {
      const zip = new JSZip();
      const folder = zip.folder("images")!;
      for (const img of convertedImages) {
        const base64 = img.dataUrl.split(",")[1] ?? "";
        folder.file(`page_${String(img.pageNumber).padStart(3, "0")}.${cfg.ext}`, base64, { base64: true });
      }
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = selectedFile.file.name.replace(/\.pdf$/i, "") + `_${cfg.label}_images.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`All ${convertedImages.length} images downloaded!`, { id: toastId });
    } catch {
      toast.error("Failed to package images.", { id: toastId });
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setConvertedImages([]);
    setThumbnails({});
    setPreviewIndex(0);
  };

  const faqItems = format === "jpeg" ? pdfToJpgFaq : pdfToPngFaq;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-brand selection:text-white">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        id={`img-pdf-upload-${format}`}
        onChange={(e) => { if (e.target.files?.[0]) handleProcessFile(e.target.files[0]); }}
      />

      <SaasHeader onToolSelect={setActiveToolModal} />

      {/* ── Hero / Upload ─────────────────────────────────────────── */}
      <section className="relative border-b border-border/30 pdf-hero-bg overflow-hidden">
        {/* Animated Background Icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 right-[8%] -translate-y-1/2 opacity-[0.07] animate-float">
            <FileImage className="w-64 h-64 text-brand" strokeWidth={0.6} />
          </div>
          <div className="absolute -top-6 left-[5%] opacity-[0.05] animate-float-1">
            <Layers className="w-48 h-48 text-brand" strokeWidth={0.7} />
          </div>
          <div className="absolute bottom-0 right-[30%] opacity-[0.04] animate-float-2">
            <ZoomIn className="w-36 h-36 text-brand" strokeWidth={0.8} />
          </div>
        </div>

        <div className="container max-w-6xl mx-auto px-4 relative z-10 py-6 md:py-8">
          {/* Header Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 leading-tight gradient-brand">
              PDF to {cfg.label} Converter
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              {cfg.longDescription}
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
                ${isDragging
                  ? `${format === "jpeg" ? "icon-jpg" : "icon-png"} scale-110 rotate-6`
                  : `${format === "jpeg" ? "icon-jpg" : "icon-png"} group-hover:scale-110 group-hover:-rotate-3`
                }
              `}>
                <FileImage className="w-12 h-12 text-white drop-shadow-lg" />
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
                id={`img-browse-btn-${format}`}
              >
                <FileUp className="w-5 h-5 mr-2" />
                Choose PDF File
              </Button>

              <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-brand" /> 100% Private</span>
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-brand" /> No Upload Needed</span>
                <span className="flex items-center gap-1.5"><FileCheck className="w-3.5 h-3.5 text-brand" /> {format === "jpeg" ? "High-Res JPG" : "Lossless PNG"}</span>
              </div>
            </div>
          )}

          {/* STATE 2: File selected */}
          {selectedFile && (
            <div className="w-full max-w-2xl mx-auto bg-card border border-border rounded-3xl p-6 shadow-lg space-y-4">
              {/* File info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${format === "jpeg" ? "icon-jpg" : "icon-png"}`}>
                    <FileImage className="w-6 h-6 text-white" />
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

              {/* Thumbnails */}
              {Object.keys(thumbnails).length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {Object.entries(thumbnails).slice(0, 8).map(([pg, url]) => (
                    <img key={pg} src={url} alt={`Page ${pg}`} className="h-16 w-auto rounded-lg border border-border flex-shrink-0 object-cover" />
                  ))}
                  {selectedFile.pageCount > 8 && (
                    <div className="h-16 w-12 rounded-lg border border-border flex items-center justify-center text-muted-foreground text-xs flex-shrink-0 bg-muted">+{selectedFile.pageCount - 8}</div>
                  )}
                </div>
              )}

              {/* Export Options */}
              {!convertedImages.length && (
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <p className="text-foreground text-sm font-medium flex items-center gap-2"><Sliders className="w-4 h-4 text-brand" /> Export Settings</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-muted-foreground text-xs mb-1.5 block">Render Scale (DPI)</label>
                      <div className="flex gap-1.5">
                        {([1.5, 2, 2.5, 3] as const).map(s => (
                          <button
                            key={s}
                            onClick={() => setDpiScale(s)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${dpiScale === s ? "bg-brand text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                          >
                            {s}×
                          </button>
                        ))}
                      </div>
                    </div>
                    {format === "jpeg" ? (
                      <div>
                        <label className="text-muted-foreground text-xs mb-1.5 block">JPEG Quality: {quality}%</label>
                        <input
                          type="range" min={60} max={100} step={5} value={quality}
                          onChange={e => setQuality(Number(e.target.value))}
                          className="w-full accent-brand"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground">
                          PNG is lossless — no quality setting needed.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Convert button */}
              {!convertedImages.length && (
                <Button
                  onClick={handleConvert}
                  disabled={isConverting}
                  className="w-full bg-brand hover:bg-brand-hover text-white font-semibold py-3 gap-2"
                  style={{ borderRadius: "4px" }}
                  id={`img-convert-btn-${format}`}
                >
                  {isConverting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {conversionProgress
                        ? `Rendering page ${conversionProgress.current} of ${conversionProgress.total}...`
                        : "Initializing..."}
                    </>
                  ) : (
                    <>
                      <FileImage className="w-4 h-4" />
                      Convert to {cfg.label} Images
                    </>
                  )}
                </Button>
              )}

              {/* Progress */}
              {isConverting && conversionProgress && (
                <div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-500"
                      style={{ width: `${(conversionProgress.current / conversionProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-muted-foreground text-xs mt-1 text-center">
                    {Math.round((conversionProgress.current / conversionProgress.total) * 100)}% — {conversionProgress.current}/{conversionProgress.total}
                  </p>
                </div>
              )}

              {/* Result */}
              {convertedImages.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-green-800 dark:text-green-200 font-medium">
                      {convertedImages.length} {cfg.label} image(s) ready
                      {convertedImages[0] && ` — ${convertedImages[0].widthPx}×${convertedImages[0].heightPx}px`}
                    </span>
                  </div>

                  {/* Preview */}
                  <div className="space-y-2">
                    <div className="relative rounded-xl overflow-hidden border border-border bg-muted/30">
                      {convertedImages[previewIndex] && (
                        <img
                          src={convertedImages[previewIndex]!.dataUrl}
                          alt={`Page ${convertedImages[previewIndex]!.pageNumber}`}
                          className="w-full max-h-64 object-contain"
                        />
                      )}
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                        Page {convertedImages[previewIndex]?.pageNumber ?? 0} / {convertedImages.length}
                      </div>
                      {convertedImages.length > 1 && (
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                          <button onClick={() => setPreviewIndex(i => Math.max(0, i - 1))} disabled={previewIndex === 0}
                            className="bg-black/60 text-white px-3 py-1 rounded-lg text-xs disabled:opacity-40 hover:bg-black/80">← Prev</button>
                          <button onClick={() => setPreviewIndex(i => Math.min(convertedImages.length - 1, i + 1))} disabled={previewIndex === convertedImages.length - 1}
                            className="bg-black/60 text-white px-3 py-1 rounded-lg text-xs disabled:opacity-40 hover:bg-black/80">Next →</button>
                        </div>
                      )}
                    </div>
                    {convertedImages.length > 1 && (
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {convertedImages.map((img, idx) => (
                          <button key={img.pageNumber} onClick={() => setPreviewIndex(idx)}
                            className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${idx === previewIndex ? "border-brand scale-105" : "border-border hover:border-brand/50"}`}>
                            <img src={img.dataUrl} alt={`Page ${img.pageNumber}`} className="h-12 w-auto object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => convertedImages[previewIndex] && handleDownloadSingle(convertedImages[previewIndex]!)}
                      className="w-full bg-brand hover:bg-brand-hover text-white font-semibold gap-2"
                      style={{ borderRadius: "4px" }}
                      id={`img-dl-single-btn-${format}`}
                    >
                      <Download className="w-4 h-4" /> This Page
                    </Button>
                    <Button onClick={handleDownloadAll} variant="outline"
                      className="w-full font-semibold gap-2"
                      style={{ borderRadius: "4px" }}
                      id={`img-dl-all-btn-${format}`}>
                      <Package className="w-4 h-4" /> All as ZIP
                    </Button>
                  </div>
                  <Button onClick={handleReset} variant="ghost"
                    className="w-full text-muted-foreground hover:text-foreground gap-2"
                    id={`img-reset-btn-${format}`}>
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
              { icon: Zap, label: "Instant In-Browser Rendering" },
              { icon: FileCheck, label: "Pixel-Perfect Accuracy" },
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
        title={`How PDF to ${cfg.label} Works`}
        steps={[
          {
            step: "01",
            title: "Upload Your PDF",
            description: "Drop any PDF file to get started. Multi-page documents are fully supported.",
            badgeText: "Any PDF accepted",
            badgeIcon: FileUp,
            colorClass: "icon-edit",
          },
          {
            step: "02",
            title: `Set Quality & DPI`,
            description: `Choose your render scale and ${format === "jpeg" ? "JPEG quality" : "PNG mode"} for optimal output.`,
            badgeText: "Adjustable resolution",
            badgeIcon: Sliders,
            colorClass: "icon-convert",
          },
          {
            step: "03",
            title: `Download ${cfg.label} Images`,
            description: "Download individual page images or grab all as a single ZIP archive.",
            badgeText: "Single or ZIP download",
            badgeIcon: Download,
            colorClass: "icon-organize",
          },
        ]}
      />

      <WhyUseSection
        title={`Why Use Our PDF to ${cfg.label} Converter?`}
        subtitle={`Pixel-perfect ${cfg.label} images — no server uploads, no quality loss`}
        benefits={[
          { icon: ZoomIn, title: `High-Resolution ${cfg.label}`, description: `Pages rendered at ${dpiScale}× scale for crystal-clear output — ideal for print and professional use.`, colorClass: "icon-edit" },
          { icon: ImageIcon, title: "Pixel-Perfect Accuracy", description: "Every vector, gradient, font, and image in your PDF is faithfully reproduced in the output image.", colorClass: "icon-convert" },
          { icon: ShieldCheck, title: "100% Private — No Uploads", description: "All rendering happens locally in your browser. Your PDFs never leave your device.", colorClass: "icon-security" },
          { icon: Package, title: "Download All as ZIP", description: "Export all page images at once in a neatly organized ZIP archive with a single click.", colorClass: "icon-organize" },
          { icon: Sliders, title: "Quality & DPI Control", description: `Choose your render scale and ${format === "jpeg" ? "JPEG quality" : "PNG precision"} for the perfect balance.`, colorClass: "icon-compress" },
          { icon: Zap, title: "Instant Processing", description: "Conversion starts immediately — no queues, no waiting, no server round-trips.", colorClass: "icon-compress" },
        ]}
      />

      <ConsistentFaqSection
        title={`Frequently Asked Questions`}
        subtitle={`Common questions about converting PDF to ${cfg.label}`}
        items={faqItems}
      />

      <ConsistentCtaSection
        title={`Ready to convert your PDF to ${cfg.label}?`}
        subtitle={`Drop your PDF above — pixel-perfect ${cfg.label} images, 100% private, zero uploads.`}
        primaryCtaText={`Convert PDF to ${cfg.label}`}
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
