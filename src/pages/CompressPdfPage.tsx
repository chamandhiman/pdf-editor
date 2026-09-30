import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  FileArchive,
  FileUp,
  Download,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Zap,
  Gauge,
  Sliders,
  ArrowRight,
  ExternalLink,
  Layers,
  CloudOff,
  Lock,
  BarChart3,
  Folder,
  Image as LucideImage,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
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
import {
  compressPdfFile,
  COMPRESSION_PRESETS,
  type CompressionPreset,
  type CompressionResult,
  type CompressProgressUpdate,
} from "@/lib/pdf-compress";
import { loadPdfDocument } from "@/lib/pdf-loader";
import { renderAllDocumentThumbnails } from "@/lib/pdf-operations";
import { setUploadedPdf } from "@/lib/pdf-store";
import { compressPdfFaq } from "@/lib/faq-data";
import { type PdfTool } from "@/lib/pdf-tools-data";

export function CompressPdfPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    buffer: ArrayBuffer;
    pageCount: number;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const dragCounter = useRef(0);
  const [selectedPreset, setSelectedPreset] = useState<CompressionPreset>("recommended");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressState, setProgressState] = useState<CompressProgressUpdate | null>(null);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [activeToolModal, setActiveToolModal] = useState<PdfTool | null>(null);

  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [compressedThumbnails, setCompressedThumbnails] = useState<Record<number, string>>({});
  const [activeComparePage, setActiveComparePage] = useState<number>(1);
  const [resultViewMode, setResultViewMode] = useState<"compare" | "all-compressed">("compare");

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

      setSelectedFile({
        file,
        buffer,
        pageCount: pdfDoc.numPages,
      });

      setCompressionResult(null);
      setProgressState(null);
      setThumbnails({});
      setCompressedThumbnails({});
      setActiveComparePage(1);
      toast.success(`${file.name} ready for compression.`, { id: toastId });

      // Asynchronously render high-fidelity page thumbnails for every page of the uploaded PDF
      renderAllDocumentThumbnails(buffer, (pageNum, url) => {
        setThumbnails((prev) => ({ ...prev, [pageNum]: url }));
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load PDF file. Please ensure it is not corrupt or encrypted.", { id: toastId });
    }
  }, []);

  // Global window drag & drop listener (same full-screen experience as HomePage)
  useEffect(() => {
    const handleWindowDragEnter = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types?.includes("Files")) {
        dragCounter.current += 1;
        setIsWindowDragging(true);
      }
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setIsWindowDragging(false);
      }
    };

    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsWindowDragging(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0 && files[0]) {
        handleProcessFile(files[0]);
      }
    };

    window.addEventListener("dragenter", handleWindowDragEnter);
    window.addEventListener("dragleave", handleWindowDragLeave);
    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("drop", handleWindowDrop);

    return () => {
      window.removeEventListener("dragenter", handleWindowDragEnter);
      window.removeEventListener("dragleave", handleWindowDragLeave);
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("drop", handleWindowDrop);
    };
  }, [handleProcessFile]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleCompress = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    const toastId = toast.loading("Compressing PDF document...");

    try {
      const result = await compressPdfFile(selectedFile.buffer, selectedPreset, (update) => {
        setProgressState(update);
      });

      setCompressionResult(result);
      setActiveComparePage(1);

      // Render thumbnails for compressed output for before/after comparison
      if (result.compressedBytes) {
        renderAllDocumentThumbnails(result.compressedBytes.buffer as ArrayBuffer, (pageNum, url) => {
          setCompressedThumbnails((prev) => ({ ...prev, [pageNum]: url }));
        });
      }

      if (result.savingsPercent > 0) {
        toast.success(
          `Compressed by ${result.savingsPercent}%! Saved ${formatFileSize(result.savingsBytes)}.`,
          { id: toastId }
        );
      } else {
        toast.info(
          "Document is already highly compressed. Re-optimized streams losslessly.",
          { id: toastId }
        );
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to compress PDF file.", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetFile = () => {
    setSelectedFile(null);
    setCompressionResult(null);
    setProgressState(null);
    setThumbnails({});
    setCompressedThumbnails({});
    setActiveComparePage(1);
  };

  const handleDownload = () => {
    if (!compressionResult || !selectedFile) return;
    const blob = new Blob([compressionResult.compressedBytes.buffer as ArrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selectedFile.file.name.replace(/\.pdf$/i, "") + "_compressed.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Compressed PDF downloaded successfully!");
  };

  const handleOpenInEditor = () => {
    if (!compressionResult || !selectedFile) return;
    setUploadedPdf(
      (compressionResult.compressedBytes.buffer as ArrayBuffer).slice(0),
      selectedFile.file.name
    );
    toast.success("Compressed document opened in Visual Editor!");
    navigate({ to: "/editor", search: { file: selectedFile.file.name } });
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
          e.target.value = "";
        }}
      />

      <SaasHeader
        onOpenUploadModal={() => fileInputRef.current?.click()}
        onSelectTool={(tool) => setActiveToolModal(tool)}
      />

      <main className="flex-1">
        {/* ──────────────── FULL-WIDTH TOOL ZONE ──────────────── */}
        <section className="relative border-b border-border/30 pdf-hero-bg overflow-hidden">

          {/* ── Large continuously animating background icons (like homepage) ── */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Giant central PDF doc — slow continuous float */}
            <div className="absolute top-1/2 right-[8%] -translate-y-1/2 opacity-[0.07] animate-float">
              <FileText className="w-64 h-64 text-brand" strokeWidth={0.6} />
            </div>
            {/* Archive icon top-left */}
            <div className="absolute -top-6 left-[5%] opacity-[0.05] animate-float-1">
              <FileArchive className="w-48 h-48 text-brand" strokeWidth={0.7} />
            </div>
            {/* Layers icon bottom-right */}
            <div className="absolute bottom-0 right-[30%] opacity-[0.04] animate-float-2">
              <Layers className="w-36 h-36 text-brand-accent" strokeWidth={0.8} />
            </div>
            {/* Small accent top-right */}
            <div className="absolute top-8 right-[25%] opacity-[0.04] animate-float-1">
              <FileArchive className="w-20 h-20 text-brand-accent" strokeWidth={1} />
            </div>
          </div>

          {/* Extra ambient glow overlays */}
          <div className="absolute inset-0 pointer-events-none -z-10"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 70% 60% at 50% 0%, oklch(0.72 0.175 65 / 0.08) 0%, transparent 65%), radial-gradient(circle at 85% 60%, oklch(0.55 0.24 22 / 0.06) 0%, transparent 45%)",
            }}
          />

          <div className="container max-w-6xl mx-auto px-4 relative z-10">
            {/* ── STATE 1: Upload Dropzone ── */}
            {!selectedFile && (
              <div className="py-6 md:py-8 flex flex-col items-center justify-center text-center">

                {/* Page title ABOVE the box */}
                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8 leading-tight gradient-brand">
                  Compress PDF
                </h1>

                {/* ── Dropzone card ── */}
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
                  {/* Corner accent blobs inside box */}
                  <div className="absolute top-0 left-0 w-20 h-20 rounded-tl-3xl overflow-hidden pointer-events-none">
                    <div className="absolute -top-5 -left-5 w-24 h-24 bg-gradient-to-br from-brand/15 to-transparent rounded-full" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-20 h-20 rounded-br-3xl overflow-hidden pointer-events-none">
                    <div className="absolute -bottom-5 -right-5 w-24 h-24 bg-gradient-to-tl from-brand-accent/15 to-transparent rounded-full" />
                  </div>

                  {/* Animated icon */}
                  <div className={`
                    relative w-24 h-24 rounded-3xl flex items-center justify-center mb-6
                    transition-all duration-500 shadow-xl
                    ${isDragging
                      ? "icon-compress scale-110 rotate-6"
                      : "icon-compress group-hover:scale-110 group-hover:-rotate-3"
                    }
                  `}>
                    <FileArchive className="w-12 h-12 text-white drop-shadow-lg" />
                    <span className="absolute inset-0 rounded-3xl border-2 border-white/25 animate-ping opacity-50" />
                  </div>

                  {/* Heading 1 inside box */}
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1.5">
                    Drop your PDF here
                  </h2>

                  {/* Heading 2 inside box */}
                  <p className="text-sm md:text-base text-muted-foreground">
                    or click anywhere to browse files
                  </p>

                  {/* OR divider */}
                  <div className="mt-6 flex items-center justify-center gap-3 w-36">
                    <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
                    <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">or</span>
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
              </div>
            )}

            {/* ── STATE 2: Selected File & Presets ── */}
            {selectedFile && !compressionResult && (
              <div className="py-10 md:py-14">
                <div className="max-w-4xl mx-auto">
                  <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
                    <div className="p-6 md:p-8 space-y-6">
                      {/* File info bar with Cover Thumbnail */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 border border-border">
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* First Page Cover Thumbnail */}
                          <div className="relative w-12 h-16 rounded-lg bg-white border border-border/80 shadow-sm overflow-hidden shrink-0 flex items-center justify-center">
                            {thumbnails[1] ? (
                              <img
                                src={thumbnails[1]}
                                alt="Cover Page"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center">
                                <FileText className="w-6 h-6 animate-pulse" />
                              </div>
                            )}
                            <span className="absolute bottom-0 inset-x-0 bg-black/65 text-[9px] text-white font-bold text-center py-0.5 tracking-tight">
                              p.1
                            </span>
                          </div>

                          <div className="overflow-hidden min-w-0">
                            <h4 className="font-bold text-sm sm:text-base text-foreground truncate max-w-xs md:max-w-md">
                              {selectedFile.file.name}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Original Size: <strong className="text-foreground">{formatFileSize(selectedFile.file.size)}</strong> • {selectedFile.pageCount} page{selectedFile.pageCount === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetFile}
                          disabled={isProcessing}
                          className="text-xs text-muted-foreground hover:text-foreground self-end sm:self-auto shrink-0"
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                          Change File
                        </Button>
                      </div>

                      {/* ALL PAGES THUMBNAIL GALLERY */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Eye className="w-4 h-4 text-primary" />
                            Document Pages Preview ({selectedFile.pageCount} page{selectedFile.pageCount === 1 ? "" : "s"})
                          </label>
                          <span className="text-[11px] text-muted-foreground font-medium">
                            {Object.keys(thumbnails).length >= selectedFile.pageCount
                              ? `All ${selectedFile.pageCount} pages rendered`
                              : `Rendering pages (${Object.keys(thumbnails).length}/${selectedFile.pageCount})...`}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 max-h-[360px] overflow-y-auto p-2 rounded-xl border border-border/70 bg-muted/20">
                          {Array.from({ length: selectedFile.pageCount }, (_, i) => i + 1).map((pageNum) => {
                            const thumb = thumbnails[pageNum];
                            return (
                              <div
                                key={pageNum}
                                className="group relative bg-card rounded-xl border border-border/80 hover:border-primary/60 p-2.5 flex flex-col items-center transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 select-none"
                              >
                                {/* Page Badge */}
                                <div className="w-full flex items-center justify-between mb-1.5 px-0.5">
                                  <span className="text-[11px] font-bold text-foreground px-1.5 py-0.5 rounded bg-muted/80 border border-border/50">
                                    Page {pageNum}
                                  </span>
                                </div>

                                {/* Thumbnail Container */}
                                <div className="w-full aspect-[1/1.38] bg-white rounded-lg border border-border/60 shadow-xs overflow-hidden flex items-center justify-center relative">
                                  {thumb ? (
                                    <img
                                      src={thumb}
                                      alt={`Page ${pageNum}`}
                                      className="w-full h-full object-contain pointer-events-none transition-transform duration-200 group-hover:scale-[1.02]"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center p-2 text-center">
                                      <FileText className="w-6 h-6 text-muted-foreground/40 animate-pulse mb-1" />
                                      <span className="text-[10px] text-muted-foreground font-medium">
                                        Loading...
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Preset Selector */}
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Gauge className="w-4 h-4 text-primary" />
                          Select Compression Level
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                          {(["extreme", "recommended", "low"] as CompressionPreset[]).map((presetKey) => {
                            const preset = COMPRESSION_PRESETS[presetKey];
                            const isSelected = selectedPreset === presetKey;

                            return (
                              <div
                                key={presetKey}
                                onClick={() => !isProcessing && setSelectedPreset(presetKey)}
                                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                                  isSelected
                                    ? "border-primary bg-primary/5 shadow-md"
                                    : "border-border/70 hover:border-primary/40 bg-card"
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                      isSelected
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                    }`}>
                                      {preset.badge}
                                    </span>
                                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                      {preset.estimatedReduction}
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-sm text-foreground mb-1">
                                    {preset.name}
                                  </h4>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {preset.description}
                                  </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Quality factor:</span>
                                  <span className="font-semibold text-foreground">
                                    {Math.round(preset.jpegQuality * 100)}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Processing Progress */}
                      {isProcessing && (
                        <div className="py-6 space-y-3 text-center">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto animate-pulse">
                            <FileArchive className="w-6 h-6 animate-spin" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold">Compressing Document...</h4>
                            <p className="text-xs text-muted-foreground">
                              {progressState?.message || "Optimizing document structures..."}
                            </p>
                          </div>
                          <div className="max-w-md mx-auto space-y-1">
                            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden border border-border/40">
                              <div
                                className="bg-primary h-full transition-all duration-300 rounded-full"
                                style={{ width: `${progressState?.percent || 10}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                              <span>Progress</span>
                              <span>{progressState?.percent || 10}%</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Compress Action Button */}
                      {!isProcessing && (
                        <Button
                          onClick={handleCompress}
                          size="lg"
                          className="w-full h-13 rounded-xl font-bold text-base shadow-lg"
                        >
                          <Zap className="w-5 h-5 mr-2" />
                          Compress PDF Now
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STATE 3: Compression Result / Success Screen ── */}
            {compressionResult && selectedFile && (
              <div className="py-10 md:py-14">
                <div className="max-w-4xl mx-auto">
                  <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
                    <div className="p-6 md:p-10 space-y-8">
                      <div className="text-center space-y-2">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black text-foreground">
                          Your PDF is now compressed!
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Successfully reduced file size by{" "}
                          <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {compressionResult.savingsPercent}%
                          </strong>{" "}
                          ({formatFileSize(compressionResult.savingsBytes)} saved) with clean visual fidelity.
                        </p>
                      </div>

                      {/* Before / After Comparison Card */}
                      <div className="p-6 rounded-2xl bg-muted/30 border border-border grid grid-cols-1 sm:grid-cols-3 gap-6 items-center text-center">
                        <div className="space-y-1">
                          <span className="text-xs uppercase tracking-wider text-muted-foreground block font-semibold">
                            Original Size
                          </span>
                          <span className="text-2xl font-bold text-muted-foreground line-through">
                            {formatFileSize(compressionResult.originalSize)}
                          </span>
                        </div>

                        <div className="flex flex-col items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs mb-1">
                            <ArrowRight className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            -{compressionResult.savingsPercent}%
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-xs uppercase tracking-wider text-primary block font-bold">
                            Compressed Size
                          </span>
                          <span className="text-3xl font-black text-foreground">
                            {formatFileSize(compressionResult.compressedSize)}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <Button
                          onClick={handleDownload}
                          size="lg"
                          className="w-full sm:flex-1 h-12 rounded-xl font-bold bg-primary text-primary-foreground shadow-md hover:opacity-95"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Compressed PDF
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleOpenInEditor}
                          size="lg"
                          className="w-full sm:w-auto h-12 rounded-xl font-semibold border-border hover:bg-muted"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open in Editor
                        </Button>
                      </div>

                      {/* Before / After Page Visual Quality Verification */}
                      <div className="space-y-4 pt-4 border-t border-border/60">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                              <Eye className="w-4 h-4 text-primary" />
                              Visual Quality Verification ({selectedFile.pageCount} page{selectedFile.pageCount === 1 ? "" : "s"})
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Verify visual fidelity and sharpness before and after compression.
                            </p>
                          </div>

                          {/* View Mode Toggle */}
                          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1 gap-1 text-xs self-start sm:self-auto">
                            <button
                              type="button"
                              onClick={() => setResultViewMode("compare")}
                              className={`px-3 py-1 rounded-md font-medium transition-all ${
                                resultViewMode === "compare"
                                  ? "bg-background text-foreground shadow-xs"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Side-by-Side
                            </button>
                            <button
                              type="button"
                              onClick={() => setResultViewMode("all-compressed")}
                              className={`px-3 py-1 rounded-md font-medium transition-all ${
                                resultViewMode === "all-compressed"
                                  ? "bg-background text-foreground shadow-xs"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              All Pages Grid
                            </button>
                          </div>
                        </div>

                        {resultViewMode === "compare" ? (
                          /* Side by Side Comparison */
                          <div className="space-y-3 bg-muted/20 border border-border/80 rounded-2xl p-4 sm:p-5">
                            {/* Page switcher pagination */}
                            {selectedFile.pageCount > 1 && (
                              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                                <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[70%]">
                                  {Array.from({ length: selectedFile.pageCount }, (_, i) => i + 1).map((p) => (
                                    <button
                                      key={p}
                                      type="button"
                                      onClick={() => setActiveComparePage(p)}
                                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all shrink-0 ${
                                        activeComparePage === p
                                          ? "bg-primary text-primary-foreground shadow-xs"
                                          : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                                      }`}
                                    >
                                      Page {p}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    disabled={activeComparePage <= 1}
                                    onClick={() => setActiveComparePage((prev) => Math.max(1, prev - 1))}
                                  >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                  </Button>
                                  <span className="text-xs font-semibold text-muted-foreground min-w-14 text-center">
                                    {activeComparePage} of {selectedFile.pageCount}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    disabled={activeComparePage >= selectedFile.pageCount}
                                    onClick={() => setActiveComparePage((prev) => Math.min(selectedFile.pageCount, prev + 1))}
                                  >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* 2 Side by Side Columns */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Before Card */}
                              <div className="bg-card rounded-xl border border-border p-3.5 flex flex-col items-center shadow-xs">
                                <div className="w-full flex items-center justify-between mb-2">
                                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                    Before (Original)
                                  </span>
                                  <span className="text-xs text-muted-foreground font-mono">
                                    Page {activeComparePage}
                                  </span>
                                </div>
                                <div className="w-full aspect-[1/1.38] bg-white rounded-lg border border-border/80 shadow-xs overflow-hidden flex items-center justify-center">
                                  {thumbnails[activeComparePage] ? (
                                    <img
                                      src={thumbnails[activeComparePage]}
                                      alt={`Original Page ${activeComparePage}`}
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center p-4">
                                      <FileText className="w-8 h-8 text-muted-foreground/30 animate-pulse mb-1" />
                                      <span className="text-xs text-muted-foreground">Loading original...</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* After Card */}
                              <div className="bg-card rounded-xl border-2 border-emerald-500/40 p-3.5 flex flex-col items-center shadow-sm">
                                <div className="w-full flex items-center justify-between mb-2">
                                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                    After (Compressed -{compressionResult.savingsPercent}%)
                                  </span>
                                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Sharp
                                  </span>
                                </div>
                                <div className="w-full aspect-[1/1.38] bg-white rounded-lg border border-border/80 shadow-xs overflow-hidden flex items-center justify-center">
                                  {compressedThumbnails[activeComparePage] || thumbnails[activeComparePage] ? (
                                    <img
                                      src={compressedThumbnails[activeComparePage] || thumbnails[activeComparePage]}
                                      alt={`Compressed Page ${activeComparePage}`}
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center p-4">
                                      <FileText className="w-8 h-8 text-muted-foreground/30 animate-pulse mb-1" />
                                      <span className="text-xs text-muted-foreground">Loading compressed...</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* All Pages Grid */
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 max-h-[380px] overflow-y-auto p-2 rounded-xl border border-border/70 bg-muted/20">
                            {Array.from({ length: selectedFile.pageCount }, (_, i) => i + 1).map((p) => {
                              const thumb = compressedThumbnails[p] || thumbnails[p];
                              return (
                                <div
                                  key={p}
                                  className="group bg-card rounded-xl border border-border/80 hover:border-emerald-500/60 p-2.5 flex flex-col items-center transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5"
                                >
                                  <div className="w-full flex items-center justify-between mb-1.5 px-0.5">
                                    <span className="text-[11px] font-bold text-foreground px-1.5 py-0.5 rounded bg-muted/80 border border-border/50">
                                      Page {p}
                                    </span>
                                    <span className="text-[10px] text-emerald-600 font-bold">
                                      OK
                                    </span>
                                  </div>
                                  <div className="w-full aspect-[1/1.38] bg-white rounded-lg border border-border/60 shadow-xs overflow-hidden flex items-center justify-center">
                                    {thumb ? (
                                      <img
                                        src={thumb}
                                        alt={`Page ${p}`}
                                        className="w-full h-full object-contain"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <FileText className="w-6 h-6 text-muted-foreground/40 animate-pulse" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Reset action */}
                      <div className="text-center pt-2">
                        <Button
                          variant="ghost"
                          onClick={handleResetFile}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                          Compress Another PDF Document
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Quick Features Bar (below uploader) ── */}
        <section className="py-10 md:py-14 bg-muted/20 border-b border-border/30">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border/60 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CloudOff className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">No Server Uploads</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your files never leave your device. All compression happens locally in your browser.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border/60 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">Up to 75% Smaller</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Choose from 3 presets to balance file size reduction with visual quality.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border/60 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">No Limits or Watermarks</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Compress unlimited files with no daily caps, no watermarks, and no sign-up required.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <HowItWorksSection
          badge="Simple 3-Step Process"
          title="How to Compress PDF Documents Online"
          subtitle="Reduce large PDF files in seconds with zero complicated settings or quality degradation."
          steps={[
            {
              step: "01",
              title: "Upload Your PDF",
              description: "Select or drag and drop your document into the secure, client-side browser workspace.",
              badgeText: "Local client-side parsing",
              badgeIcon: FileUp,
              colorClass: "icon-compress",
            },
            {
              step: "02",
              title: "Select Compression Level",
              description: "Choose between Extreme (smallest size), Recommended (balanced), or Low compression (highest quality).",
              badgeText: "Customizable presets",
              badgeIcon: Sliders,
              colorClass: "icon-edit",
            },
            {
              step: "03",
              title: "Download Smaller PDF",
              description: "Instantly download your optimized, lightweight PDF file ready for email or online uploads.",
              badgeText: "Instant savings",
              badgeIcon: Download,
              colorClass: "icon-convert",
            },
          ]}
        />

        {/* Why Use Section */}
        <WhyUseSection
          badge="High-Efficiency Compression"
          title="Why Compress PDFs with WebToolOcean"
          subtitle="Engineered for professionals, students, and businesses who need smaller files with zero privacy compromise."
          benefits={[
            {
              icon: ShieldCheck,
              title: "100% In-Browser Privacy",
              description: "Your confidential files never leave your device. All compression runs locally in your browser's RAM sandbox.",
              colorClass: "icon-security",
            },
            {
              icon: Zap,
              title: "Up to 75% File Reduction",
              description: "Significantly downsize oversized scans, presentations, and receipts to comply with strict email limits.",
              colorClass: "icon-compress",
            },
            {
              icon: Layers,
              title: "Crisp Visual Typography",
              description: "Intelligent re-sampling preserves fine text readability and layout geometry without pixelation.",
              colorClass: "icon-edit",
            },
            {
              icon: Sliders,
              title: "3 Fine-Tuned Presets",
              description: "Select the ideal balance between byte reduction and visual fidelity with one-click presets.",
              colorClass: "icon-organize",
            },
            {
              icon: Gauge,
              title: "Blazing Fast Execution",
              description: "Zero upload queues or remote server latency. Compress multi-page documents in seconds.",
              colorClass: "icon-convert",
            },
            {
              icon: FileArchive,
              title: "No Daily Limits or Watermarks",
              description: "Compress unlimited documents up to 100 MB each with zero watermarks or subscription walls.",
              colorClass: "icon-ocr",
            },
          ]}
        />

        {/* FAQ Section */}
        <ConsistentFaqSection
          badge="Compress FAQs"
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about reducing PDF file size and image optimization."
          items={compressPdfFaq}
        />

        {/* Consistent CTA Section */}
        <ConsistentCtaSection
          title="Ready to shrink your large PDF files?"
          subtitle="Join thousands of users optimizing documents for seamless emailing and web sharing with complete privacy."
          primaryCtaText="Compress PDF Now"
          onPrimaryClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            fileInputRef.current?.click();
          }}
          secondaryCtaText="Explore All PDF Tools"
          secondaryCtaLink="/tools"
        />
      </main>

      <ToolWorkspaceModal
        tool={activeToolModal}
        open={Boolean(activeToolModal)}
        onOpenChange={(open) => {
          if (!open) setActiveToolModal(null);
        }}
      />

      {/* Full-Screen Drag & Drop Overlay (same as HomePage) */}
      {isWindowDragging && (
        <div
          className="fixed inset-3 sm:inset-4 z-50 rounded-2xl border-2 border-brand drag-pattern-overlay backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto transition-all animate-in fade-in duration-150 shadow-2xl"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current -= 1;
            if (dragCounter.current <= 0) {
              dragCounter.current = 0;
              setIsWindowDragging(false);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current = 0;
            setIsWindowDragging(false);
            const files = e.dataTransfer.files;
            if (files && files.length > 0 && files[0]) {
              handleProcessFile(files[0]);
            }
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="-rotate-12 transform text-brand">
              <LucideImage className="w-8 h-8 stroke-[1.8]" />
            </div>
            <div className="text-brand -mt-2">
              <FileText className="w-9 h-9 stroke-[1.8]" />
            </div>
            <div className="rotate-12 transform text-brand">
              <Folder className="w-8 h-8 stroke-[1.8]" />
            </div>
          </div>
          <p className="text-brand text-base sm:text-lg font-medium tracking-tight">
            Drop files here
          </p>
        </div>
      )}

      <SaasFooter />
    </div>
  );
}
