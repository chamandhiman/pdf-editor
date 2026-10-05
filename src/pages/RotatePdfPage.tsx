import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  RotateCw,
  RotateCcw,
  FileUp,
  Download,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Lock,
  RefreshCw,
  Eye,
  FileText,
  Sliders,
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
  rotatePdfPages,
  getPdfPageCount,
  renderAllDocumentThumbnails,
} from "@/lib/pdf-operations";
import { setUploadedPdf } from "@/lib/pdf-store";
import { rotatePdfFaq } from "@/lib/faq-data";
import { type PdfTool } from "@/lib/pdf-tools-data";

export function RotatePdfPage() {
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

  // pageNumber (1-indexed) -> additional degrees (0, 90, 180, 270)
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultPdfBytes, setResultPdfBytes] = useState<Uint8Array | null>(null);
  const [activeToolModal, setActiveToolModal] = useState<PdfTool | null>(null);

  // Global window drag listeners
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
      toast.error("Please upload a valid PDF document.");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const count = await getPdfPageCount(buffer);

      if (count === 0) {
        toast.error("This PDF document contains no pages.");
        return;
      }

      setSelectedFile({
        file,
        buffer,
        pageCount: count,
      });
      setRotations({});
      setResultPdfBytes(null);
      setThumbnails({});

      toast.success(`Loaded ${file.name} (${count} ${count === 1 ? "page" : "pages"})`);

      // Asynchronously render thumbnails
      renderAllDocumentThumbnails(buffer, (pageNum, url) => {
        setThumbnails((prev) => ({ ...prev, [pageNum]: url }));
      }).catch((err) => {
        console.warn("Failed to generate some thumbnails:", err);
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to parse PDF document.");
    }
  };

  const handleRotatePage = (pageNum: number, delta: number) => {
    setRotations((prev) => {
      const current = prev[pageNum] || 0;
      const next = ((current + delta) % 360 + 360) % 360;
      return { ...prev, [pageNum]: next };
    });
    setResultPdfBytes(null);
  };

  const handleRotateAll = (delta: number) => {
    if (!selectedFile) return;
    setRotations((prev) => {
      const updated: Record<number, number> = {};
      for (let p = 1; p <= selectedFile.pageCount; p++) {
        const current = prev[p] || 0;
        updated[p] = ((current + delta) % 360 + 360) % 360;
      }
      return updated;
    });
    setResultPdfBytes(null);
  };

  const handleResetRotations = () => {
    setRotations({});
    setResultPdfBytes(null);
  };

  const handleApplyRotation = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const rotatedBytes = await rotatePdfPages(selectedFile.buffer, rotations);
      setResultPdfBytes(rotatedBytes);
      toast.success("All page rotations successfully applied!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to apply page rotations.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultPdfBytes || !selectedFile) return;
    const blob = new Blob([resultPdfBytes as any], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const base = selectedFile.file.name.replace(/\.pdf$/i, "");
    a.href = url;
    a.download = `${base}_rotated.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Rotated PDF downloaded successfully!");
  };

  const handleOpenInEditor = () => {
    if (!resultPdfBytes || !selectedFile) return;
    const fileName = `${selectedFile.file.name.replace(/\.pdf$/i, "")}_rotated.pdf`;
    setUploadedPdf(resultPdfBytes.buffer as ArrayBuffer, fileName);
    navigate({
      to: "/editor",
      search: { file: fileName },
    });
  };

  const hasRotations = Object.values(rotations).some((r) => r !== 0);

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-brand/10 selection:text-brand">
      <SaasHeader onSelectTool={setActiveToolModal} />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-brand-soft/20 via-background to-background py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-soft border border-brand/20 text-brand text-xs font-semibold uppercase tracking-wider mb-5">
            <RotateCw className="w-3.5 h-3.5 animate-spin-slow" />
            <span>Lossless Page Orientation</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto">
            Rotate PDF <span className="text-brand">Pages Online</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Rotate single pages, scanned landscape sheets, or the entire document 90°, 180°, or 270°. 
            Completely private and processed directly in your browser.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              100% Client-Side Private
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand" />
              Zero Quality Loss
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              Instant Browser Processing
            </span>
          </div>
        </div>
      </section>

      {/* MAIN WORKSPACE */}
      <section className="flex-1 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {!selectedFile ? (
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleProcessFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 max-w-2xl mx-auto ${
              isDragging
                ? "border-brand bg-brand-soft/30 scale-[1.01]"
                : "border-border hover:border-brand/50 hover:bg-muted/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleProcessFile(file);
              }}
            />

            <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-4">
              <FileUp className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-foreground mb-2">
              Select or Drop PDF File
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Drop your PDF here to view page previews and rotate orientation
            </p>

            <Button
              type="button"
              className="bg-brand text-brand-foreground hover:bg-brand/90 px-6 py-2.5 rounded-xl font-semibold shadow-md"
            >
              Choose PDF Document
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* TOOLBAR */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground truncate max-w-xs sm:max-w-md">
                    {selectedFile.file.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {selectedFile.pageCount} {selectedFile.pageCount === 1 ? "page" : "pages"} loaded
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRotateAll(90)}
                  className="gap-1.5 text-xs rounded-xl"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Rotate All (+90°)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRotateAll(-90)}
                  className="gap-1.5 text-xs rounded-xl"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Rotate All (-90°)
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetRotations}
                  disabled={!hasRotations}
                  className="text-xs rounded-xl text-muted-foreground"
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setResultPdfBytes(null);
                    setRotations({});
                  }}
                  className="text-xs rounded-xl text-destructive hover:bg-destructive/10"
                >
                  Change File
                </Button>
              </div>
            </div>

            {/* PAGE THUMBNAILS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: selectedFile.pageCount }, (_, i) => i + 1).map((pageNum) => {
                const deg = rotations[pageNum] || 0;
                const thumb = thumbnails[pageNum];

                return (
                  <div
                    key={pageNum}
                    className="group relative bg-card border border-border/80 rounded-2xl p-3 flex flex-col items-center shadow-xs hover:border-brand/50 transition-all"
                  >
                    <div className="w-full aspect-[3/4] bg-muted/30 rounded-xl overflow-hidden flex items-center justify-center relative p-2">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={`Page ${pageNum}`}
                          className="max-h-full max-w-full object-contain shadow-xs transition-transform duration-300"
                          style={{ transform: `rotate(${deg}deg)` }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground gap-1">
                          <RefreshCw className="w-4 h-4 animate-spin text-brand" />
                          <span className="text-[10px]">Loading...</span>
                        </div>
                      )}

                      {deg !== 0 && (
                        <span className="absolute top-2 right-2 bg-brand text-brand-foreground text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                          {deg}°
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between w-full text-xs">
                      <span className="font-semibold text-muted-foreground">
                        Page {pageNum}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleRotatePage(pageNum, -90)}
                          title="Rotate 90° Left"
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRotatePage(pageNum, 90)}
                          title="Rotate 90° Right"
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ACTION BANNER */}
            <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-foreground">
                  Ready to Apply Rotations?
                </h4>
                <p className="text-sm text-muted-foreground">
                  {hasRotations
                    ? "Changes made to page angles. Click below to generate your updated PDF."
                    : "No pages rotated yet. Rotate individual pages or use 'Rotate All'."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {!resultPdfBytes ? (
                  <Button
                    type="button"
                    onClick={handleApplyRotation}
                    disabled={isProcessing}
                    className="bg-brand text-brand-foreground hover:bg-brand/90 px-6 py-2.5 rounded-xl font-bold shadow-md gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Saving PDF...
                      </>
                    ) : (
                      <>
                        <RotateCw className="w-4 h-4" />
                        Save Rotated PDF
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      onClick={handleDownload}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleOpenInEditor}
                      className="rounded-xl gap-2 font-semibold"
                    >
                      <Eye className="w-4 h-4 text-brand" />
                      Open in PDF Editor
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <HowItWorksSection
        title="How to Rotate PDF Pages Online"
        subtitle="Effortlessly reorient scanned or landscape pages in three quick steps."
        steps={[
          {
            step: "01",
            title: "Upload Your PDF",
            description: "Drag and drop any PDF file. Thumbnails load instantly with zero server uploads.",
            badgeText: "Private & Safe",
            badgeIcon: FileUp,
            colorClass: "icon-edit",
          },
          {
            step: "02",
            title: "Rotate Single or All Pages",
            description: "Rotate specific pages with the hover buttons or rotate the entire document 90° clockwise.",
            badgeText: "Visual Controls",
            badgeIcon: RotateCw,
            colorClass: "icon-convert",
          },
          {
            step: "03",
            title: "Download Rotated PDF",
            description: "Export your perfectly oriented PDF file instantly or open it directly in PDF Studio.",
            badgeText: "Lossless Export",
            badgeIcon: Download,
            colorClass: "icon-organize",
          },
        ]}
      />

      {/* WHY USE */}
      <WhyUseSection
        title="Why Choose PDF Studio to Rotate PDFs"
        subtitle="Client-side performance, complete privacy, and zero degradation of original document vectors."
        benefits={[
          {
            icon: ShieldCheck,
            title: "100% Client-Side Privacy",
            description: "Your confidential PDF files never leave your device. All rotation metadata runs in your browser.",
            colorClass: "icon-security",
          },
          {
            icon: Zap,
            title: "Lossless Quality",
            description: "Rotates page viewport boxes without rasterizing text, altering fonts, or recompressing embedded graphics.",
            colorClass: "icon-compress",
          },
          {
            icon: Sliders,
            title: "Flexible Page Control",
            description: "Reorient upside-down scans individually or apply bulk 90° and 180° rotations across the entire document.",
            colorClass: "icon-edit",
          },
          {
            icon: CheckCircle2,
            title: "Full PDF 2.0 & ISO Standard",
            description: "Outputs standardized PDFs compatible with Adobe Acrobat, Apple Preview, Google Chrome, and print drivers.",
            colorClass: "icon-organize",
          },
        ]}
      />

      {/* FAQS */}
      <ConsistentFaqSection
        title="Frequently Asked Questions About Rotating PDFs"
        subtitle="Learn more about rotation fidelity, supported orientations, and data privacy."
        items={rotatePdfFaq}
      />

      {/* CTA */}
      <ConsistentCtaSection
        title="Need to Do More with Your Documents?"
        subtitle="Edit text, compress file sizes, convert formats, or sign documents right here in your browser."
        primaryCtaText="Explore All Tools"
        primaryCtaLink="/tools"
        secondaryCtaText="Open Full PDF Editor"
        secondaryCtaLink="/editor"
      />

      <SaasFooter onSelectTool={setActiveToolModal} />

      {activeToolModal && (
        <ToolWorkspaceModal
          tool={activeToolModal}
          isOpen={!!activeToolModal}
          onClose={() => setActiveToolModal(null)}
        />
      )}
    </div>
  );
}
