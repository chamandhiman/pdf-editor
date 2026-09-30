import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Trash2,
  FileUp,
  Download,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Lock,
  Layers,
  FileCheck,
  RefreshCw,
  Eye,
  XCircle,
  FileText,
  Check,
  Scissors,
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
import { removePdfPages, getPdfPageCount, renderPageThumbnail } from "@/lib/pdf-operations";
import { setUploadedPdf } from "@/lib/pdf-store";
import { removePagesFaq } from "@/lib/faq-data";
import { type PdfTool } from "@/lib/pdf-tools-data";

export function RemovePdfPagesPage() {
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
  const [markedPages, setMarkedPages] = useState<Set<number>>(new Set());
  const [rangeInputText, setRangeInputText] = useState("");
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultPdfBytes, setResultPdfBytes] = useState<Uint8Array | null>(null);
  const [remainingCount, setRemainingCount] = useState<number>(0);
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

    const toastId = toast.loading(`Loading ${file.name}...`);
    try {
      const buffer = await file.arrayBuffer();
      const count = await getPdfPageCount(buffer);

      setSelectedFile({
        file,
        buffer,
        pageCount: count,
      });

      setMarkedPages(new Set());
      setRangeInputText("");
      setResultPdfBytes(null);
      setThumbnails({});

      toast.success(`Loaded document with ${count} page(s)`, { id: toastId });

      // Lazily load thumbnails for the first batch of pages (up to 24)
      const maxThumbnails = Math.min(count, 24);
      for (let p = 1; p <= maxThumbnails; p++) {
        renderPageThumbnail(buffer, p, 140)
          .then((thumb) => {
            setThumbnails((prev) => ({ ...prev, [p]: thumb }));
          })
          .catch(() => {
            // Ignore thumbnail failure, fallback UI will render
          });
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

  const togglePageMark = (pageNum: number) => {
    setMarkedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) {
        next.delete(pageNum);
      } else {
        if (next.size >= (selectedFile?.pageCount || 1) - 1) {
          toast.error("At least one page must remain in the document.");
          return prev;
        }
        next.add(pageNum);
      }

      // Update text input representation
      const sorted = Array.from(next).sort((a, b) => a - b);
      setRangeInputText(sorted.join(", "));
      return next;
    });
  };

  const handleRangeInputChange = (text: string) => {
    setRangeInputText(text);
    if (!selectedFile) return;

    const parts = text.split(",").map((s) => s.trim()).filter(Boolean);
    const newSet = new Set<number>();

    for (const part of parts) {
      if (part.includes("-")) {
        const [startStr = "", endStr = ""] = part.split("-").map((s) => s.trim());
        const start = Math.max(1, Math.min(parseInt(startStr, 10) || 1, selectedFile.pageCount));
        const end = Math.max(start, Math.min(parseInt(endStr, 10) || selectedFile.pageCount, selectedFile.pageCount));
        for (let i = start; i <= end; i++) {
          newSet.add(i);
        }
      } else {
        const num = parseInt(part, 10);
        if (!isNaN(num) && num >= 1 && num <= selectedFile.pageCount) {
          newSet.add(num);
        }
      }
    }

    if (newSet.size >= selectedFile.pageCount) {
      toast.error("You cannot remove all pages from the PDF.");
      return;
    }

    setMarkedPages(newSet);
  };

  const handleRemovePages = async () => {
    if (!selectedFile) return;
    if (markedPages.size === 0) {
      toast.error("Please click or specify at least one page to delete.");
      return;
    }
    if (markedPages.size >= selectedFile.pageCount) {
      toast.error("At least one page must remain in the final document.");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading(`Removing ${markedPages.size} page(s)...`);

    try {
      const toRemove = Array.from(markedPages);
      const { bytes, remainingCount: remaining } = await removePdfPages(selectedFile.buffer, toRemove);

      setResultPdfBytes(bytes);
      setRemainingCount(remaining);
      toast.success(`Removed ${toRemove.length} page(s) successfully!`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to remove pages.", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultPdfBytes || !selectedFile) return;
    const blob = new Blob([resultPdfBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const baseName = selectedFile.file.name.replace(/\.pdf$/i, "");
    link.href = url;
    link.download = `${baseName}_cleaned.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Download started!");
  };

  const handleOpenInEditor = () => {
    if (!resultPdfBytes || !selectedFile) return;
    const arrayBuffer = resultPdfBytes.slice().buffer as ArrayBuffer;
    const baseName = selectedFile.file.name.replace(/\.pdf$/i, "");
    const fileName = `${baseName}_cleaned.pdf`;
    setUploadedPdf(arrayBuffer, fileName);
    navigate({ to: "/editor", search: { file: fileName } });
  };

  const resetAll = () => {
    setSelectedFile(null);
    setMarkedPages(new Set());
    setRangeInputText("");
    setResultPdfBytes(null);
    setThumbnails({});
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
        {/* Unified Hero & Main Tool Workspace */}
        <section className="relative border-b border-border/30 pdf-hero-bg overflow-hidden py-10 md:py-16">
          {/* Continuous floating background icons */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            <div className="absolute top-[8%] left-[6%] animate-float text-red-500/[0.07] dark:text-red-400/[0.09] transform -rotate-12">
              <Trash2 className="w-24 h-24 sm:w-32 sm:h-32" />
            </div>
            <div className="absolute top-[18%] right-[8%] animate-float-1 text-orange-500/[0.06] dark:text-orange-400/[0.08] transform rotate-12">
              <Scissors className="w-20 h-20 sm:w-28 sm:h-28" />
            </div>
            <div className="absolute bottom-[22%] left-[10%] animate-float-2 text-rose-500/[0.06] dark:text-rose-400/[0.08] transform 6">
              <Layers className="w-18 h-18 sm:w-24 sm:h-24" />
            </div>
            <div className="absolute bottom-[10%] right-[12%] animate-float text-red-500/[0.06] dark:text-red-400/[0.08] transform -rotate-6">
              <FileText className="w-20 h-20 sm:w-28 sm:h-28" />
            </div>
            <div className="absolute top-[52%] left-[3%] animate-float-1 text-brand/[0.05] dark:text-brand/[0.07] transform 12">
              <CheckCircle2 className="w-16 h-16 sm:w-20 sm:h-20" />
            </div>
          </div>

          {/* Ambient radial glow */}
          <div
            className="absolute inset-0 pointer-events-none -z-10"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 70% 60% at 50% 0%, oklch(0.72 0.175 65 / 0.08) 0%, transparent 65%), radial-gradient(circle at 85% 60%, oklch(0.55 0.24 22 / 0.06) 0%, transparent 45%)",
            }}
          />

          <div className="container max-w-5xl mx-auto px-4 relative z-10">
            {/* ── STATE 1: Upload Dropzone (Empty State) ── */}
            {!selectedFile && !resultPdfBytes && (
              <div className="py-6 md:py-8 flex flex-col items-center justify-center text-center">
                {/* Page title ABOVE the box */}
                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8 leading-tight gradient-brand">
                  Remove PDF Pages
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
                        ? "icon-edit scale-110 rotate-6"
                        : "icon-edit group-hover:scale-110 group-hover:-rotate-3"
                      }
                    `}
                  >
                    <Trash2 className="w-12 h-12 text-white drop-shadow-lg" />
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

            {/* ── STATE 2 & 3: Page Selection & Removal Results ── */}
            {(selectedFile || resultPdfBytes) && (
              <>
                {/* Header Title Section */}
                <div className="text-center max-w-3xl mx-auto mb-10">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-red-500/10 via-brand/10 to-orange-500/10 border border-brand/20 text-brand text-xs font-bold uppercase tracking-wider mb-4 shadow-sm animate-pulse">
                    <Trash2 className="w-3.5 h-3.5 text-brand" />
                    <span>PDF Page Removal Studio</span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                    Delete Pages from PDF <span className="bg-gradient-to-r from-brand via-brand to-orange-500 bg-clip-text text-transparent">Online Free</span>
                  </h1>
                  <p className="mt-3.5 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Select and permanently remove unwanted pages, blank sheets, or outdated slides from any PDF.
                    100% private in your browser with zero waiting times.
                  </p>
                </div>

                {/* MAIN WORKSPACE CARD */}
                <div className="rounded-3xl border border-border bg-card shadow-xl overflow-hidden pdf-card-glow relative">
                  <div className="h-1.5 bg-gradient-to-r from-red-600 via-brand to-orange-500" />

                  <div className="p-6 sm:p-10">
                    {/* SUCCESS VIEW */}
                    {resultPdfBytes && selectedFile ? (
                      <div className="py-8 px-4 text-center max-w-xl mx-auto">
                        <div className="w-20 h-20 rounded-3xl icon-edit flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand/20">
                          <CheckCircle2 className="w-10 h-10 text-white" />
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                          Pages Removed Successfully!
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Deleted {markedPages.size} page(s). Your cleaned PDF now contains {remainingCount} page(s).
                        </p>

                        <div className="mt-6 p-4 rounded-2xl bg-muted/40 border border-border max-w-md mx-auto flex items-center justify-between text-left">
                          <div className="flex items-center gap-3">
                            {thumbnails[1] ? (
                              <div className="w-12 h-16 rounded-lg overflow-hidden border border-border shadow-sm bg-white shrink-0">
                                <img src={thumbnails[1]} alt="Thumbnail" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center font-bold text-xs shrink-0">
                                PDF
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-foreground truncate max-w-[200px]">
                                {selectedFile.file.name.replace(/\.pdf$/i, "")}_cleaned.pdf
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {remainingCount} pages remaining • {(resultPdfBytes.length / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full shrink-0">
                            Cleaned
                          </span>
                        </div>

                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                          <Button
                            variant="brand"
                            size="xl"
                            onClick={handleDownload}
                            className="w-full sm:w-auto px-8 py-3.5 font-bold shadow-lg shadow-brand/20 pdf-shine"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Cleaned PDF
                          </Button>

                          <Button
                            variant="outline"
                            size="xl"
                            onClick={handleOpenInEditor}
                            className="w-full sm:w-auto font-semibold"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Open in Editor
                          </Button>

                          <Button
                            variant="ghost"
                            size="xl"
                            onClick={resetAll}
                            className="w-full sm:w-auto text-muted-foreground hover:text-foreground"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Remove More Pages
                          </Button>
                        </div>
                      </div>
                    ) : selectedFile ? (
                  /* PAGE SELECTION VIEW */
                  <div className="space-y-6">
                    {/* File Info Bar */}
                    <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {thumbnails[1] ? (
                          <div className="w-12 h-16 rounded-lg overflow-hidden border border-border shadow-sm bg-white shrink-0">
                            <img src={thumbnails[1]} alt="Thumbnail" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center shrink-0 text-white font-black text-sm shadow-md">
                            PDF
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-sm sm:text-base text-foreground truncate max-w-xs sm:max-w-md">
                            {selectedFile.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {selectedFile.pageCount} pages total • {markedPages.size} marked for removal •{" "}
                            <span className="font-semibold text-foreground">
                              {selectedFile.pageCount - markedPages.size} pages will remain
                            </span>
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

                  {/* Range Input Bar with Quick Helper */}
                  <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Pages to Delete (Click pages below or type numbers)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMarkedPages(new Set());
                          setRangeInputText("");
                        }}
                        className="text-xs text-muted-foreground hover:text-brand transition-colors cursor-pointer"
                      >
                        Reset Selection
                      </button>
                    </div>

                    <input
                      type="text"
                      value={rangeInputText}
                      onChange={(e) => handleRangeInputChange(e.target.value)}
                      placeholder="e.g. 2, 4-6, 9"
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
                    />
                  </div>

                  {/* Grid of Pages */}
                  <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Document Pages (Click any page to toggle deletion)
                      </h4>
                      <span className="text-xs text-brand font-semibold">
                        {markedPages.size} selected for deletion
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 max-h-[460px] overflow-y-auto p-1">
                      {Array.from({ length: selectedFile.pageCount }, (_, i) => i + 1).map((pageNum) => {
                        const isMarked = markedPages.has(pageNum);
                        const thumb = thumbnails[pageNum];

                        return (
                          <div
                            key={pageNum}
                            onClick={() => togglePageMark(pageNum)}
                            className={`group relative rounded-xl border-2 p-2 flex flex-col items-center justify-between text-center transition-all cursor-pointer select-none ${
                              isMarked
                                ? "border-red-500 bg-red-500/10 shadow-md ring-2 ring-red-500/20"
                                : "border-border bg-card hover:border-brand/50 hover:bg-brand-soft/10"
                            }`}
                          >
                            {/* Page Delete Badge */}
                            <div className="absolute top-2 right-2 z-10">
                              {isMarked ? (
                                <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-muted border border-border group-hover:border-brand flex items-center justify-center text-muted-foreground group-hover:text-brand transition-colors">
                                  <Check className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
                                </div>
                              )}
                            </div>

                            {/* Thumbnail or Mockup */}
                            <div className="w-full aspect-[3/4] bg-white rounded-lg border border-border/80 flex items-center justify-center overflow-hidden relative shadow-xs">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt={`Page ${pageNum}`}
                                  className={`w-full h-full object-cover transition-opacity ${
                                    isMarked ? "opacity-35 grayscale" : "opacity-100"
                                  }`}
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-muted-foreground p-2">
                                  <FileText className={`w-8 h-8 ${isMarked ? "text-red-400" : "text-muted-foreground"}`} />
                                  <span className="text-[10px] font-bold mt-1">Page {pageNum}</span>
                                </div>
                              )}

                              {isMarked && (
                                <div className="absolute inset-0 bg-red-600/20 backdrop-blur-[0.5px] flex items-center justify-center">
                                  <span className="text-red-600 font-extrabold text-xs uppercase tracking-wider bg-white/90 px-2 py-0.5 rounded shadow-sm">
                                    Delete
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Page Number Label */}
                            <div className="mt-2 text-xs font-bold text-foreground">
                              <span className={isMarked ? "line-through text-red-500 font-semibold" : ""}>
                                Page {pageNum}
                              </span>
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
                      <span>Executed locally in memory • Instant download</span>
                    </div>

                    <Button
                      variant="brand"
                      size="xl"
                      disabled={markedPages.size === 0 || isProcessing}
                      onClick={handleRemovePages}
                      className="w-full sm:w-auto px-9 py-3.5 font-bold text-base shadow-xl shadow-brand/25 pdf-shine disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isProcessing
                        ? "Removing Selected Pages..."
                        : markedPages.size > 0
                        ? `Remove ${markedPages.size} Page(s)`
                        : "Select Pages to Delete"}
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
          badge="3-Step Deletion"
          title="How to Remove Pages from a PDF"
          subtitle="Delete blank sheets, obsolete sections, and unwanted pages without sending files over the web."
          steps={[
            {
              step: "01",
              title: "Upload Your PDF",
              description: "Drop your PDF into the secure browser editor. Your file is read locally in your device memory.",
              badgeText: "Instant local parsing",
              badgeIcon: FileUp,
              colorClass: "icon-edit",
            },
            {
              step: "02",
              title: "Click Pages to Delete",
              description: "Click thumbnails to mark pages for removal, or type page numbers directly in the input box.",
              badgeText: "Bidirectional selection",
              badgeIcon: Trash2,
              colorClass: "icon-security",
            },
            {
              step: "03",
              title: "Download Cleaned PDF",
              description: "Click Remove Pages to export your updated, perfectly streamlined PDF document.",
              badgeText: "Lossless vector export",
              badgeIcon: Download,
              colorClass: "icon-convert",
            },
          ]}
        />

        {/* 2. WHY USE SECTION */}
        <WhyUseSection
          badge="Enterprise Quality"
          title="Why Delete PDF Pages with WebToolOcean"
          subtitle="Interactive visual thumbnails, zero server uploads, and lossless document fidelity."
          benefits={[
            {
              icon: ShieldCheck,
              title: "100% In-Browser Privacy",
              description: "Documents never touch cloud servers. Page stripping and regeneration execute in local WebAssembly memory.",
              colorClass: "icon-security",
            },
            {
              icon: Zap,
              title: "Instant Zero-Lag Processing",
              description: "No upload queues or file size bottlenecks. Pages are removed and exported in under 500ms.",
              colorClass: "icon-convert",
            },
            {
              icon: Layers,
              title: "Visual Page Grid",
              description: "See visual thumbnails of your document pages so you never accidentally delete the wrong sheet.",
              colorClass: "icon-organize",
            },
            {
              icon: FileCheck,
              title: "Lossless Vector Output",
              description: "Preserves existing hyperlinks, vector artwork, annotations, and original fonts on remaining pages.",
              colorClass: "icon-edit",
            },
            {
              icon: Lock,
              title: "ISO 32000 PDF Standard",
              description: "Generates fully compliant PDF files that open seamlessly in Adobe Acrobat, mobile readers, and browsers.",
              colorClass: "icon-security",
            },
            {
              icon: Sparkles,
              title: "100% Free with No Watermarks",
              description: "Unlimited page removals with zero watermarks, zero subscription locks, and no sign-up requirement.",
              colorClass: "icon-convert",
            },
          ]}
        />

        {/* 3. CONSISTENT FAQ SECTION */}
        <ConsistentFaqSection
          badge="Delete Pages FAQs"
          title="Frequently Asked Questions About Removing PDF Pages"
          subtitle="Clear answers about page deletion, remaining page preservation, and privacy guarantees."
          items={removePagesFaq}
        />

        {/* 4. CONSISTENT CTA BANNER */}
        <ConsistentCtaSection
          title="Ready to Remove Unwanted Pages from Your PDF?"
          subtitle="Delete blank pages or unwanted sections in seconds directly in your web browser."
          primaryCtaText="Select PDF to Delete Pages"
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
        <div className="fixed inset-3 sm:inset-4 z-50 rounded-2xl border-2 border-brand drag-pattern-overlay backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto transition-all animate-in fade-in duration-150 shadow-2xl">
          <div className="w-20 h-20 rounded-2xl bg-brand/20 flex items-center justify-center text-brand mb-4 shadow-xl">
            <Trash2 className="w-10 h-10 animate-bounce" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">Drop PDF to remove pages</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Release to open document and select pages to delete</p>
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
