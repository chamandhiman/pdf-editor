import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowUpDown,
  FileUp,
  Download,
  Eye,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  SlidersHorizontal,
  FolderOpen,
  ArrowLeftRight,
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
import { reorderPdfPages, getPdfPageCount, renderPageThumbnail } from "@/lib/pdf-operations";
import { setUploadedPdf } from "@/lib/pdf-store";
import { reorderPagesFaq } from "@/lib/faq-data";
import { type PdfTool } from "@/lib/pdf-tools-data";

export function ReorderPdfPagesPage() {
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
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{ current: number; total: number } | null>(null);
  const [resultPdfBytes, setResultPdfBytes] = useState<Uint8Array | null>(null);
  const [activeToolModal, setActiveToolModal] = useState<PdfTool | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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

      const initialOrder = Array.from({ length: count }, (_, i) => i + 1);
      setPageOrder(initialOrder);
      setResultPdfBytes(null);
      setThumbnails({});

      toast.success(`Loaded document with ${count} page(s)`, { id: toastId });

      // Lazily load thumbnails for preview (up to 36 pages)
      const maxThumbnails = Math.min(count, 36);
      for (let p = 1; p <= maxThumbnails; p++) {
        renderPageThumbnail(buffer, p, 150)
          .then((thumb) => {
            setThumbnails((prev) => ({ ...prev, [p]: thumb }));
          })
          .catch(() => {
            // Ignore fallback gracefully
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

  const moveLeft = (index: number) => {
    if (index === 0) return;
    setPageOrder((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1]!;
      copy[index - 1] = copy[index]!;
      copy[index] = temp;
      return copy;
    });
  };

  const moveRight = (index: number) => {
    if (index >= pageOrder.length - 1) return;
    setPageOrder((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1]!;
      copy[index + 1] = copy[index]!;
      copy[index] = temp;
      return copy;
    });
  };

  const reverseOrder = () => {
    setPageOrder((prev) => [...prev].reverse());
    toast.info("Reversed page order.");
  };

  const resetOrder = () => {
    if (!selectedFile) return;
    const initial = Array.from({ length: selectedFile.pageCount }, (_, i) => i + 1);
    setPageOrder(initial);
    toast.info("Reset to original page order.");
  };

  // Drag and drop sorting handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setPageOrder((prev) => {
      const copy = [...prev];
      const [draggedItem] = copy.splice(draggedIndex, 1);
      if (draggedItem !== undefined) {
        copy.splice(index, 0, draggedItem);
      }
      return copy;
    });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSaveReordered = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProcessingProgress({ current: 0, total: pageOrder.length });

    try {
      const { bytes } = await reorderPdfPages(
        selectedFile.buffer,
        pageOrder,
        (current, total) => {
          setProcessingProgress({ current, total });
        }
      );

      setResultPdfBytes(bytes);
      toast.success("PDF pages reordered successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to reorder PDF pages.");
    } finally {
      setIsProcessing(false);
      setProcessingProgress(null);
    }
  };

  const handleDownload = () => {
    if (!resultPdfBytes || !selectedFile) return;
    const blob = new Blob([resultPdfBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const baseName = selectedFile.file.name.replace(/\.pdf$/i, "");
    link.href = url;
    link.download = `${baseName}_reordered.pdf`;
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
    const fileName = `${baseName}_reordered.pdf`;
    setUploadedPdf(arrayBuffer, fileName);
    navigate({ to: "/editor", search: { file: fileName } });
  };

  const resetAll = () => {
    setSelectedFile(null);
    setPageOrder([]);
    setThumbnails({});
    setResultPdfBytes(null);
  };

  const isOrderChanged = selectedFile
    ? pageOrder.some((p, i) => p !== i + 1)
    : false;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-brand selection:text-white">
      {/* Hidden file input */}
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
            <div className="absolute top-[8%] left-[6%] animate-float text-brand/[0.07] dark:text-brand/[0.09] transform -rotate-12">
              <ArrowUpDown className="w-24 h-24 sm:w-32 sm:h-32" />
            </div>
            <div className="absolute top-[18%] right-[8%] animate-float-1 text-orange-500/[0.06] dark:text-orange-400/[0.08] transform rotate-12">
              <Layers className="w-20 h-20 sm:w-28 sm:h-28" />
            </div>
            <div className="absolute bottom-[22%] left-[10%] animate-float-2 text-amber-500/[0.06] dark:text-amber-400/[0.08] transform 6">
              <SlidersHorizontal className="w-18 h-18 sm:w-24 sm:h-24" />
            </div>
            <div className="absolute bottom-[10%] right-[12%] animate-float text-brand/[0.06] dark:text-brand/[0.08] transform -rotate-6">
              <FileCheck className="w-20 h-20 sm:w-28 sm:h-28" />
            </div>
            <div className="absolute top-[52%] left-[3%] animate-float-1 text-orange-500/[0.05] dark:text-orange-400/[0.07] transform 12">
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
                  Reorder PDF Pages
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
                        ? "icon-organize scale-110 rotate-6"
                        : "icon-organize group-hover:scale-110 group-hover:-rotate-3"
                      }
                    `}
                  >
                    <ArrowUpDown className="w-12 h-12 text-white drop-shadow-lg" />
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

            {/* ── STATE 2 & 3: Reorder Pages Workspace / Success View ── */}
            {(selectedFile || resultPdfBytes) && (
              <>
                {/* Header Title Section */}
                <div className="text-center max-w-3xl mx-auto mb-10">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-brand/10 via-orange-500/10 to-brand/10 border border-brand/20 text-brand text-xs font-bold uppercase tracking-wider mb-4 shadow-sm animate-pulse">
                    <ArrowUpDown className="w-3.5 h-3.5 text-brand" />
                    <span>Page Organization Studio</span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                    Reorder PDF <span className="bg-gradient-to-r from-brand via-brand to-orange-500 bg-clip-text text-transparent">Pages</span>
                  </h1>
                  <p className="mt-3.5 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Rearrange, invert, or customize page sequence with visual drag-and-drop.
                    Lossless high-speed sorting processed 100% locally in your web browser.
                  </p>
                </div>

                {/* Interactive Workspace Card */}
                <div className="bg-card border border-border/80 rounded-2xl shadow-xl shadow-brand/5 overflow-hidden transition-all mb-6">
                  <div className="h-1.5 bg-gradient-to-r from-brand via-orange-500 to-amber-500" />
                  {resultPdfBytes && selectedFile ? (
                /* SUCCESS / DOWNLOAD SCREEN */
                <div className="p-8 sm:p-14 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-6 shadow-inner">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-foreground">
                    Pages Reordered Successfully!
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                    Your PDF now contains {pageOrder.length} page(s) organized in your custom sequence.
                  </p>

                  <div className="mt-6 p-4 rounded-2xl bg-muted/40 border border-border max-w-md mx-auto flex items-center justify-between text-left">
                    <div className="flex items-center gap-3">
                      {pageOrder[0] && thumbnails[pageOrder[0]] ? (
                        <div className="w-12 h-16 rounded-lg overflow-hidden border border-border shadow-sm bg-white shrink-0">
                          <img src={thumbnails[pageOrder[0]]} alt="Thumbnail" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center font-bold text-xs shrink-0">
                          PDF
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-foreground truncate max-w-[200px]">
                          {selectedFile.file.name.replace(/\.pdf$/i, "")}_reordered.pdf
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pageOrder.length} pages • Organized
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full shrink-0">
                      Ready
                    </span>
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                      variant="brand"
                      size="xl"
                      onClick={handleDownload}
                      className="w-full sm:w-auto font-bold shadow-lg shadow-brand/25 px-8 pdf-shine"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download Reordered PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="xl"
                      onClick={handleOpenInEditor}
                      className="w-full sm:w-auto font-semibold"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Open in PDF Editor
                    </Button>
                  </div>

                <div className="mt-8 pt-6 border-t border-border/60">
                  <Button variant="ghost" size="sm" onClick={resetAll} className="text-muted-foreground hover:text-foreground">
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Reorder Another Document
                  </Button>
                </div>
              </div>
            ) : selectedFile ? (
              /* PAGE REORDERING WORKSPACE */
              <div className="p-6 sm:p-8">
                {/* Top Control Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
                  <div>
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <span>{selectedFile.file.name}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand/10 text-brand font-semibold">
                        {pageOrder.length} pages
                      </span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Drag cards to reorder, or use the arrow buttons.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={reverseOrder}
                      className="text-xs font-semibold"
                      title="Flip entire document order front-to-back"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 mr-1.5" />
                      Reverse All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetOrder}
                      disabled={!isOrderChanged}
                      className="text-xs font-semibold"
                      title="Reset pages back to original order"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      Reset
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-muted-foreground"
                    >
                      Change File
                    </Button>
                  </div>
                </div>

                {/* Page Thumbnails Grid */}
                <div className="py-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {pageOrder.map((origPageNum, index) => {
                      const thumb = thumbnails[origPageNum];
                      const isShifted = origPageNum !== index + 1;

                      return (
                        <div
                          key={`page-${origPageNum}-${index}`}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`relative group bg-muted/20 border rounded-xl p-3 flex flex-col items-center select-none transition-all cursor-grab active:cursor-grabbing ${
                            draggedIndex === index
                              ? "opacity-40 scale-95 border-brand"
                              : "hover:border-brand/70 hover:shadow-md hover:bg-muted/40"
                          } ${isShifted ? "border-brand/40 bg-brand/[0.02]" : "border-border"}`}
                        >
                          {/* Header Sequence Badge */}
                          <div className="w-full flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-foreground px-2 py-0.5 rounded-md bg-background border border-border">
                              #{index + 1}
                            </span>
                            {isShifted && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                Orig: {origPageNum}
                              </span>
                            )}
                          </div>

                          {/* Thumbnail Canvas / Fallback */}
                          <div className="w-full aspect-[1/1.35] bg-white rounded-lg border border-border/80 shadow-sm overflow-hidden flex items-center justify-center relative">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={`Page ${origPageNum}`}
                                className="w-full h-full object-contain pointer-events-none"
                              />
                            ) : (
                              <div className="text-center p-2">
                                <span className="text-xs font-bold text-muted-foreground">
                                  Page {origPageNum}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Bottom Action Arrows */}
                          <div className="mt-3 flex items-center justify-between w-full pt-1.5 border-t border-border/50">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={index === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                moveLeft(index);
                              }}
                              className="h-7 w-7 rounded-md hover:bg-brand/10 hover:text-brand disabled:opacity-20"
                              title="Move page left"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Button>

                            <span className="text-[11px] font-medium text-muted-foreground">
                              {origPageNum}
                            </span>

                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={index === pageOrder.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                moveRight(index);
                              }}
                              className="h-7 w-7 rounded-md hover:bg-brand/10 hover:text-brand disabled:opacity-20"
                              title="Move page right"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Save Action Bar */}
                <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Rearranged losslessly without converting or recompressing</span>
                  </div>

                  <Button
                    variant="brand"
                    size="xl"
                    disabled={isProcessing}
                    onClick={handleSaveReordered}
                    className="w-full sm:w-auto px-8 font-bold shadow-lg shadow-brand/25"
                  >
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    {isProcessing
                      ? processingProgress
                        ? `Saving (${processingProgress.current}/${processingProgress.total})...`
                        : "Reordering PDF..."
                      : "Save Reordered PDF"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
          </>
        )}
        </div>
      </section>

        {/* 1. HOW IT WORKS WORKFLOW */}
        <HowItWorksSection
          badge="Interactive Sorting"
          title="How to Reorder PDF Pages"
          subtitle="Organize document flow easily in three seamless steps directly in your browser."
          steps={[
            {
              step: "01",
              title: "Choose PDF Document",
              description: "Upload your multi-page PDF into the browser workspace for rapid local thumbnail generation.",
              badgeText: "Zero cloud uploads",
              badgeIcon: FileUp,
              colorClass: "icon-security",
            },
            {
              step: "02",
              title: "Drag & Reorder Pages",
              description: "Drag thumbnails into your desired sequence, use arrow controls, or click 'Reverse All' to flip order.",
              badgeText: "Visual thumbnail grid",
              badgeIcon: ArrowUpDown,
              colorClass: "icon-organize",
            },
            {
              step: "03",
              title: "Save & Download",
              description: "Click 'Save Reordered PDF' to compile your new document instantly with 100% lossless fidelity.",
              badgeText: "Instant local export",
              badgeIcon: Download,
              colorClass: "icon-convert",
            },
          ]}
        />

        {/* 2. WHY USE REORDER PDF */}
        <WhyUseSection
          badge="Document Perfection"
          title="Why Reorder PDF Pages with WebToolOcean"
          subtitle="Fast, intuitive, and private document structure management designed for perfectionists."
          benefits={[
            {
              icon: ShieldCheck,
              title: "100% In-Browser Privacy",
              description: "Your confidential documents never leave your computer. Processing occurs entirely in local memory.",
              colorClass: "icon-security",
            },
            {
              icon: Sparkles,
              title: "Lossless Page Assembly",
              description: "Vector fonts, embedded links, bookmarks, and image resolutions are preserved without degradation.",
              colorClass: "icon-edit",
            },
            {
              icon: ArrowLeftRight,
              title: "One-Click Invert / Reverse",
              description: "Instantly flip scanned pages that were fed backwards into your scanner with a single click.",
              colorClass: "icon-organize",
            },
            {
              icon: Layers,
              title: "Unlimited Document Size",
              description: "Organize large presentations, multi-chapter books, and contracts without artificial page caps.",
              colorClass: "icon-compress",
            },
            {
              icon: FileCheck,
              title: "Universal PDF Standard",
              description: "The compiled file is compatible with Adobe Acrobat, Apple Preview, Chrome, Edge, and mobile readers.",
              colorClass: "icon-convert",
            },
            {
              icon: Lock,
              title: "No Watermarks & No Sign-ups",
              description: "Enjoy completely unrestricted document utilities without watermarks, ads, or account requirements.",
              colorClass: "icon-security",
            },
          ]}
        />

        {/* 3. CONSISTENT FAQ ACCORDION */}
        <ConsistentFaqSection
          badge="Reorder FAQs"
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about changing PDF page sequences and reorganizing documents."
          items={reorderPagesFaq}
        />

        {/* 4. FINAL CTA BANNER */}
        <ConsistentCtaSection
          title="Organize Your PDF Pages Perfectly Today"
          subtitle="Fix backwards scans, rearrange presentation slides, and organize multi-page files in seconds."
          primaryCtaText="Reorder PDF Now"
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
            <ArrowUpDown className="w-10 h-10 animate-bounce" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">Drop PDF to reorder pages</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Release to open document and organize page sequence</p>
        </div>
      )}

      {/* Footer */}
      <SaasFooter />

      {/* Tool Modal if user clicked another tool from header */}
      <ToolWorkspaceModal
        tool={activeToolModal}
        open={Boolean(activeToolModal)}
        onOpenChange={(open) => !open && setActiveToolModal(null)}
      />
    </div>
  );
}
