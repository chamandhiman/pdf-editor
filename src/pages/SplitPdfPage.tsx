import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Split,
  Scissors,
  FileUp,
  Download,
  Archive,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Lock,
  Layers,
  FileCheck,
  RefreshCw,
  Eye,
  FileText,
  Image as LucideImage,
  Folder,
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
  splitPdfFile,
  bundleFilesIntoZip,
  getPdfPageCount,
  renderAllDocumentThumbnails,
  type SplitFileResult,
} from "@/lib/pdf-operations";
import { setUploadedPdf } from "@/lib/pdf-store";
import { splitFaq } from "@/lib/faq-data";
import { type PdfTool } from "@/lib/pdf-tools-data";

export function SplitPdfPage() {
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

  const [splitMode, setSplitMode] = useState<"ranges" | "each">("ranges");
  const [rangeInput, setRangeInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{ current: number; total: number } | null>(null);
  const [splitResults, setSplitResults] = useState<SplitFileResult[] | null>(null);
  const [activeToolModal, setActiveToolModal] = useState<PdfTool | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});

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
      const count = await getPdfPageCount(buffer);

      setSelectedFile({
        file,
        buffer,
        pageCount: count,
      });

      // Default range: e.g. "1-2, 3-count" or "1"
      if (count > 2) {
        setRangeInput(`1-${Math.ceil(count / 2)}, ${Math.ceil(count / 2) + 1}-${count}`);
      } else {
        setRangeInput(`1-${count}`);
      }

      setSplitResults(null);
      setThumbnails({});
      toast.success(`Loaded document with ${count} page(s)`, { id: toastId });

      renderAllDocumentThumbnails(buffer, (pageNum, url) => {
        setThumbnails((prev) => ({ ...prev, [pageNum]: url }));
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to read PDF document.", { id: toastId });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleSplit = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProcessingProgress({ current: 0, total: selectedFile.pageCount });

    try {
      const results = await splitPdfFile(
        selectedFile.buffer,
        selectedFile.file.name,
        {
          mode: splitMode,
          ranges: rangeInput,
        },
        (current, total) => {
          setProcessingProgress({ current, total });
        }
      );

      setSplitResults(results);
      toast.success(`Generated ${results.length} split PDF file(s)!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to split PDF.");
    } finally {
      setIsProcessing(false);
      setProcessingProgress(null);
    }
  };

  const downloadSingle = (file: SplitFileResult) => {
    const blob = new Blob([file.bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${file.name}`);
  };

  const downloadAllZip = async () => {
    if (!splitResults || splitResults.length === 0) return;
    const toastId = toast.loading("Compressing files into ZIP archive...");
    try {
      const baseName = selectedFile ? selectedFile.file.name.replace(/\.pdf$/i, "") : "split_documents";
      const { blob, filename } = await bundleFilesIntoZip(splitResults, `${baseName}_split.zip`);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("ZIP archive downloaded!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create ZIP package.", { id: toastId });
    }
  };

  const openInEditor = (file: SplitFileResult) => {
    const arrayBuffer = file.bytes.slice().buffer as ArrayBuffer;
    setUploadedPdf(arrayBuffer, file.name);
    navigate({ to: "/editor", search: { file: file.name } });
  };

  const resetAll = () => {
    setSelectedFile(null);
    setSplitResults(null);
    setProcessingProgress(null);
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

      {/* SaaS Header */}
      <SaasHeader
        onOpenUploadModal={() => fileInputRef.current?.click()}
        onSelectTool={(tool) => setActiveToolModal(tool)}
      />

      <main className="flex-1">
        {/* ──────────────── FULL-WIDTH TOOL ZONE ──────────────── */}
        <section className="relative border-b border-border/30 pdf-hero-bg overflow-hidden py-10 md:py-16">
          {/* Continuous floating background icons (customized for Split PDF) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            {/* Giant Split slow float */}
            <div className="absolute top-1/2 right-[6%] -translate-y-1/2 opacity-[0.06] animate-float">
              <Split className="w-64 h-64 text-brand" strokeWidth={0.6} />
            </div>
            {/* Scissors top-left */}
            <div className="absolute -top-4 left-[5%] opacity-[0.05] animate-float-1">
              <Scissors className="w-52 h-52 text-brand" strokeWidth={0.7} />
            </div>
            {/* Layers bottom-right */}
            <div className="absolute bottom-4 right-[26%] opacity-[0.04] animate-float-2">
              <Layers className="w-36 h-36 text-brand-accent" strokeWidth={0.8} />
            </div>
            {/* CheckCircle2 top-right */}
            <div className="absolute top-8 right-[24%] opacity-[0.04] animate-float-1">
              <CheckCircle2 className="w-24 h-24 text-brand-accent" strokeWidth={1} />
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
            {/* ── STATE 1: Upload Dropzone (Empty State) ── */}
            {!selectedFile && !splitResults && (
              <div className="py-6 md:py-8 flex flex-col items-center justify-center text-center">
                {/* Page title ABOVE the box */}
                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8 leading-tight gradient-brand">
                  Split PDF
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
                        ? "icon-convert scale-110 rotate-6"
                        : "icon-convert group-hover:scale-110 group-hover:-rotate-3"
                      }
                    `}
                  >
                    <Split className="w-12 h-12 text-white drop-shadow-lg" />
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
                    Select PDF file
                  </Button>
                </div>
              </div>
            )}

            {/* ── STATE 2 & 3: Configure Split / Split Success ── */}
            {(selectedFile || splitResults) && (
              <>
                {/* Header Title Section */}
                <div className="text-center max-w-3xl mx-auto mb-10">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-red-500/10 via-brand/10 to-orange-500/10 border border-brand/20 text-brand text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
                    <Split className="w-3.5 h-3.5 text-brand" />
                    <span>PDF Splitting & Extraction</span>
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                    Split PDF Files <span className="gradient-brand">Online Free</span>
                  </h1>
                  <p className="mt-3.5 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                    Extract individual pages or separate specific page ranges into new, standalone PDF documents.
                    Fast, secure, and executed 100% locally in your web browser.
                  </p>
                </div>

                {/* MAIN WORKSPACE CARD */}
                <div className="rounded-3xl border border-border bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden pdf-card-glow relative max-w-4xl mx-auto">
                  <div className="h-1.5 bg-gradient-to-r from-red-600 via-brand to-orange-500" />

                  <div className="p-6 sm:p-10">
                    {/* SUCCESS VIEW */}
                    {splitResults ? (
                      <div className="py-6 px-2 text-center max-w-2xl mx-auto">
                        <div className="w-20 h-20 rounded-3xl icon-convert flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/20">
                          <CheckCircle2 className="w-10 h-10 text-white" />
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                          PDF Split Successfully!
                        </h2>
                        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                          Created {splitResults.length} standalone PDF document(s). Download individual files or grab all files as a single ZIP archive.
                        </p>

                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                          <Button
                            variant="brand"
                            size="lg"
                            onClick={downloadAllZip}
                            className="font-bold shadow-lg shadow-brand/20 pdf-shine px-6 py-3"
                          >
                            <Archive className="w-4 h-4 mr-2" />
                            Download All as ZIP ({splitResults.length} files)
                          </Button>

                          <Button
                            variant="outline"
                            size="lg"
                            onClick={resetAll}
                            className="font-semibold"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Split Another PDF
                          </Button>
                        </div>

                        {/* Individual Files List */}
                        <div className="mt-8 space-y-3 text-left">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                            Generated Documents ({splitResults.length})
                          </h4>
                          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                            {splitResults.map((item, idx) => (
                              <div
                                key={idx}
                                className="rounded-xl border border-border bg-muted/30 p-3.5 flex items-center justify-between gap-3 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-lg bg-brand text-white flex items-center justify-center font-bold text-xs shrink-0">
                                    PDF
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-sm text-foreground truncate max-w-xs sm:max-w-md">
                                      {item.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.label} • {item.pageCount} page(s) • {(item.bytes.length / 1024).toFixed(1)} KB
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openInEditor(item)}
                                    title="Edit in PDF Studio"
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadSingle(item)}
                                    className="text-xs font-semibold"
                                  >
                                    <Download className="w-3.5 h-3.5 mr-1 text-brand" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : selectedFile ? (
                      /* SPLIT CONFIGURATION VIEW */
                      <div className="space-y-6">
                  {/* File Info Bar with Cover Thumbnail */}
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative w-12 h-16 rounded-lg bg-white border border-border/80 shadow-sm overflow-hidden shrink-0 flex items-center justify-center">
                        {thumbnails[1] ? (
                          <img
                            src={thumbnails[1]}
                            alt="Cover Page"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-brand/10 text-brand flex items-center justify-center">
                            <FileText className="w-6 h-6 animate-pulse" />
                          </div>
                        )}
                        <span className="absolute bottom-0 inset-x-0 bg-black/65 text-[9px] text-white font-bold text-center py-0.5 tracking-tight">
                          p.1
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-foreground truncate max-w-xs sm:max-w-md">
                          {selectedFile.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {(selectedFile.file.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.pageCount} page(s)
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold"
                    >
                      Change PDF
                    </Button>
                  </div>

                  {/* Mode Tabs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setSplitMode("ranges")}
                      className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                        splitMode === "ranges"
                          ? "border-brand bg-brand-soft/40 shadow-sm ring-2 ring-brand/20"
                          : "border-border bg-card hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2 font-bold text-foreground text-sm">
                        <Layers className="w-4 h-4 text-brand" />
                        <span>Extract Page Ranges</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Split into custom segments (e.g. pages 1-3 into one file, pages 4-8 into another).
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSplitMode("each")}
                      className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                        splitMode === "each"
                          ? "border-brand bg-brand-soft/40 shadow-sm ring-2 ring-brand/20"
                          : "border-border bg-card hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2 font-bold text-foreground text-sm">
                        <FileText className="w-4 h-4 text-brand" />
                        <span>Extract Every Page</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Converts each page of your PDF into an individual, single-page PDF document.
                      </p>
                    </button>
                  </div>

                  {/* Range Input (if mode === 'ranges') */}
                  {splitMode === "ranges" && (
                    <div className="space-y-3 p-5 rounded-2xl border border-border bg-muted/20">
                      <label className="block text-xs font-bold uppercase tracking-wider text-foreground">
                        Specify Page Ranges
                      </label>
                      <input
                        type="text"
                        value={rangeInput}
                        onChange={(e) => setRangeInput(e.target.value)}
                        placeholder={`e.g. 1-2, 3-${selectedFile.pageCount}`}
                        className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
                      />
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-brand" />
                        <span>
                          Separate ranges with commas (e.g. <code>1-3, 5, 8-10</code>). Total pages in document: <strong>{selectedFile.pageCount}</strong>
                        </span>
                      </p>
                    </div>
                  )}

                  {/* ALL PAGES THUMBNAIL GALLERY */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-brand" />
                        Document Pages Preview ({selectedFile.pageCount} page{selectedFile.pageCount === 1 ? "" : "s"})
                      </label>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {Object.keys(thumbnails).length >= selectedFile.pageCount
                          ? `All ${selectedFile.pageCount} pages ready`
                          : `Rendering pages (${Object.keys(thumbnails).length}/${selectedFile.pageCount})...`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 max-h-[340px] overflow-y-auto p-2 rounded-xl border border-border/70 bg-muted/20">
                      {Array.from({ length: selectedFile.pageCount }, (_, i) => i + 1).map((pageNum) => {
                        const thumb = thumbnails[pageNum];
                        return (
                          <div
                            key={pageNum}
                            className="group relative bg-card rounded-xl border border-border/80 hover:border-brand/60 p-2.5 flex flex-col items-center transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 select-none"
                          >
                            <div className="w-full flex items-center justify-between mb-1.5 px-0.5">
                              <span className="text-[11px] font-bold text-foreground px-1.5 py-0.5 rounded bg-muted/80 border border-border/50">
                                Page {pageNum}
                              </span>
                            </div>

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

                  {/* Bottom Action Bar */}
                  <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Zero-knowledge client-side split • 100% private</span>
                    </div>

                    <Button
                      variant="brand"
                      size="xl"
                      disabled={isProcessing}
                      onClick={handleSplit}
                      className="w-full sm:w-auto px-9 py-3.5 font-bold text-base shadow-xl shadow-brand/25 pdf-shine disabled:opacity-50"
                    >
                      <Split className="w-4 h-4 mr-2" />
                      {isProcessing
                        ? processingProgress
                          ? `Splitting ${processingProgress.current} of ${processingProgress.total}...`
                          : "Extracting Pages..."
                        : splitMode === "each"
                        ? `Extract All ${selectedFile.pageCount} Pages`
                        : "Split & Extract PDF"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
            </div>
            </>
          )}
        </div>
      </section>

        {/* 1. HOW IT WORKS SECTION */}
        <HowItWorksSection
          badge="3-Step Extractor"
          title="How to Split a PDF Online"
          subtitle="Extract single pages or custom ranges without uploading confidential files to remote servers."
          steps={[
            {
              step: "01",
              title: "Select Your PDF",
              description: "Upload any PDF file from your computer or mobile device into the secure local workspace.",
              badgeText: "Instant local parsing",
              badgeIcon: FileUp,
              colorClass: "icon-convert",
            },
            {
              step: "02",
              title: "Choose Split Mode",
              description: "Select custom page ranges (e.g. 1-4, 5-8) or choose to extract every page as an individual file.",
              badgeText: "Flexible range syntax",
              badgeIcon: Layers,
              colorClass: "icon-edit",
            },
            {
              step: "03",
              title: "Download Split PDFs",
              description: "Download extracted files individually or grab all documents in a single ZIP bundle.",
              badgeText: "Single or ZIP archive",
              badgeIcon: Download,
              colorClass: "icon-organize",
            },
          ]}
        />

        {/* 2. WHY USE SECTION */}
        <WhyUseSection
          badge="Enterprise Quality"
          title="Why Split PDFs with WebToolOcean"
          subtitle="Client-side performance, granular range controls, and 1-click ZIP bundling."
          benefits={[
            {
              icon: ShieldCheck,
              title: "100% In-Browser Confidentiality",
              description: "Your PDF files are separated in local browser memory. Files are never stored or transmitted to external servers.",
              colorClass: "icon-security",
            },
            {
              icon: Zap,
              title: "Zero Upload Delay",
              description: "Instant processing on documents up to 100 MB. No server transfer delays or slow processing queues.",
              colorClass: "icon-convert",
            },
            {
              icon: Archive,
              title: "1-Click ZIP Packaging",
              description: "When extracting multiple pages, instantly package all generated PDFs into a neat, compressed ZIP archive.",
              colorClass: "icon-organize",
            },
            {
              icon: FileCheck,
              title: "Lossless Document Integrity",
              description: "Extracted pages preserve vector typography, high-resolution imagery, links, and original form styling.",
              colorClass: "icon-edit",
            },
            {
              icon: Lock,
              title: "Standard ISO 32000 Output",
              description: "All generated split files open seamlessly on Adobe Acrobat, Apple Preview, Google Drive, and mobile devices.",
              colorClass: "icon-security",
            },
            {
              icon: Sparkles,
              title: "Completely Free Forever",
              description: "No subscription barriers, no artificial page limits, and zero watermark stamps on extracted pages.",
              colorClass: "icon-convert",
            },
          ]}
        />

        {/* 3. CONSISTENT FAQ SECTION */}
        <ConsistentFaqSection
          badge="Split FAQs"
          title="Frequently Asked Questions About Splitting PDFs"
          subtitle="Everything you need to know about page extraction, ZIP packaging, and browser privacy."
          items={splitFaq}
        />

        {/* 4. CONSISTENT CTA BANNER */}
        <ConsistentCtaSection
          title="Ready to Extract Pages From Your PDF?"
          subtitle="Separate page ranges or extract individual PDF pages directly in your browser now."
          primaryCtaText="Select PDF to Split"
          onPrimaryClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            fileInputRef.current?.click();
          }}
          secondaryCtaText="Explore All PDF Tools"
          secondaryCtaLink="/tools"
        />
      </main>

      {/* Full-Screen Drag & Drop Overlay with Animated Pattern */}
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
              void handleProcessFile(files[0]);
            }
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="-rotate-12 transform text-brand/80">
              <Scissors className="w-9 h-9 stroke-[1.8]" />
            </div>
            <div className="text-brand -mt-2">
              <Split className="w-11 h-11 stroke-[1.8]" />
            </div>
            <div className="rotate-12 transform text-brand/80">
              <Layers className="w-9 h-9 stroke-[1.8]" />
            </div>
          </div>
          <p className="text-brand text-lg sm:text-xl font-bold tracking-tight mb-1">
            Drop PDF to Split & Extract
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Files are processed locally and securely in your browser
          </p>
        </div>
      )}

      {/* Global SaaS Footer */}
      <SaasFooter />

      {/* Interactive Tool Modal if user clicked another tool from header */}
      <ToolWorkspaceModal
        tool={activeToolModal}
        isOpen={Boolean(activeToolModal)}
        onClose={() => setActiveToolModal(null)}
        onOpenEditor={() => fileInputRef.current?.click()}
      />
    </div>
  );
}
