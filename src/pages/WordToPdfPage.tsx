import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  FileText,
  FileUp,
  Download,
  Eye,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Layers,
  FileCheck,
  AlignLeft,
  FileCode,
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
import { convertWordToPdf, type WordToPdfResult } from "@/lib/office-to-pdf";
import { setUploadedPdf } from "@/lib/pdf-store";
import { wordToPdfFaq } from "@/lib/faq-data";
import { type PdfTool } from "@/lib/pdf-tools-data";

export function WordToPdfPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    buffer: ArrayBuffer;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const dragCounter = useRef(0);

  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<{ percent: number; message: string } | null>(null);
  const [conversionResult, setConversionResult] = useState<WordToPdfResult | null>(null);
  const [activeToolModal, setActiveToolModal] = useState<PdfTool | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleProcessFile = useCallback(async (file: File) => {
    const isDocx = file.name.toLowerCase().endsWith(".docx") || file.name.toLowerCase().endsWith(".doc");
    if (!isDocx) {
      toast.error("Please select a valid Word document (.docx).");
      return;
    }

    const toastId = toast.loading(`Reading ${file.name}...`);
    try {
      const buffer = await file.arrayBuffer();
      setSelectedFile({ file, buffer });
      setConversionResult(null);
      toast.success(`${file.name} ready for conversion`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to read Word file.", { id: toastId });
    }
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setIsWindowDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0]) {
      handleProcessFile(files[0]);
    }
  };

  useEffect(() => {
    const handleWindowDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current += 1;
      if (e.dataTransfer?.types.includes("Files")) {
        setIsWindowDragging(true);
      }
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        setIsWindowDragging(false);
        dragCounter.current = 0;
      }
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsWindowDragging(false);
      dragCounter.current = 0;
    };

    window.addEventListener("dragenter", handleWindowDragEnter);
    window.addEventListener("dragleave", handleWindowDragLeave);
    window.addEventListener("drop", handleWindowDrop);

    return () => {
      window.removeEventListener("dragenter", handleWindowDragEnter);
      window.removeEventListener("dragleave", handleWindowDragLeave);
      window.removeEventListener("drop", handleWindowDrop);
    };
  }, []);

  const handleStartConversion = async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    setConversionProgress({ percent: 10, message: "Parsing Word document structure..." });

    try {
      const result = await convertWordToPdf(
        selectedFile.buffer,
        selectedFile.file.name,
        (percent, message) => {
          setConversionProgress({ percent, message });
        }
      );

      setConversionResult(result);
      toast.success("Word document successfully converted to PDF!");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to convert Word to PDF.");
    } finally {
      setIsConverting(false);
      setConversionProgress(null);
    }
  };

  const handleDownloadPdf = () => {
    if (!conversionResult) return;
    const blob = new Blob([conversionResult.bytes.buffer as ArrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = conversionResult.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${conversionResult.fileName}`);
  };

  const handleOpenInEditor = () => {
    if (!conversionResult) return;
    setUploadedPdf(conversionResult.bytes.buffer as ArrayBuffer, conversionResult.fileName);
    navigate({
      to: "/editor",
      search: { file: conversionResult.fileName },
    });
  };

  const handleReset = () => {
    setSelectedFile(null);
    setConversionResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-brand selection:text-white">
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
        className="hidden"
        aria-hidden="true"
        onChange={(e) => {
          if (e.target.files?.[0]) handleProcessFile(e.target.files[0]);
        }}
      />

      <SaasHeader onOpenUploadModal={() => fileInputRef.current?.click()} />

      {/* FULL WINDOW DRAG OVERLAY */}
      {isWindowDragging && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md border-4 border-dashed border-brand flex flex-col items-center justify-center p-6 pointer-events-none animate-in fade-in duration-200"
          role="status"
          aria-live="polite"
        >
          <div className="w-20 h-20 rounded-3xl bg-brand/10 text-brand flex items-center justify-center mb-4 scale-110 transition-transform">
            <FileCode className="w-10 h-10" />
          </div>
          <p className="text-2xl font-bold text-foreground">Drop your Word document (.docx) here</p>
          <p className="text-sm text-muted-foreground mt-2">Convert to PDF instantly with zero server uploads</p>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative border-b border-border/30 pdf-hero-bg overflow-hidden py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-4 border border-blue-500/20">
              <FileCode className="w-3.5 h-3.5" />
              <span>Free Online Document Converter</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground">
              Convert <span className="text-blue-600 dark:text-blue-400">Word</span> to PDF
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform Microsoft Word (.docx) files into clean, standardized, print-ready PDF documents directly in your web browser. 100% private with zero file uploads.
            </p>
          </div>

          {/* MAIN CONVERTER CARD */}
          <div className="max-w-3xl mx-auto">
            {!selectedFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-3xl border-2 border-dashed p-10 sm:p-14 text-center cursor-pointer transition-all duration-300 bg-card/60 backdrop-blur-xl ${
                  isDragging
                    ? "border-blue-500 bg-blue-500/5 scale-[1.01]"
                    : "border-border/80 hover:border-blue-500/60 hover:bg-card/90"
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-5 shadow-xs">
                  <FileCode className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Select Word Document
                </h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                  Drag and drop your DOCX file here, or click to browse from your device
                </p>
                <Button
                  size="lg"
                  className="mt-6 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  Choose DOCX File
                </Button>
                <p className="text-[11px] text-muted-foreground/80 mt-4 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Client-side processing • Files never leave your browser
                </p>
              </div>
            ) : (
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl">
                {/* File Info Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <FileCode className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground truncate max-w-xs sm:max-w-md text-base">
                        {selectedFile.file.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatFileSize(selectedFile.file.size)} • Microsoft Word Document
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="text-xs rounded-xl"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Change Document
                  </Button>
                </div>

                {/* Conversion Status or Ready */}
                {!conversionResult ? (
                  <div className="py-8 text-center space-y-6">
                    {isConverting ? (
                      <div className="space-y-4 max-w-md mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto animate-pulse">
                          <Zap className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {conversionProgress?.message || "Converting Word document..."}
                          </p>
                          <div className="w-full bg-muted rounded-full h-2 mt-3 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                              style={{ width: `${conversionProgress?.percent || 25}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60">
                            <span className="text-[11px] text-muted-foreground block font-medium">Layout Fidelity</span>
                            <span className="text-sm font-bold text-foreground mt-0.5 block">Standard A4</span>
                          </div>
                          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60">
                            <span className="text-[11px] text-muted-foreground block font-medium">Typography</span>
                            <span className="text-sm font-bold text-foreground mt-0.5 block">Embedded Fonts</span>
                          </div>
                          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60">
                            <span className="text-[11px] text-muted-foreground block font-medium">Data Privacy</span>
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">100% In-Browser</span>
                          </div>
                        </div>

                        <Button
                          size="xl"
                          onClick={handleStartConversion}
                          className="w-full sm:w-auto px-8 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Convert to PDF Now
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Success View */
                  <div className="py-8 text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-foreground">
                        Conversion Complete!
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1.5">
                        Generated {conversionResult.pageCount} page PDF ({formatFileSize(conversionResult.bytes.byteLength)})
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Button
                        size="xl"
                        onClick={handleDownloadPdf}
                        className="w-full sm:w-auto px-8 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 cursor-pointer"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF File
                      </Button>

                      <Button
                        variant="outline"
                        size="xl"
                        onClick={handleOpenInEditor}
                        className="w-full sm:w-auto px-6 rounded-xl font-semibold border-border hover:bg-muted cursor-pointer"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Open in PDF Editor
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <HowItWorksSection
        title="How to Convert Word to PDF Online"
        subtitle="Three effortless steps to transform DOCX into clean PDF documents in seconds."
        steps={[
          {
            step: "01",
            title: "Upload Word Document",
            description: "Drag and drop your DOCX file or select it from your device. Processing happens locally.",
            badgeText: "DOCX format",
            badgeIcon: FileText,
            colorClass: "icon-edit",
          },
          {
            step: "02",
            title: "Instant In-Browser Conversion",
            description: "Our client-side engine parses text, headings, bullet lists, and tables into PDF pages.",
            badgeText: "Client-side",
            badgeIcon: Sparkles,
            colorClass: "icon-convert",
          },
          {
            step: "03",
            title: "Download or Edit",
            description: "Save your brand new PDF immediately or open it directly in our online editor to annotate.",
            badgeText: "Instant ready",
            badgeIcon: Download,
            colorClass: "icon-organize",
          },
        ]}
      />

      {/* WHY USE */}
      <WhyUseSection
        title="Why Choose PDF Studio for Word to PDF"
        subtitle="Designed for professionals, students, and businesses who value speed and confidentiality."
        benefits={[
          {
            icon: ShieldCheck,
            title: "100% Client-Side Privacy",
            description: "Your files never leave your device. Document parsing runs strictly in your browser memory.",
            colorClass: "icon-security",
          },
          {
            icon: Zap,
            title: "Zero Queue Latency",
            description: "Instant conversion without waiting on remote server processing queues or file upload limits.",
            colorClass: "icon-compress",
          },
          {
            icon: AlignLeft,
            title: "Headings & Tables Preserved",
            description: "Extracts document headings, bullet points, and data tables with clean A4 layout spacing.",
            colorClass: "icon-edit",
          },
          {
            icon: FileCheck,
            title: "Ready for Editing & Signing",
            description: "Transition straight into our online PDF editor to add electronic signatures or annotations.",
            colorClass: "icon-organize",
          },
        ]}
      />

      {/* FAQS */}
      <ConsistentFaqSection
        badge="Word to PDF FAQs"
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about converting Word documents to PDF."
        items={wordToPdfFaq}
      />

      {/* CTA */}
      <ConsistentCtaSection
        title="Convert More Documents in Seconds"
        subtitle="Explore our full collection of 30+ dedicated PDF tools — all fast, free, and browser-powered."
        primaryCtaText="Launch PDF Studio"
        onPrimaryClick={() => fileInputRef.current?.click()}
        secondaryCtaText="Explore All Tools"
        secondaryCtaLink="/tools"
      />

      <SaasFooter />

      {activeToolModal && (
        <ToolWorkspaceModal
          tool={activeToolModal}
          open={!!activeToolModal}
          onOpenChange={(open) => !open && setActiveToolModal(null)}
        />
      )}
    </div>
  );
}
