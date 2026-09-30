import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Files,
  FileUp,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  FilePlus,
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
import { mergePdfFiles, getPdfPageCount, renderAllDocumentThumbnails } from "@/lib/pdf-operations";
import { setUploadedPdf } from "@/lib/pdf-store";
import { mergeFaq } from "@/lib/faq-data";
import { type PdfTool } from "@/lib/pdf-tools-data";

interface SelectedPdfItem {
  id: string;
  file: File;
  buffer: ArrayBuffer;
  pageCount: number;
}

export function MergePdfPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const [pdfList, setPdfList] = useState<SelectedPdfItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const dragCounter = useRef(0);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{ current: number; total: number } | null>(null);
  const [mergedPdfBytes, setMergedPdfBytes] = useState<Uint8Array | null>(null);
  const [mergedFileName, setMergedFileName] = useState("merged_document.pdf");
  const [activeToolModal, setActiveToolModal] = useState<PdfTool | null>(null);

  const totalPages = pdfList.reduce((acc, curr) => acc + curr.pageCount, 0);

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

  const processFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );

    if (validFiles.length === 0) {
      toast.error("Please select valid PDF documents.");
      return;
    }

    const toastId = toast.loading(`Loading ${validFiles.length} document(s)...`);

    try {
      const newItems: SelectedPdfItem[] = [];
      for (const file of validFiles) {
        const buffer = await file.arrayBuffer();
        let pageCount = 1;
        try {
          pageCount = await getPdfPageCount(buffer);
        } catch {
          pageCount = 1;
        }

        const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        newItems.push({
          id,
          file,
          buffer,
          pageCount,
        });

        // Asynchronously render first page thumbnail
        renderAllDocumentThumbnails(buffer, (pageNum, url) => {
          if (pageNum === 1) {
            setThumbnails((prev) => ({ ...prev, [id]: url }));
          }
        });
      }

      setPdfList((prev) => [...prev, ...newItems]);
      toast.success(`Loaded ${validFiles.length} PDF(s) successfully`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to read some PDF files.", { id: toastId });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      processFiles(e.dataTransfer.files);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setPdfList((prev) => {
      const copy = [...prev];
      const current = copy[index];
      const prevItem = copy[index - 1];
      if (current && prevItem) {
        copy[index - 1] = current;
        copy[index] = prevItem;
      }
      return copy;
    });
  };

  const moveDown = (index: number) => {
    if (index >= pdfList.length - 1) return;
    setPdfList((prev) => {
      const copy = [...prev];
      const current = copy[index];
      const nextItem = copy[index + 1];
      if (current && nextItem) {
        copy[index + 1] = current;
        copy[index] = nextItem;
      }
      return copy;
    });
  };

  const removeFile = (id: string) => {
    setPdfList((prev) => prev.filter((p) => p.id !== id));
  };

  const handleMerge = async () => {
    if (pdfList.length < 2) {
      toast.error("Please add at least 2 PDF files to merge.");
      return;
    }

    setIsProcessing(true);
    setProcessingProgress({ current: 0, total: pdfList.length });

    try {
      const outputBytes = await mergePdfFiles(
        pdfList.map((item) => ({ name: item.file.name, buffer: item.buffer })),
        (current, total) => {
          setProcessingProgress({ current, total });
        }
      );

      const firstItem = pdfList[0];
      const firstBase = firstItem ? firstItem.file.name.replace(/\.pdf$/i, "") : "documents";
      setMergedFileName(`${firstBase}_merged.pdf`);
      setMergedPdfBytes(outputBytes);
      toast.success("All PDF documents merged successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to merge PDF files.");
    } finally {
      setIsProcessing(false);
      setProcessingProgress(null);
    }
  };

  const handleDownload = () => {
    if (!mergedPdfBytes) return;
    const blob = new Blob([mergedPdfBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = mergedFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Download started!");
  };

  const handleOpenInEditor = () => {
    if (!mergedPdfBytes) return;
    const arrayBuffer = mergedPdfBytes.slice().buffer as ArrayBuffer;
    setUploadedPdf(arrayBuffer, mergedFileName);
    navigate({ to: "/editor", search: { file: mergedFileName } });
  };

  const resetAll = () => {
    setPdfList([]);
    setMergedPdfBytes(null);
    setProcessingProgress(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-brand selection:text-white">
      {/* Hidden file input for initial selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) processFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Hidden file input for adding more files */}
      <input
        ref={addMoreInputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) processFiles(e.target.files);
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
          {/* Continuous floating background icons (customized for Merge PDF) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            {/* Giant Files slow float */}
            <div className="absolute top-1/2 right-[6%] -translate-y-1/2 opacity-[0.06] animate-float">
              <Files className="w-64 h-64 text-brand" strokeWidth={0.6} />
            </div>
            {/* Layers top-left */}
            <div className="absolute -top-4 left-[5%] opacity-[0.05] animate-float-1">
              <Layers className="w-52 h-52 text-brand" strokeWidth={0.7} />
            </div>
            {/* FilePlus bottom-right */}
            <div className="absolute bottom-4 right-[26%] opacity-[0.04] animate-float-2">
              <FilePlus className="w-36 h-36 text-brand-accent" strokeWidth={0.8} />
            </div>
            {/* FileCheck top-right */}
            <div className="absolute top-8 right-[24%] opacity-[0.04] animate-float-1">
              <FileCheck className="w-24 h-24 text-brand-accent" strokeWidth={1} />
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
            {pdfList.length === 0 && !mergedPdfBytes && (
              <div className="py-6 md:py-8 flex flex-col items-center justify-center text-center">
                {/* Page title ABOVE the box */}
                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8 leading-tight gradient-brand">
                  Merge PDF
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
                    <Files className="w-12 h-12 text-white drop-shadow-lg" />
                    <span className="absolute inset-0 rounded-3xl border-2 border-white/25 animate-ping opacity-50" />
                  </div>

                  {/* Heading 1 inside box */}
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1.5">
                    Drop your PDF files here
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
                    Select PDF files
                  </Button>
                </div>
              </div>
            )}

            {/* ── STATE 2 & 3: Reorder Files Workspace / Merge Success ── */}
            {(pdfList.length > 0 || mergedPdfBytes) && (
              <>
                {/* Header Title Section */}
                <div className="text-center max-w-3xl mx-auto mb-10">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-red-500/10 via-brand/10 to-orange-500/10 border border-brand/20 text-brand text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
                    <Files className="w-3.5 h-3.5 text-brand" />
                    <span>PDF Combiner Studio</span>
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                    Merge PDF Files <span className="gradient-brand">Online Free</span>
                  </h1>
                  <p className="mt-3.5 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                    Combine multiple PDF documents into a single organized file in any desired sequence.
                    Processed 100% locally in your web browser with zero waiting queues.
                  </p>
                </div>

                {/* MAIN WORKSPACE CARD */}
                <div className="rounded-3xl border border-border bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden pdf-card-glow relative max-w-4xl mx-auto">
                  <div className="h-1.5 bg-gradient-to-r from-red-600 via-brand to-orange-500" />

                  <div className="p-6 sm:p-10">
                    {/* SUCCESS VIEW */}
                    {mergedPdfBytes ? (
                      <div className="py-8 px-4 text-center max-w-xl mx-auto">
                        <div className="w-20 h-20 rounded-3xl icon-organize flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-500/20">
                          <CheckCircle2 className="w-10 h-10 text-white" />
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                          PDFs Merged Successfully!
                        </h2>
                        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                          Your documents have been unified into a single vector-clean PDF ({totalPages} pages total).
                        </p>

                        <div className="mt-6 p-4 rounded-2xl bg-muted/40 border border-border max-w-md mx-auto flex items-center justify-between text-left gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-14 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                              PDF
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-foreground truncate max-w-[200px]">
                                {mergedFileName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {totalPages} pages • {(mergedPdfBytes.length / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full shrink-0">
                            Ready
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
                            Download Merged PDF
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
                            Merge More
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* FILE LIST & REORDERING VIEW */
                  <div className="space-y-6">
                  {/* Top Bar with actions */}
                  <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border">
                    <div>
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <span>Documents to Merge</span>
                        <span className="px-2 py-0.5 rounded-full bg-brand-soft text-brand text-xs font-bold">
                          {pdfList.length} files
                        </span>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Total {totalPages} pages • Use the arrows to change file order.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addMoreInputRef.current?.click()}
                        className="text-xs font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1 text-brand" />
                        Add More PDFs
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetAll}
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>

                  {/* PDF Items List */}
                  <div className="space-y-3">
                    {pdfList.map((item, index) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between gap-4 transition-all hover:border-brand/40 pdf-card-glow"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Order Index Pill */}
                          <div className="w-8 h-8 rounded-xl bg-muted font-bold text-xs text-foreground flex items-center justify-center shrink-0">
                            #{index + 1}
                          </div>

                          {/* Page Thumbnail */}
                          {thumbnails[item.id] ? (
                            <div className="w-12 h-16 rounded-lg overflow-hidden border border-border shadow-sm bg-white shrink-0">
                              <img src={thumbnails[item.id]} alt="Document thumbnail" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-11 h-14 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm">
                              PDF
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="font-bold text-sm text-foreground truncate max-w-xs sm:max-w-md">
                              {item.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.pageCount} page(s) • {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>

                        {/* Order Reorder Controls & Remove */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveUp(index)}
                            disabled={index === 0}
                            title="Move Up"
                            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => moveDown(index)}
                            disabled={index === pdfList.length - 1}
                            title="Move Down"
                            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => removeFile(item.id)}
                            title="Remove File"
                            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors ml-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Merge Bar */}
                  <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Zero-knowledge client-side merge • Files never leave your browser</span>
                    </div>

                    <Button
                      variant="brand"
                      size="xl"
                      disabled={pdfList.length < 2 || isProcessing}
                      onClick={handleMerge}
                      className="w-full sm:w-auto px-9 py-3.5 font-bold text-base shadow-xl shadow-brand/25 pdf-shine disabled:opacity-50"
                    >
                      <Files className="w-4 h-4 mr-2" />
                      {isProcessing
                        ? processingProgress
                        ? `Merging Document ${processingProgress.current} of ${processingProgress.total}...`
                        : "Merging PDFs..."
                      : `Merge ${pdfList.length} PDFs Now`}
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

        {/* 1. HOW IT WORKS SECTION */}
        <HowItWorksSection
          badge="3-Step Merger"
          title="How to Merge PDF Files Online"
          subtitle="Combine multiple reports, contracts, or presentation slides in three effortless steps."
          steps={[
            {
              step: "01",
              title: "Select Your PDF Files",
              description: "Upload two or more PDF files from your Mac, Windows, iPhone, or Android device.",
              badgeText: "Batch selection supported",
              badgeIcon: FileUp,
              colorClass: "icon-organize",
            },
            {
              step: "02",
              title: "Order Your Pages",
              description: "Use the up and down arrow controls to sequence documents exactly as you desire.",
              badgeText: "Flexible page sequencing",
              badgeIcon: Layers,
              colorClass: "icon-edit",
            },
            {
              step: "03",
              title: "Download Unified File",
              description: "Click Merge to instantly create and download your single consolidated PDF.",
              badgeText: "Instant vector export",
              badgeIcon: Download,
              colorClass: "icon-convert",
            },
          ]}
        />

        {/* 2. WHY USE SECTION */}
        <WhyUseSection
          badge="Enterprise Quality"
          title="Why Choose WebToolOcean to Merge PDFs"
          subtitle="High fidelity rendering, zero server transmission, and unlimited document sizes."
          benefits={[
            {
              icon: ShieldCheck,
              title: "100% In-Browser Privacy",
              description: "Your confidential business contracts and records are merged in local browser memory. Files are never transmitted to external cloud servers.",
              colorClass: "icon-security",
            },
            {
              icon: Zap,
              title: "Lightning-Fast Execution",
              description: "No upload queues or slow cloud processing. Merging documents happens instantly via client-side WebAssembly.",
              colorClass: "icon-convert",
            },
            {
              icon: FileCheck,
              title: "Lossless Vector Output",
              description: "All vector graphics, embedded typography, links, and original form elements are preserved in pristine fidelity.",
              colorClass: "icon-organize",
            },
            {
              icon: Layers,
              title: "Unlimited Combinations",
              description: "Combine as many PDF files as you need with zero paywalls, zero daily restrictions, and no file count caps.",
              colorClass: "icon-edit",
            },
            {
              icon: Lock,
              title: "Standard ISO 32000 Output",
              description: "Produces universally compliant PDF files that open seamlessly in Adobe Acrobat, Apple Preview, and modern web browsers.",
              colorClass: "icon-security",
            },
            {
              icon: Sparkles,
              title: "Zero Watermarks Guaranteed",
              description: "Every merged document is 100% watermark-free and completely ready for professional, legal, or commercial submission.",
              colorClass: "icon-convert",
            },
          ]}
        />

        {/* 3. CONSISTENT FAQ SECTION */}
        <ConsistentFaqSection
          badge="Merge FAQs"
          title="Frequently Asked Questions About Merging PDFs"
          subtitle="Everything you need to know about combining documents, privacy, and file limits."
          items={mergeFaq}
        />

        {/* 4. CONSISTENT CTA BANNER */}
        <ConsistentCtaSection
          title="Ready to Combine Your PDF Documents?"
          subtitle="Combine reports, invoices, and contracts into a unified PDF file right now in your browser."
          primaryCtaText="Select Files to Merge"
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
            if (files && files.length > 0) {
              void processFiles(files);
            }
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="-rotate-12 transform text-brand/80">
              <Layers className="w-9 h-9 stroke-[1.8]" />
            </div>
            <div className="text-brand -mt-2">
              <Files className="w-11 h-11 stroke-[1.8]" />
            </div>
            <div className="rotate-12 transform text-brand/80">
              <FilePlus className="w-9 h-9 stroke-[1.8]" />
            </div>
          </div>
          <p className="text-brand text-lg sm:text-xl font-bold tracking-tight mb-1">
            Drop PDFs to Combine
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
