import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  FileSpreadsheet,
  FileUp,
  Download,
  FileText,
  Table,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Layers,
  FileCheck,
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
import { convertPdfToExcel, type PdfExcelConversionResult } from "@/lib/pdf-to-excel";
import { loadPdfDocument } from "@/lib/pdf-loader";
import { renderAllDocumentThumbnails } from "@/lib/pdf-operations";
import { pdfToExcelFaq } from "@/lib/faq-data";
import { type PdfTool } from "@/lib/pdf-tools-data";

export function PdfToExcelPage() {
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
  const [conversionResult, setConversionResult] = useState<PdfExcelConversionResult | null>(null);
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
      toast.success(`${file.name} ready for table extraction.`, { id: toastId });

      // Render thumbnails asynchronously
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
    const toastId = toast.loading("Extracting tables to Excel (.xlsx)...");

    try {
      const result = await convertPdfToExcel(selectedFile.buffer, (current, total) => {
        setConversionProgress({ current, total });
      });

      setConversionResult(result);
      toast.success("Spreadsheet generated successfully!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to convert PDF to Excel.", { id: toastId });
    } finally {
      setIsConverting(false);
      setConversionProgress(null);
    }
  };

  const handleDownloadXlsx = () => {
    if (!conversionResult || !selectedFile) return;
    const url = URL.createObjectURL(conversionResult.xlsxBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selectedFile.file.name.replace(/\.pdf$/i, "") + ".xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Excel (.xlsx) downloaded successfully!");
  };

  const handleDownloadCsv = () => {
    if (!conversionResult || !selectedFile) return;
    const url = URL.createObjectURL(conversionResult.csvBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selectedFile.file.name.replace(/\.pdf$/i, "") + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV file downloaded successfully!");
  };

  const handleReset = () => {
    setSelectedFile(null);
    setConversionResult(null);
    setThumbnails({});
  };

  const getColLetter = (index: number) => {
    let name = "";
    let temp = index;
    while (temp >= 0) {
      name = String.fromCharCode((temp % 26) + 65) + name;
      temp = Math.floor(temp / 26) - 1;
    }
    return name;
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
              <FileSpreadsheet className="w-64 h-64 text-brand" strokeWidth={0.6} />
            </div>
            <div className="absolute -top-6 left-[5%] opacity-[0.05] animate-float-1">
              <Table className="w-48 h-48 text-brand" strokeWidth={0.7} />
            </div>
            <div className="absolute bottom-0 right-[30%] opacity-[0.04] animate-float-2">
              <Layers className="w-36 h-36 text-brand-accent" strokeWidth={0.8} />
            </div>
          </div>

          <div className="container max-w-6xl mx-auto px-4 relative z-10 py-6 md:py-8">
            {/* Header Title */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 leading-tight gradient-brand">
                PDF to Excel Converter
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Extract tables, statements, invoices, and columnar data from PDF into editable Microsoft Excel (XLSX) and CSV spreadsheets.
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
                  ${isDragging ? "icon-excel scale-110 rotate-6" : "icon-excel group-hover:scale-110 group-hover:-rotate-3"}
                `}>
                  <FileSpreadsheet className="w-12 h-12 text-white drop-shadow-lg" />
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
                    <span>Private & Local</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full border border-border/60">
                    <FileCheck className="w-3.5 h-3.5 text-brand" />
                    <span>Native .xlsx & CSV</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full border border-border/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Smart Column Alignment</span>
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
                      <FileSpreadsheet className="w-7 h-7" />
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
                            ? `Parsing Page ${conversionProgress.current}/${conversionProgress.total}...`
                            : "Extracting Tables..."}
                        </>
                      ) : (
                        <>
                          <Table className="w-4 h-4 mr-2" />
                          Convert to Excel (.xlsx)
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
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-card rounded-3xl border border-border/80 p-8 shadow-xl text-center space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black text-foreground mb-1">
                      Spreadsheet Generated Successfully!
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Extracted {conversionResult.totalRows} rows and {conversionResult.totalCols} columns across {conversionResult.totalPages} pages.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <Button
                      size="lg"
                      onClick={handleDownloadXlsx}
                      style={{ borderRadius: "4px" }}
                      className="w-full sm:w-auto px-8 py-6 bg-brand hover:bg-brand-hover text-white font-bold shadow-lg"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download Excel (.xlsx)
                    </Button>

                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleDownloadCsv}
                      style={{ borderRadius: "4px" }}
                      className="w-full sm:w-auto px-6 py-6 font-semibold"
                    >
                      <Download className="w-5 h-5 mr-2 text-brand" />
                      Download CSV (.csv)
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

                {/* Interactive Spreadsheet Grid Preview */}
                <div className="bg-card rounded-2xl border border-border/70 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <Table className="w-4 h-4 text-brand" />
                      <h4 className="font-bold text-foreground text-sm">Spreadsheet Preview</h4>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      Showing first {conversionResult.previewRows.length} rows
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-border/60 rounded-xl bg-background shadow-inner max-h-80">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/80 text-muted-foreground border-b border-border">
                          <th className="w-12 px-3 py-2 font-bold text-center border-r border-border bg-muted/90">
                            #
                          </th>
                          {Array.from({ length: conversionResult.totalCols }).map((_, c) => (
                            <th key={c} className="px-4 py-2 font-bold border-r border-border min-w-[120px]">
                              {getColLetter(c)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {conversionResult.previewRows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-3 py-2 text-center font-bold text-muted-foreground bg-muted/40 border-r border-border">
                              {rIdx + 1}
                            </td>
                            {Array.from({ length: conversionResult.totalCols }).map((_, cIdx) => (
                              <td
                                key={cIdx}
                                className="px-4 py-2 border-r border-border/50 truncate max-w-[200px]"
                                title={row[cIdx] || ""}
                              >
                                {row[cIdx] || ""}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Informative Sections */}
        <HowItWorksSection
          title="How to Convert PDF to Excel Online"
          subtitle="Extract structured tables and data into Microsoft Excel spreadsheets in three easy steps"
          steps={[
            {
              step: "01",
              title: "Upload PDF",
              description: "Drag and drop any financial statement, invoice, or tabular PDF file into the uploader.",
              badgeText: "Client-side parsing",
              badgeIcon: FileUp,
              colorClass: "icon-compress",
            },
            {
              step: "02",
              title: "Analyze Grid",
              description: "Our engine detects rows, columns, and numeric formats right inside your browser.",
              badgeText: "Smart alignment",
              badgeIcon: Table,
              colorClass: "icon-edit",
            },
            {
              step: "03",
              title: "Download Spreadsheet",
              description: "Export your table as an Excel workbook (.xlsx) or CSV file with 100% calculation-ready cells.",
              badgeText: "Native XLSX & CSV",
              badgeIcon: Download,
              colorClass: "icon-convert",
            },
          ]}
        />

        <WhyUseSection
          title="Why Convert PDF to Excel with PDF Studio?"
          subtitle="Accurate columnar detection without exposing confidential numbers"
          benefits={[
            {
              icon: ShieldCheck,
              title: "Strict Local Privacy",
              description: "Accounting files and banking statements are processed locally without cloud server transmission.",
              colorClass: "icon-security",
            },
            {
              icon: FileCheck,
              title: "Native OpenXML XLSX",
              description: "Outputs standard .xlsx spreadsheets compatible with Excel, Google Sheets, and LibreOffice Calc.",
              colorClass: "icon-edit",
            },
            {
              icon: Zap,
              title: "Smart Numeric Parsing",
              description: "Automatically formats numbers into numeric types so SUM and formula calculations work instantly.",
              colorClass: "icon-compress",
            },
            {
              icon: Table,
              title: "Instant Live Preview",
              description: "Review your extracted grid and column alignments in an interactive spreadsheet before downloading.",
              colorClass: "icon-organize",
            },
          ]}
        />

        <ConsistentFaqSection
          title="Frequently Asked Questions"
          subtitle="Answers to common questions regarding PDF to Excel conversion"
          items={pdfToExcelFaq}
        />

        <ConsistentCtaSection
          title="Ready to Convert Your PDF Tables to Excel?"
          subtitle="Transform your documents into calculation-ready spreadsheets in seconds."
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
