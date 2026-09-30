import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ScanText,
  FileUp,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Search,
  Languages,
  Zap,
  Eye,
  FileCheck,
  AlertCircle,
  ExternalLink,
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
  OCR_SUPPORTED_LANGUAGES,
  runPdfOcr,
  inspectPdfNativeText,
  type OcrEngineResult,
  type OcrProgressUpdate,
} from "@/lib/pdf-ocr";
import { renderAllDocumentThumbnails } from "@/lib/pdf-operations";
import { setUploadedPdf } from "@/lib/pdf-store";
import { ocrPdfFaq } from "@/lib/faq-data";
import { type PdfTool } from "@/lib/pdf-tools-data";

export function OcrPdfPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    buffer: ArrayBuffer;
    pageCount: number;
    hasNativeText: boolean;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const dragCounter = useRef(0);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("eng");
  const [pageSelectionMode, setPageSelectionMode] = useState<"all" | "first" | "custom">("all");
  const [customRangeText, setCustomRangeText] = useState("");
  const [generateSearchablePdf, setGenerateSearchablePdf] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressState, setProgressState] = useState<OcrProgressUpdate | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrEngineResult | null>(null);
  const [activeTab, setActiveTab] = useState<"text" | "pages">("text");
  const [copiedAll, setCopiedAll] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [activeToolModal, setActiveToolModal] = useState<PdfTool | null>(null);

  // Global window drag listeners for full-screen drop feedback
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

    const handleDropWindow = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsWindowDragging(false);
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDropWindow);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDropWindow);
    };
  }, []);

  const handleProcessFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      toast.error("Please select a valid PDF file.");
      return;
    }

    const toastId = toast.loading(`Inspecting ${file.name}...`);
    try {
      const buffer = await file.arrayBuffer();
      const inspection = await inspectPdfNativeText(buffer);

      setSelectedFile({
        file,
        buffer,
        pageCount: inspection.pageCount,
        hasNativeText: inspection.hasNativeText,
      });

      setOcrResult(null);
      setProgressState(null);
      setThumbnailUrl(null);

      // Render page 1 thumbnail
      renderAllDocumentThumbnails(buffer, (pageNum, url) => {
        if (pageNum === 1) {
          setThumbnailUrl(url);
        }
      });

      if (inspection.hasNativeText) {
        toast.info("PDF contains native digital text. OCR will enhance or extract all layers.", { id: toastId });
      } else {
        toast.success("Scanned document ready for high-accuracy OCR recognition.", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to read PDF file.", { id: toastId });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const parsePageIndices = (total: number): number[] => {
    if (pageSelectionMode === "first") return [0];
    if (pageSelectionMode === "all") return Array.from({ length: total }, (_, i) => i);

    // Custom range (e.g., "1-3, 5")
    const indices: Set<number> = new Set();
    const parts = customRangeText.split(",");
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      if (trimmed.includes("-")) {
        const splitParts = trimmed.split("-");
        const startStr = splitParts[0];
        const endStr = splitParts[1];
        if (startStr && endStr) {
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (!isNaN(start) && !isNaN(end)) {
            const min = Math.min(start, end);
            const max = Math.max(start, end);
            for (let p = min; p <= max; p++) {
              if (p >= 1 && p <= total) indices.add(p - 1);
            }
          }
        }
      } else {
        const single = parseInt(trimmed, 10);
        if (!isNaN(single) && single >= 1 && single <= total) {
          indices.add(single - 1);
        }
      }
    }

    const res = Array.from(indices).sort((a, b) => a - b);
    return res.length > 0 ? res : Array.from({ length: total }, (_, i) => i);
  };

  const handleStartOcr = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    const toastId = toast.loading("Starting neural OCR engine...");

    try {
      const pageIndices = parsePageIndices(selectedFile.pageCount);

      const result = await runPdfOcr(selectedFile.buffer, {
        language: selectedLanguage,
        pageIndices,
        generateSearchablePdf,
        onProgress: (update) => {
          setProgressState(update);
        },
      });

      setOcrResult(result);
      toast.success(
        `OCR Completed! Extracted ${result.totalWords.toLocaleString()} words across ${result.pages.length} pages.`,
        { id: toastId }
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "OCR recognition failed. Please try again.", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyText = async () => {
    if (!ocrResult?.fullText) return;
    try {
      await navigator.clipboard.writeText(ocrResult.fullText);
      setCopiedAll(true);
      toast.success("All extracted text copied to clipboard!");
      setTimeout(() => setCopiedAll(false), 2500);
    } catch {
      toast.error("Failed to copy text to clipboard.");
    }
  };

  const handleDownloadTxt = () => {
    if (!ocrResult?.fullText || !selectedFile) return;
    const blob = new Blob([ocrResult.fullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selectedFile.file.name.replace(/\.pdf$/i, "") + "_ocr_text.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Text file downloaded successfully!");
  };

  const handleDownloadSearchablePdf = () => {
    if (!ocrResult?.searchablePdfBytes || !selectedFile) return;
    const blob = new Blob([ocrResult.searchablePdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selectedFile.file.name.replace(/\.pdf$/i, "") + "_searchable.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Searchable PDF downloaded successfully!");
  };

  const handleOpenInEditor = () => {
    if (!selectedFile) return;
    const bytesToLoad = ocrResult?.searchablePdfBytes
      ? (ocrResult.searchablePdfBytes.buffer as ArrayBuffer)
      : selectedFile.buffer;

    setUploadedPdf(bytesToLoad.slice(0), selectedFile.file.name);
    toast.success("Document transferred to PDF Studio Visual Editor!");
    navigate({ to: "/editor", search: { file: selectedFile.file.name } });
  };

  const filteredPages = ocrResult?.pages.filter((p) => {
    if (!searchFilter.trim()) return true;
    return (
      p.text.toLowerCase().includes(searchFilter.toLowerCase()) ||
      `page ${p.pageNumber}`.includes(searchFilter.toLowerCase())
    );
  });

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
        {/* Unified Hero & Main Tool Workspace */}
        <section className="relative border-b border-border/30 pdf-hero-bg overflow-hidden py-10 md:py-16">
          {/* Continuous floating background icons */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            <div className="absolute top-[8%] left-[6%] animate-float text-emerald-500/[0.07] dark:text-emerald-400/[0.09] transform -rotate-12">
              <ScanText className="w-24 h-24 sm:w-32 sm:h-32" />
            </div>
            <div className="absolute top-[18%] right-[8%] animate-float-1 text-teal-500/[0.06] dark:text-teal-400/[0.08] transform rotate-12">
              <Sparkles className="w-20 h-20 sm:w-28 sm:h-28" />
            </div>
            <div className="absolute bottom-[22%] left-[10%] animate-float-2 text-cyan-500/[0.06] dark:text-cyan-400/[0.08] transform 6">
              <Languages className="w-18 h-18 sm:w-24 sm:h-24" />
            </div>
            <div className="absolute bottom-[10%] right-[12%] animate-float text-emerald-500/[0.06] dark:text-emerald-400/[0.08] transform -rotate-6">
              <Search className="w-20 h-20 sm:w-28 sm:h-28" />
            </div>
            <div className="absolute top-[52%] left-[3%] animate-float-1 text-blue-500/[0.05] dark:text-blue-400/[0.07] transform 12">
              <FileCheck className="w-16 h-16 sm:w-20 sm:h-20" />
            </div>
          </div>

          {/* Ambient radial glow */}
          <div
            className="absolute inset-0 pointer-events-none -z-10"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 70% 60% at 50% 0%, oklch(0.72 0.175 65 / 0.08) 0%, transparent 65%), radial-gradient(circle at 85% 60%, oklch(0.65 0.18 160 / 0.06) 0%, transparent 45%)",
            }}
          />

          <div className="container max-w-5xl mx-auto px-4 relative z-10">
            {/* ── STATE 1: Upload Dropzone (Empty State) ── */}
            {!selectedFile && (
              <div className="py-6 md:py-8 flex flex-col items-center justify-center text-center">
                {/* Page title ABOVE the box */}
                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8 leading-tight gradient-brand">
                  OCR PDF
                </h1>

                {/* Dropzone card matching Compress PDF */}
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
                  <div
                    className={`
                      relative w-24 h-24 rounded-3xl flex items-center justify-center mb-6
                      transition-all duration-500 shadow-xl
                      ${isDragging
                        ? "icon-extract scale-110 rotate-6"
                        : "icon-extract group-hover:scale-110 group-hover:-rotate-3"
                      }
                    `}
                  >
                    <ScanText className="w-12 h-12 text-white drop-shadow-lg" />
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
                    className="mt-5 rounded-2xl px-14 h-14 text-base font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all pointer-events-none animate-pulse-glow"
                  >
                    <FileUp className="w-5 h-5 mr-2" />
                    Select PDF file
                  </Button>
                </div>
              </div>
            )}

            {/* ── STATE 2 & 3: File Config & OCR Results ── */}
            {selectedFile && (
              <>
                {/* Header Title Section */}
                <div className="text-center max-w-3xl mx-auto mb-10">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>100% Client-Side Neural OCR • Zero Server Uploads</span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                    OCR PDF — Convert Scanned Documents to <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">Searchable Text</span>
                  </h1>
                  <p className="mt-3.5 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Extract text from scanned PDFs, images, receipts, and invoices with extreme accuracy.
                    Download 100% searchable, selectable PDFs or copy text directly to your clipboard.
                  </p>
                </div>

                {/* Main Tool Card */}
                <div className="bg-card border border-border/80 rounded-2xl shadow-xl shadow-brand/5 overflow-hidden transition-all">
                  <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

                  {/* State 2: File Config & Processing */}
                  <div className="p-6 md:p-8 space-y-6">
                  {/* File info bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 border border-border">
                    <div className="flex items-center gap-3">
                      {thumbnailUrl ? (
                        <div className="w-12 h-16 rounded-lg overflow-hidden border border-border shadow-sm bg-white shrink-0">
                          <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <h4 className="font-semibold text-sm truncate max-w-xs md:max-w-md">
                          {selectedFile.file.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.file.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.pageCount} page
                          {selectedFile.pageCount === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          setOcrResult(null);
                          setProgressState(null);
                          setThumbnailUrl(null);
                        }}
                        disabled={isProcessing}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1" />
                        Change File
                      </Button>
                    </div>
                  </div>

                  {/* Native text detection badge */}
                  {selectedFile.hasNativeText ? (
                    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        <strong>Digital text detected:</strong> This document already contains embedded text. Running OCR will enhance unindexed graphics and extract all text cleanly.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        <strong>Scanned document verified:</strong> No native text layer found. Neural OCR will recognize all character glyphs and generate a searchable text layer.
                      </span>
                    </div>
                  )}

                  {/* OCR Settings if not finished or when re-running */}
                  {!ocrResult && !isProcessing && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                      {/* Language Selection */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Languages className="w-3.5 h-3.5 text-primary" />
                          Document Language
                        </label>
                        <select
                          value={selectedLanguage}
                          onChange={(e) => setSelectedLanguage(e.target.value)}
                          className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                        >
                          {OCR_SUPPORTED_LANGUAGES.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                              {lang.name} ({lang.nativeName})
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-muted-foreground">
                          Select the primary language to ensure highest optical accuracy.
                        </p>
                      </div>

                      {/* Page Range Selection */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <ScanText className="w-3.5 h-3.5 text-primary" />
                          Pages to Recognize
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setPageSelectionMode("all")}
                            className={`h-11 rounded-xl text-xs font-medium border transition-colors ${
                              pageSelectionMode === "all"
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card border-border hover:bg-muted"
                            }`}
                          >
                            All ({selectedFile.pageCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setPageSelectionMode("first")}
                            className={`h-11 rounded-xl text-xs font-medium border transition-colors ${
                              pageSelectionMode === "first"
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card border-border hover:bg-muted"
                            }`}
                          >
                            Page 1 Only
                          </button>
                          <button
                            type="button"
                            onClick={() => setPageSelectionMode("custom")}
                            className={`h-11 rounded-xl text-xs font-medium border transition-colors ${
                              pageSelectionMode === "custom"
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card border-border hover:bg-muted"
                            }`}
                          >
                            Custom Range
                          </button>
                        </div>
                        {pageSelectionMode === "custom" && (
                          <input
                            type="text"
                            placeholder="e.g. 1-3, 5"
                            value={customRangeText}
                            onChange={(e) => setCustomRangeText(e.target.value)}
                            className="w-full h-10 px-3 mt-1.5 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        )}
                      </div>

                      {/* Output toggles */}
                      <div className="md:col-span-2 pt-2 border-t border-border/60">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={generateSearchablePdf}
                            onChange={(e) => setGenerateSearchablePdf(e.target.checked)}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
                          />
                          <span className="text-xs font-medium text-foreground">
                            Generate Searchable PDF (embeds invisible text layer behind document image for Ctrl+F search & copy)
                          </span>
                        </label>
                      </div>

                      {/* Action Button */}
                      <div className="md:col-span-2 pt-4">
                        <Button
                          onClick={handleStartOcr}
                          size="lg"
                          className="w-full h-13 rounded-xl font-bold text-base shadow-lg"
                        >
                          <ScanText className="w-5 h-5 mr-2" />
                          Start OCR Recognition
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Processing Progress Bar */}
                  {isProcessing && (
                    <div className="py-8 space-y-4 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto animate-pulse">
                        <ScanText className="w-8 h-8 animate-spin" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold mb-1">
                          {progressState?.stage === "loading"
                            ? "Loading Neural OCR Engine..."
                            : progressState?.stage === "rendering"
                            ? "Rendering High-Resolution Scans..."
                            : progressState?.stage === "generating"
                            ? "Creating Searchable PDF Layer..."
                            : `Recognizing Text (Page ${progressState?.currentPage || 1} of ${
                                progressState?.totalPages || selectedFile.pageCount
                              })...`}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {progressState?.message || "Running client-side optical character recognition..."}
                        </p>
                      </div>

                      <div className="max-w-md mx-auto space-y-1.5">
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden border border-border/40">
                          <div
                            className="bg-primary h-full transition-all duration-300 rounded-full"
                            style={{ width: `${progressState?.overallProgress || 10}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                          <span>Progress</span>
                          <span>{progressState?.overallProgress || 10}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* OCR Results Display */}
                  {ocrResult && (
                    <div className="space-y-6 pt-2">
                      {/* Stats Banner */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-card border border-border shadow-sm">
                        <div className="text-center p-2 rounded-lg bg-muted/40">
                          <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">
                            Words Recognized
                          </span>
                          <span className="text-xl font-black text-foreground">
                            {ocrResult.totalWords.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/40">
                          <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">
                            Confidence Score
                          </span>
                          <span
                            className={`text-xl font-black ${
                              ocrResult.averageConfidence >= 85
                                ? "text-emerald-500"
                                : ocrResult.averageConfidence >= 70
                                ? "text-amber-500"
                                : "text-rose-500"
                            }`}
                          >
                            {ocrResult.averageConfidence}%
                          </span>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/40">
                          <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">
                            Pages Processed
                          </span>
                          <span className="text-xl font-black text-foreground">
                            {ocrResult.pages.length}
                          </span>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/40">
                          <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">
                            Status
                          </span>
                          <span className="text-xl font-black text-emerald-500 flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-5 h-5 inline" /> Ready
                          </span>
                        </div>
                      </div>

                      {/* Download & Export Action Bar */}
                      <div className="flex flex-wrap items-center gap-3">
                        {ocrResult.searchablePdfBytes && (
                          <Button
                            onClick={handleDownloadSearchablePdf}
                            size="lg"
                            className="flex-1 min-w-[200px] h-12 rounded-xl font-bold bg-primary text-primary-foreground shadow-md hover:opacity-95"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Searchable PDF
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={handleCopyText}
                          size="lg"
                          className="h-12 rounded-xl font-semibold border-border hover:bg-muted"
                        >
                          {copiedAll ? (
                            <>
                              <Check className="w-4 h-4 mr-2 text-emerald-500" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Text
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleDownloadTxt}
                          size="lg"
                          className="h-12 rounded-xl font-semibold border-border hover:bg-muted"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Download .TXT
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleOpenInEditor}
                          size="lg"
                          className="h-12 rounded-xl font-semibold border-border hover:bg-muted"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open in Editor
                        </Button>
                      </div>

                      {/* View Tabs */}
                      <div className="border border-border rounded-xl overflow-hidden bg-card">
                        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setActiveTab("text")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                activeTab === "text"
                                  ? "bg-background text-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5 inline mr-1" />
                              Full Extracted Text
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTab("pages")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                activeTab === "pages"
                                  ? "bg-background text-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5 inline mr-1" />
                              Page Breakdown ({ocrResult.pages.length})
                            </button>
                          </div>

                          {activeTab === "pages" && (
                            <div className="relative w-40 sm:w-56">
                              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                              <input
                                type="text"
                                placeholder="Search pages..."
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                          )}
                        </div>

                        {/* Tab Content: Full Text */}
                        {activeTab === "text" && (
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>
                                {ocrResult.fullText.length.toLocaleString()} characters •{" "}
                                {ocrResult.totalWords.toLocaleString()} words
                              </span>
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                Ready to copy or paste into AI prompts & documents
                              </span>
                            </div>
                            <textarea
                              readOnly
                              value={ocrResult.fullText}
                              rows={14}
                              className="w-full p-4 rounded-xl border border-border bg-muted/20 font-mono text-xs md:text-sm text-foreground focus:outline-none leading-relaxed resize-y"
                            />
                          </div>
                        )}

                        {/* Tab Content: Page by Page */}
                        {activeTab === "pages" && (
                          <div className="p-4 divide-y divide-border/60 max-h-[600px] overflow-y-auto space-y-4">
                            {filteredPages && filteredPages.length > 0 ? (
                              filteredPages.map((page) => (
                                <div key={page.pageNumber} className="pt-4 first:pt-0 grid grid-cols-1 md:grid-cols-4 gap-4">
                                  {/* Thumbnail & Meta */}
                                  <div className="md:col-span-1 space-y-2">
                                    <div className="aspect-[3/4] bg-muted/30 rounded-lg overflow-hidden border border-border relative flex items-center justify-center">
                                      {page.thumbnailUrl ? (
                                        <img
                                          src={page.thumbnailUrl}
                                          alt={`Page ${page.pageNumber}`}
                                          className="w-full h-full object-contain"
                                        />
                                      ) : (
                                        <FileText className="w-8 h-8 text-muted-foreground/40" />
                                      )}
                                      <span className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold border border-border">
                                        Page {page.pageNumber}
                                      </span>
                                    </div>
                                    <div className="text-[11px] space-y-1 text-muted-foreground">
                                      <div className="flex justify-between">
                                        <span>Words:</span>
                                        <span className="font-semibold text-foreground">{page.wordCount}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Confidence:</span>
                                        <span
                                          className={`font-semibold ${
                                            page.confidence >= 85
                                              ? "text-emerald-500"
                                              : page.confidence >= 70
                                              ? "text-amber-500"
                                              : "text-rose-500"
                                          }`}
                                        >
                                          {page.confidence}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Page Text Snippet */}
                                  <div className="md:col-span-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-foreground">
                                        Page {page.pageNumber} Extracted Text
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          navigator.clipboard.writeText(page.text);
                                          toast.success(`Page ${page.pageNumber} text copied!`);
                                        }}
                                        className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                                      >
                                        <Copy className="w-3 h-3 mr-1" />
                                        Copy Page
                                      </Button>
                                    </div>
                                    <div className="p-3 bg-muted/20 border border-border/70 rounded-lg font-mono text-xs max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                                      {page.text || <span className="italic text-muted-foreground">No text recognized on this page.</span>}
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-center py-8 text-sm text-muted-foreground">
                                No pages match your filter search.
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Run Another PDF Button */}
                      <div className="text-center pt-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setSelectedFile(null);
                            setOcrResult(null);
                            setProgressState(null);
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                          Process Another Document with OCR
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

        {/* How It Works Section */}
        <HowItWorksSection
          badge="Simple 3-Step Process"
          title="How to OCR and Convert PDF to Searchable Text"
          subtitle="Transform unselectable scanned paper into searchable, editable text in three straightforward steps."
          steps={[
            {
              step: "01",
              title: "Upload Scanned Document",
              description: "Select or drag and drop any scanned PDF, receipt, invoice, book scan, or image document directly into the tool.",
              badgeText: "Local client-side parsing",
              badgeIcon: FileUp,
              colorClass: "icon-ocr",
            },
            {
              step: "02",
              title: "Select Language & Run OCR",
              description: "Choose from English, Spanish, French, German, Chinese, and more. Our client-side neural engine identifies letterforms at 2.0x scale.",
              badgeText: "Zero server upload",
              badgeIcon: Languages,
              colorClass: "icon-edit",
            },
            {
              step: "03",
              title: "Download Searchable PDF & Copy",
              description: "Download your newly created Searchable PDF with invisible text layers, export clean .txt, or copy text directly to your clipboard.",
              badgeText: "ISO searchable standard",
              badgeIcon: Download,
              colorClass: "icon-convert",
            },
          ]}
        />

        {/* Why Use Section */}
        <WhyUseSection
          badge="Enterprise Grade Optical Recognition"
          title="Why Use WebToolOcean PDF Studio OCR"
          subtitle="Built for researchers, legal teams, accountants, and students who demand fast, private, and 100% accurate OCR."
          benefits={[
            {
              icon: ShieldCheck,
              title: "100% Client-Side Privacy",
              description: "Your confidential contracts, tax forms, and IDs are processed locally in your browser memory via WebAssembly and never uploaded to remote servers.",
              colorClass: "icon-security",
            },
            {
              icon: Languages,
              title: "Multi-Language Neural Engine",
              description: "Recognize character sets and glyphs across English, Spanish, French, German, Italian, Portuguese, Hindi, Japanese, and Chinese.",
              colorClass: "icon-ocr",
            },
            {
              icon: Search,
              title: "True Searchable PDF Export",
              description: "Generates an invisible text layer embedded directly under original document graphics, making files fully searchable with Ctrl+F / Cmd+F in any reader.",
              colorClass: "icon-edit",
            },
            {
              icon: Copy,
              title: "Instant Clipboard & TXT Export",
              description: "One-click copy all recognized sentences directly to your clipboard for quick pasting into ChatGPT, Word, Notion, or Slack.",
              colorClass: "icon-organize",
            },
            {
              icon: Zap,
              title: "High-Resolution 2.0x Scanning",
              description: "Renders pages with crisp sub-pixel interpolation before OCR analysis to capture small footnotes, serial numbers, and complex typography.",
              colorClass: "icon-compress",
            },
            {
              icon: FileCheck,
              title: "No Limits & Zero Watermarks",
              description: "Completely free without subscription gates, file quantity caps, or watermarks placed on your exported documents.",
              colorClass: "icon-convert",
            },
          ]}
        />

        {/* FAQ Section */}
        <ConsistentFaqSection
          badge="OCR FAQs"
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about optical character recognition, searchable PDFs, and local privacy."
          items={ocrPdfFaq}
        />

        {/* Consistent CTA Section */}
        <ConsistentCtaSection
          title="Ready to make your scanned PDFs searchable?"
          subtitle="Join thousands of users converting scanned documents into searchable, editable text with complete privacy."
          primaryCtaText="OCR Your PDF Now"
          onPrimaryClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            fileInputRef.current?.click();
          }}
          secondaryCtaText="Explore All PDF Tools"
          secondaryCtaLink="/tools"
        />
      </main>

      {/* Full-screen Drag Overlay */}
      {isWindowDragging && (
        <div className="fixed inset-3 sm:inset-4 z-50 rounded-2xl border-2 border-emerald-500 drag-pattern-overlay backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto transition-all animate-in fade-in duration-150 shadow-2xl">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-xl">
            <ScanText className="w-10 h-10 animate-bounce" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">Drop PDF to start OCR</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Release to extract text and convert to searchable PDF</p>
        </div>
      )}

      <ToolWorkspaceModal
        tool={activeToolModal}
        open={Boolean(activeToolModal)}
        onOpenChange={(open) => {
          if (!open) setActiveToolModal(null);
        }}
      />

      <SaasFooter />
    </div>
  );
}
