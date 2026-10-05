import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  FileDown,
  FileUp,
  Download,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Zap,
  RefreshCw,
  Eye,
  FileText,
  Sliders,
  Check,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SaasHeader } from "@/components/saas/SaasHeader";
import { SaasFooter } from "@/components/saas/SaasFooter";
import { HowItWorksSection } from "@/components/saas/HowItWorksSection";
import { WhyUseSection } from "@/components/saas/WhyUseSection";
import { ConsistentFaqSection } from "@/components/saas/ConsistentFaqSection";
import { ConsistentCtaSection } from "@/components/saas/ConsistentCtaSection";
import { ToolWorkspaceModal } from "@/components/saas/ToolWorkspaceModal";
import {
  extractPdfPages,
  getPdfPageCount,
  renderAllDocumentThumbnails,
  parsePageRanges,
} from "@/lib/pdf-operations";
import { setUploadedPdf } from "@/lib/pdf-store";
import { extractPagesFaq } from "@/lib/faq-data";
import { type PdfTool } from "@/lib/pdf-tools-data";

export function ExtractPdfPagesPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    buffer: ArrayBuffer;
    pageCount: number;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [rangeInput, setRangeInput] = useState("");
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultPdfBytes, setResultPdfBytes] = useState<Uint8Array | null>(null);
  const [activeToolModal, setActiveToolModal] = useState<PdfTool | null>(null);

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
      // By default select page 1
      setSelectedPages(new Set([1]));
      setRangeInput("1");
      setResultPdfBytes(null);
      setThumbnails({});

      toast.success(`Loaded ${file.name} (${count} ${count === 1 ? "page" : "pages"})`);

      renderAllDocumentThumbnails(buffer, (pageNum, url) => {
        setThumbnails((prev) => ({ ...prev, [pageNum]: url }));
      }).catch((err) => {
        console.warn("Failed to render some thumbnails:", err);
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to parse PDF document.");
    }
  };

  const togglePage = (pageNum: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) {
        next.delete(pageNum);
      } else {
        next.add(pageNum);
      }
      syncRangeString(next);
      return next;
    });
    setResultPdfBytes(null);
  };

  const syncRangeString = (set: Set<number>) => {
    const sorted = Array.from(set).sort((a, b) => a - b);
    if (sorted.length === 0) {
      setRangeInput("");
      return;
    }
    setRangeInput(sorted.join(", "));
  };

  const handleRangeInputChange = (val: string) => {
    setRangeInput(val);
    if (!selectedFile) return;

    try {
      const ranges = parsePageRanges(val, selectedFile.pageCount);
      const newSet = new Set<number>();
      for (const r of ranges) {
        for (let p = r.start; p <= r.end; p++) {
          newSet.add(p);
        }
      }
      setSelectedPages(newSet);
      setResultPdfBytes(null);
    } catch {
      // ignore while typing
    }
  };

  const handleSelectAll = () => {
    if (!selectedFile) return;
    const all = new Set<number>();
    for (let p = 1; p <= selectedFile.pageCount; p++) all.add(p);
    setSelectedPages(all);
    setRangeInput(`1-${selectedFile.pageCount}`);
    setResultPdfBytes(null);
  };

  const handleDeselectAll = () => {
    setSelectedPages(new Set());
    setRangeInput("");
    setResultPdfBytes(null);
  };

  const handleSelectOdd = () => {
    if (!selectedFile) return;
    const set = new Set<number>();
    for (let p = 1; p <= selectedFile.pageCount; p += 2) set.add(p);
    setSelectedPages(set);
    syncRangeString(set);
    setResultPdfBytes(null);
  };

  const handleSelectEven = () => {
    if (!selectedFile) return;
    const set = new Set<number>();
    for (let p = 2; p <= selectedFile.pageCount; p += 2) set.add(p);
    setSelectedPages(set);
    syncRangeString(set);
    setResultPdfBytes(null);
  };

  const handleExtractPages = async () => {
    if (!selectedFile) return;

    const pageList = Array.from(selectedPages).sort((a, b) => a - b);
    if (pageList.length === 0) {
      toast.error("Please select at least one page to extract.");
      return;
    }

    setIsProcessing(true);
    try {
      const bytes = await extractPdfPages(selectedFile.buffer, pageList);
      setResultPdfBytes(bytes);
      toast.success(`Successfully extracted ${pageList.length} pages!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to extract pages.");
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
    a.download = `${base}_extracted.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Extracted PDF downloaded successfully!");
  };

  const handleOpenInEditor = () => {
    if (!resultPdfBytes || !selectedFile) return;
    const fileName = `${selectedFile.file.name.replace(/\.pdf$/i, "")}_extracted.pdf`;
    setUploadedPdf(resultPdfBytes.buffer as ArrayBuffer, fileName);
    navigate({
      to: "/editor",
      search: { file: fileName },
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-brand/10 selection:text-brand">
      <SaasHeader onSelectTool={setActiveToolModal} />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-brand-soft/20 via-background to-background py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-soft border border-brand/20 text-brand text-xs font-semibold uppercase tracking-wider mb-5">
            <FileDown className="w-3.5 h-3.5" />
            <span>Selective Document Splitting</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto">
            Extract PDF <span className="text-brand">Pages Online</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Select specific pages or ranges to save into a new PDF document. 
            Pick pages visually with high-res thumbnails — completely private and client-side.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              100% Client-Side Private
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand" />
              Visual Page Grid & Custom Ranges
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              Zero Upload Waiting
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
              <FileDown className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-foreground mb-2">
              Select or Drop PDF File
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Drop your document here to choose and extract specific pages
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
                    Selected <strong className="text-brand">{selectedPages.size}</strong> of {selectedFile.pageCount} pages
                  </p>
                </div>
              </div>

              {/* QUICK SELECTION BUTTONS */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs rounded-xl"
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectOdd}
                  className="text-xs rounded-xl"
                >
                  Odd Pages
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectEven}
                  className="text-xs rounded-xl"
                >
                  Even Pages
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAll}
                  className="text-xs rounded-xl text-muted-foreground"
                >
                  Clear Selection
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setResultPdfBytes(null);
                    setSelectedPages(new Set());
                  }}
                  className="text-xs rounded-xl text-destructive hover:bg-destructive/10"
                >
                  Change File
                </Button>
              </div>
            </div>

            {/* RANGE INPUT BAR */}
            <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                Page Range:
              </span>
              <Input
                value={rangeInput}
                onChange={(e) => handleRangeInputChange(e.target.value)}
                placeholder="e.g. 1-3, 5, 7-9"
                className="font-mono text-sm rounded-xl max-w-md"
              />
              <span className="text-xs text-muted-foreground">
                (Click thumbnails below or type comma-separated ranges)
              </span>
            </div>

            {/* THUMBNAIL SELECTION GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: selectedFile.pageCount }, (_, i) => i + 1).map((pageNum) => {
                const isSelected = selectedPages.has(pageNum);
                const thumb = thumbnails[pageNum];

                return (
                  <div
                    key={pageNum}
                    onClick={() => togglePage(pageNum)}
                    className={`group relative bg-card border rounded-2xl p-3 flex flex-col items-center shadow-xs cursor-pointer transition-all ${
                      isSelected
                        ? "border-brand ring-2 ring-brand/30 bg-brand-soft/20 shadow-md scale-[1.02]"
                        : "border-border/80 opacity-60 hover:opacity-100 hover:border-brand/40"
                    }`}
                  >
                    <div className="w-full aspect-[3/4] bg-muted/30 rounded-xl overflow-hidden flex items-center justify-center relative p-2">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={`Page ${pageNum}`}
                          className="max-h-full max-w-full object-contain shadow-xs"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground gap-1">
                          <RefreshCw className="w-4 h-4 animate-spin text-brand" />
                          <span className="text-[10px]">Loading...</span>
                        </div>
                      )}

                      {/* SELECTION BADGE */}
                      <div
                        className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-brand text-brand-foreground"
                            : "bg-background/80 border border-border text-muted-foreground"
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : pageNum}
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between w-full text-xs">
                      <span className="font-semibold text-foreground">
                        Page {pageNum}
                      </span>
                      <span className={`text-[10px] font-bold ${isSelected ? "text-brand" : "text-muted-foreground"}`}>
                        {isSelected ? "Selected" : "Omitted"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ACTION BANNER */}
            <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-foreground">
                  Ready to Extract Selected Pages?
                </h4>
                <p className="text-sm text-muted-foreground">
                  {selectedPages.size > 0
                    ? `Creating a new document containing ${selectedPages.size} selected pages.`
                    : "No pages currently selected. Please select at least one page."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {!resultPdfBytes ? (
                  <Button
                    type="button"
                    onClick={handleExtractPages}
                    disabled={isProcessing || selectedPages.size === 0}
                    className="bg-brand text-brand-foreground hover:bg-brand/90 px-6 py-2.5 rounded-xl font-bold shadow-md gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Extracting Pages...
                      </>
                    ) : (
                      <>
                        <FileDown className="w-4 h-4" />
                        Extract {selectedPages.size} Pages
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
                      Download Extracted PDF
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
        title="How to Extract Pages from a PDF"
        subtitle="Save specific pages into a clean, standalone PDF file in three easy steps."
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
            title: "Select Pages to Keep",
            description: "Click thumbnail cards to select or enter page ranges like '1-3, 5' in the range box.",
            badgeText: "Visual Selection",
            badgeIcon: Sliders,
            colorClass: "icon-convert",
          },
          {
            step: "03",
            title: "Download Extracted File",
            description: "Export your brand new PDF document instantly or open it directly in PDF Studio.",
            badgeText: "Instant Ready",
            badgeIcon: Download,
            colorClass: "icon-organize",
          },
        ]}
      />

      {/* WHY USE */}
      <WhyUseSection
        title="Why Choose PDF Studio to Extract Pages"
        subtitle="Fast, secure, and preserves 100% of fonts, vector shapes, and form layouts."
        benefits={[
          {
            icon: ShieldCheck,
            title: "100% Client-Side Privacy",
            description: "Confidential files never leave your computer. Page extraction occurs inside browser memory.",
            colorClass: "icon-security",
          },
          {
            icon: Zap,
            title: "Zero Quality Loss",
            description: "Direct stream extraction preserves original text selectable fonts and lossless graphics.",
            colorClass: "icon-compress",
          },
          {
            icon: Copy,
            title: "Custom Page Ranges",
            description: "Combine individual pages, even/odd filters, and continuous ranges effortlessly.",
            colorClass: "icon-edit",
          },
          {
            icon: CheckCircle2,
            title: "Preserves Original Document",
            description: "Your original PDF is left completely untouched on your device.",
            colorClass: "icon-organize",
          },
        ]}
      />

      {/* FAQS */}
      <ConsistentFaqSection
        title="Frequently Asked Questions About Extracting PDF Pages"
        subtitle="Learn more about selective page extraction, ranges, and data confidentiality."
        items={extractPagesFaq}
      />

      {/* CTA */}
      <ConsistentCtaSection
        title="Need More PDF Tools?"
        subtitle="Rotate pages, merge files, protect with passwords, or convert formats online."
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
