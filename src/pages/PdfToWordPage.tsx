import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  FileText,
  FileUp,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Layers,
  FileCode,
  FileCheck,
  AlignLeft,
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
import { convertPdfToWord, type PdfWordConversionResult } from "@/lib/pdf-to-word";
import { loadPdfDocument } from "@/lib/pdf-loader";
import { renderAllDocumentThumbnails } from "@/lib/pdf-operations";
import { pdfToWordFaq } from "@/lib/faq-data";
import { type PdfTool } from "@/lib/pdf-tools-data";

export function PdfToWordPage() {
  const navigate = useNavigate();
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
  const [conversionResult, setConversionResult] = useState<PdfWordConversionResult | null>(null);
  const [copied, setCopied] = useState(false);
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

      setSelectedFile({
        file,
        buffer,
        pageCount: pdfDoc.numPages,
      });

      setConversionResult(null);
      setThumbnails({});
      toast.success(`${file.name} ready for conversion.`, { id: toastId });

      // Render page thumbnails asynchronously
      renderAllDocumentThumbnails(buffer, (pageNum, url) => {
        setThumbnails((prev) => ({ ...prev, [pageNum]: url }));
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load PDF file. Please ensure it is not corrupt or encrypted.", { id: toastId });
    }
  }, []);

  // Global window drag & drop listener
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
      setIsDragging(false);
      if (e.dataTransfer?.files?.[0]) {
        handleProcessFile(e.dataTransfer.files[0]);
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
    if (e.dataTransfer?.files?.[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) return;
    setIsConverting(true);
    const toastId = toast.loading("Converting PDF to Word (.docx)...");

    try {
      const result = await convertPdfToWord(selectedFile.buffer, (current, total) => {
        setConversionProgress({ current, total });
      });

      setConversionResult(result);
      toast.success("Document converted to Word successfully!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to convert PDF to Word.", { id: toastId });
    } finally {
      setIsConverting(false);
      setConversionProgress(null);
    }
  };

  const handleDownload = () => {
    if (!conversionResult || !selectedFile) return;
    const url = URL.createObjectURL(conversionResult.docxBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selectedFile.file.name.replace(/\.pdf$/i, "") + ".docx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Word (.docx) downloaded successfully!");
  };

  const handleCopyText = () => {
    if (!conversionResult) return;
    navigator.clipboard.writeText(conversionResult.plainText);
    setCopied(true);
    toast.success("Extracted text copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
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
        {/* Full-width Tool Zone */}
        <section className="relative border-b border-border/30 pdf-hero-bg overflow-hidden">
          {/* Animated Background Icons */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 right-[8%] -translate-y-1/2 opacity-[0.07] animate-float">
              <FileCode className="w-64 h-64 text-brand" strokeWidth={0.6} />
            </div>
            <div className="absolute -top-6 left-[5%] opacity-[0.05] animate-float-1">
              <FileText className="w-48 h-48 text-brand" strokeWidth={0.7} />
            </div>
            <div className="absolute bottom-0 right-[30%] opacity-[0.04] animate-float-2">
              <Layers className="w-36 h-36 text-brand-accent" strokeWidth={0.8} />
            </div>
          </div>

          <div className="container max-w-6xl mx-auto px-4 relative z-10 py-6 md:py-8">
            {/* Header Title */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 leading-tight gradient-brand">
                PDF to Word Converter
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Convert your PDF files to editable DOCX documents with preserved paragraphs, formatting, and tables.
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
                  ${isDragging ? "icon-word scale-110 rotate-6" : "icon-word group-hover:scale-110 group-hover:-rotate-3"}
                `}>
                  <FileCode className="w-12 h-12 text-white drop-shadow-lg" />
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
                >
                  <FileUp className="w-5 h-5 mr-2" />
                  Select PDF File
                </Button>

                {/* Trust Pills */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full border border-border/60">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                    <span>100% Client-Side Privacy</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full border border-border/60">
                    <FileCheck className="w-3.5 h-3.5 text-brand" />
                    <span>Native .docx OpenXML</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full border border-border/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Fully Editable in Word</span>
                  </div>
                </div>
              </div>
            )}

            {/* STATE 2: File Selected & Conversion Workbench */}
            {selectedFile && !conversionResult && (
              <div className="max-w-3xl mx-auto bg-card/90 backdrop-blur-md rounded-2xl border border-border/70 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/60 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg truncate max-w-sm" title={selectedFile.file.name}>
                        {selectedFile.file.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatFileSize(selectedFile.file.size)} • {selectedFile.pageCount} Page{selectedFile.pageCount > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      style={{ borderRadius: "4px" }}
                    >
                      Change File
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleConvert}
                      disabled={isConverting}
                      style={{ borderRadius: "4px" }}
                      className="bg-brand hover:bg-brand-hover text-white font-bold px-6 shadow"
                    >
                      {isConverting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          {conversionProgress
                            ? `Extracting Page ${conversionProgress.current}/${conversionProgress.total}...`
                            : "Converting..."}
                        </>
                      ) : (
                        <>
                          <FileCode className="w-4 h-4 mr-2" />
                          Convert to Word (.docx)
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Page Thumbnails Preview */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Document Pages Preview
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {Array.from({ length: Math.min(selectedFile.pageCount, 6) }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-muted/30 rounded-lg border border-border/60 overflow-hidden flex flex-col items-center p-2 text-center"
                      >
                        <div className="h-28 w-full bg-card rounded flex items-center justify-center overflow-hidden mb-1.5 shadow-sm">
                          {thumbnails[i + 1] ? (
                            <img
                              src={thumbnails[i + 1]}
                              alt={`Page ${i + 1}`}
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <FileText className="w-8 h-8 text-muted-foreground/40 animate-pulse" />
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground">Page {i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STATE 3: Converted Result View */}
            {conversionResult && selectedFile && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-card rounded-3xl border border-border/80 p-8 shadow-xl text-center space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black text-foreground mb-1">
                      Conversion Complete!
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Extracted {conversionResult.totalWords.toLocaleString()} words across {conversionResult.totalParagraphs} paragraphs from {conversionResult.totalPages} pages.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <Button
                      size="lg"
                      onClick={handleDownload}
                      style={{ borderRadius: "4px" }}
                      className="w-full sm:w-auto px-8 py-6 bg-brand hover:bg-brand-hover text-white font-bold shadow-lg"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download Word (.docx)
                    </Button>

                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleCopyText}
                      style={{ borderRadius: "4px" }}
                      className="w-full sm:w-auto px-6 py-6 font-semibold"
                    >
                      {copied ? (
                        <>
                          <Check className="w-5 h-5 mr-2 text-emerald-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5 mr-2 text-brand" />
                          Copy Extracted Text
                        </>
                      )}
                    </Button>

                    <Button
                      size="lg"
                      variant="ghost"
                      onClick={handleReset}
                      style={{ borderRadius: "4px" }}
                      className="w-full sm:w-auto px-4 py-6 text-muted-foreground hover:text-foreground"
                    >
                      Convert Another
                    </Button>
                  </div>
                </div>

                {/* Text Content Preview Card */}
                <div className="bg-card rounded-2xl border border-border/70 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <AlignLeft className="w-4 h-4 text-brand" />
                      <h4 className="font-bold text-foreground text-sm">Extracted Document Preview</h4>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      Showing first {conversionResult.previewParagraphs.length} paragraphs
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-3 p-4 bg-muted/20 rounded-xl border border-border/50 text-xs text-foreground/90 font-mono leading-relaxed select-text">
                    {conversionResult.previewParagraphs.map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Informative Sections */}
        <HowItWorksSection
          title="How to Convert PDF to Word Online"
          subtitle="Extract text, formatting, and paragraphs into a clean Microsoft Word file"
          steps={[
            {
              step: "01",
              title: "Upload PDF",
              description: "Select or drag and drop any PDF document from your device into the dropzone.",
              badgeText: "Client-side PDF load",
              badgeIcon: FileUp,
              colorClass: "icon-compress",
            },
            {
              step: "02",
              title: "Extract Content",
              description: "Our engine parses fonts, coordinates, paragraphs, and structure locally in your browser.",
              badgeText: "Intelligent reconstruction",
              badgeIcon: FileCode,
              colorClass: "icon-edit",
            },
            {
              step: "03",
              title: "Download DOCX",
              description: "Save your native Microsoft Word document (.docx) ready for full editing in Office 365 or Google Docs.",
              badgeText: "Editable DOCX format",
              badgeIcon: Download,
              colorClass: "icon-convert",
            },
          ]}
        />

        <WhyUseSection
          title="Why Convert PDF to Word with PDF Studio?"
          subtitle="Superior text reconstruction without server exposure"
          benefits={[
            {
              icon: ShieldCheck,
              title: "Zero Cloud Uploads",
              description: "Files are processed inside your browser's private memory sandbox with 100% confidentiality.",
              colorClass: "icon-security",
            },
            {
              icon: FileCheck,
              title: "Standard OpenXML DOCX",
              description: "Exported files are native Office OpenXML format, fully compatible with Word, Google Docs, and Pages.",
              colorClass: "icon-edit",
            },
            {
              icon: Zap,
              title: "Instant In-Browser Speed",
              description: "Extract text and paragraphs without waiting in long cloud server queues or subscription gates.",
              colorClass: "icon-compress",
            },
            {
              icon: AlignLeft,
              title: "Smart Paragraph Grouping",
              description: "Intelligently aligns lines and preserves headings and spacing so your text doesn't end up scrambled.",
              colorClass: "icon-organize",
            },
          ]}
        />

        <ConsistentFaqSection
          title="Frequently Asked Questions"
          subtitle="Common questions about converting PDF to Word"
          items={pdfToWordFaq}
        />

        <ConsistentCtaSection
          title="Ready to Convert Your PDF to Word?"
          subtitle="Extract and edit your documents in Microsoft Word instantly with PDF Studio."
          primaryCtaText="Select PDF File"
          onPrimaryClick={() => fileInputRef.current?.click()}
        />
      </main>

      <SaasFooter />

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
