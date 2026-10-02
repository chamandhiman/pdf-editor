import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  FileImage,
  ImageIcon,
  FileUp,
  Download,
  RotateCw,
  Trash2,
  Plus,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Zap,
  Layers,
  Settings2,
  RefreshCw,
  Eye,
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
  convertImagesToPdf,
  readImageDimensions,
  type ImageItem,
  type ImageToPdfOptions,
} from "@/lib/image-to-pdf";
import { setUploadedPdf } from "@/lib/pdf-store";
import { pngToPdfFaq } from "@/lib/faq-data";
import { type PdfTool } from "@/lib/pdf-tools-data";

export function PngToPdfPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const dragCounter = useRef(0);

  const [options, setOptions] = useState<ImageToPdfOptions>({
    pageSize: "a4",
    orientation: "portrait",
    margin: "none",
  });

  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<{ current: number; total: number } | null>(null);
  const [convertedPdfBytes, setConvertedPdfBytes] = useState<Uint8Array | null>(null);
  const [convertedPdfSize, setConvertedPdfSize] = useState<number>(0);
  const [activeToolModal, setActiveToolModal] = useState<PdfTool | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleAddFiles = useCallback(async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((file) =>
      file.name.toLowerCase().endsWith(".png") || file.type === "image/png"
    );

    if (validFiles.length === 0) {
      toast.error("Please upload PNG image files (.png).");
      return;
    }

    const toastId = toast.loading(`Loading ${validFiles.length} PNG image${validFiles.length > 1 ? "s" : ""}...`);

    try {
      const newItems: ImageItem[] = [];
      for (const file of validFiles) {
        const { width, height, url } = await readImageDimensions(file);
        newItems.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          previewUrl: url,
          rotation: 0,
          width,
          height,
        });
      }

      setImages((prev) => [...prev, ...newItems]);
      setConvertedPdfBytes(null);
      toast.success(`Added ${newItems.length} PNG image${newItems.length > 1 ? "s" : ""}.`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load image files.", { id: toastId });
    }
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setIsWindowDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
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

  const handleRotate = (id: string) => {
    setImages((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, rotation: (item.rotation + 90) % 360 } : item
      )
    );
    setConvertedPdfBytes(null);
  };

  const handleRemove = (id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      const removed = prev.find((item) => item.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return filtered;
    });
    setConvertedPdfBytes(null);
  };

  const handleConvert = async () => {
    if (images.length === 0) return;

    setIsConverting(true);
    setConversionProgress({ current: 0, total: images.length });

    try {
      const pdfBytes = await convertImagesToPdf(images, options, (current, total) => {
        setConversionProgress({ current, total });
      });

      setConvertedPdfBytes(pdfBytes);
      setConvertedPdfSize(pdfBytes.byteLength);
      toast.success("PNG images converted to PDF successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to convert PNG images to PDF.");
    } finally {
      setIsConverting(false);
      setConversionProgress(null);
    }
  };

  const handleDownload = () => {
    if (!convertedPdfBytes) return;
    const blob = new Blob([convertedPdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = images.length === 1 ? `${images[0]!.file.name.replace(/\.[^/.]+$/, "")}.pdf` : "converted_png_images.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("PDF downloaded successfully!");
  };

  const handleOpenInEditor = () => {
    if (!convertedPdfBytes) return;
    const name = images.length === 1 ? `${images[0]!.file.name.replace(/\.[^/.]+$/, "")}.pdf` : "converted_png_images.pdf";
    setUploadedPdf(convertedPdfBytes.buffer as ArrayBuffer, name);
    navigate({
      to: "/editor",
      search: { file: name },
    });
  };

  const handleReset = () => {
    images.forEach((img) => {
      if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
    });
    setImages([]);
    setConvertedPdfBytes(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (addMoreInputRef.current) addMoreInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-brand selection:text-white">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".png,image/png"
        className="hidden"
        aria-hidden="true"
        onChange={(e) => {
          if (e.target.files) handleAddFiles(e.target.files);
        }}
      />
      <input
        ref={addMoreInputRef}
        type="file"
        multiple
        accept=".png,image/png"
        className="hidden"
        aria-hidden="true"
        onChange={(e) => {
          if (e.target.files) handleAddFiles(e.target.files);
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
            <FileImage className="w-10 h-10" />
          </div>
          <p className="text-2xl font-bold text-foreground">Drop your PNG images here</p>
          <p className="text-sm text-muted-foreground mt-2">Convert to PDF with lossless quality</p>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative border-b border-border/30 pdf-hero-bg overflow-hidden py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-semibold mb-4 border border-brand/20">
              <FileImage className="w-3.5 h-3.5" />
              <span>Lossless Graphic Converter</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground">
              Convert <span className="text-brand">PNG</span> to PDF
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform high-resolution PNG images and screenshots into standardized PDF documents. Lossless quality, custom margins, and client-side privacy.
            </p>
          </div>

          {/* MAIN UPLOAD / WORKSPACE */}
          <div className="max-w-4xl mx-auto">
            {images.length === 0 ? (
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
                    ? "border-brand bg-brand/5 scale-[1.01]"
                    : "border-border/80 hover:border-brand/60 hover:bg-card/90"
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-5 shadow-xs">
                  <FileImage className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Select PNG Images
                </h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                  Drag and drop your PNG files here, or click to browse from your device
                </p>
                <Button
                  size="lg"
                  className="mt-6 rounded-xl font-bold bg-[#e5322d] hover:bg-[#c92a26] text-white shadow-md shadow-brand/20 cursor-pointer"
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  Choose PNG Files
                </Button>
                <p className="text-[11px] text-muted-foreground/80 mt-4 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Client-side processing • Lossless graphic quality
                </p>
              </div>
            ) : (
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl">
                {/* Workspace Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {images.length} PNG Image{images.length > 1 ? "s" : ""} Selected
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configure layout options and generate your consolidated PDF
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addMoreInputRef.current?.click()}
                      className="text-xs rounded-xl"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Add More PNGs
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      className="text-xs text-muted-foreground hover:text-destructive rounded-xl"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      Clear All
                    </Button>
                  </div>
                </div>

                {/* Thumbnails Grid */}
                <div className="py-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-[380px] overflow-y-auto p-1">
                    {images.map((item, idx) => (
                      <div
                        key={item.id}
                        className="relative group rounded-2xl border border-border bg-muted/30 p-2.5 flex flex-col items-center"
                      >
                        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-background/80 flex items-center justify-center">
                          <img
                            src={item.previewUrl}
                            alt={item.file.name}
                            className="max-h-full max-w-full object-contain transition-transform"
                            style={{ transform: `rotate(${item.rotation}deg)` }}
                          />
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-[10px] font-bold text-white">
                            {idx + 1}
                          </span>
                        </div>

                        <p className="text-[11px] font-medium text-foreground truncate w-full mt-2 text-center">
                          {item.file.name}
                        </p>

                        <div className="flex items-center gap-1 mt-2">
                          <button
                            type="button"
                            onClick={() => handleRotate(item.id)}
                            aria-label="Rotate image"
                            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(item.id)}
                            aria-label="Remove image"
                            className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conversion Options */}
                <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-foreground block mb-1.5">Page Size</label>
                    <select
                      value={options.pageSize}
                      onChange={(e) => setOptions((prev) => ({ ...prev, pageSize: e.target.value as any }))}
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground"
                    >
                      <option value="a4">A4 (Standard)</option>
                      <option value="letter">US Letter</option>
                      <option value="fit">Fit to Image</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-foreground block mb-1.5">Orientation</label>
                    <select
                      value={options.orientation}
                      onChange={(e) => setOptions((prev) => ({ ...prev, orientation: e.target.value as any }))}
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground"
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-foreground block mb-1.5">Margins</label>
                    <select
                      value={options.margin}
                      onChange={(e) => setOptions((prev) => ({ ...prev, margin: e.target.value as any }))}
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground"
                    >
                      <option value="none">No Margin (Full Bleed)</option>
                      <option value="small">Small Margin (15pt)</option>
                      <option value="large">Large Margin (30pt)</option>
                    </select>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    {convertedPdfBytes ? (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        PDF Ready ({formatFileSize(convertedPdfSize)})
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Ready to convert {images.length} PNG{images.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {!convertedPdfBytes ? (
                      <Button
                        size="lg"
                        disabled={isConverting}
                        onClick={handleConvert}
                        className="w-full sm:w-auto px-8 rounded-xl font-bold bg-[#e5322d] hover:bg-[#c92a26] text-white shadow-md shadow-brand/20 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {isConverting
                          ? `Converting (${conversionProgress?.current || 0}/${conversionProgress?.total || images.length})...`
                          : "Convert to PDF"}
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="lg"
                          onClick={handleDownload}
                          className="w-full sm:w-auto px-8 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 cursor-pointer"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={handleOpenInEditor}
                          className="w-full sm:w-auto px-6 rounded-xl font-semibold border-border hover:bg-muted cursor-pointer"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Open in Editor
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <HowItWorksSection
        title="How to Convert PNG to PDF Online"
        subtitle="Combine lossless PNG captures and screenshots into clean PDF documents."
        steps={[
          {
            step: "01",
            title: "Select PNG Files",
            description: "Drag and drop one or multiple PNG graphics. Add more anytime.",
            badgeText: "Lossless PNG",
            badgeIcon: ImageIcon,
            colorClass: "icon-edit",
          },
          {
            step: "02",
            title: "Customize & Organize",
            description: "Rotate pages, reorder images, and set custom page margins and sizes.",
            badgeText: "Flexible layout",
            badgeIcon: Sparkles,
            colorClass: "icon-convert",
          },
          {
            step: "03",
            title: "Download PDF",
            description: "Export your consolidated PDF file or open it directly in the editor.",
            badgeText: "Ready to export",
            badgeIcon: Download,
            colorClass: "icon-organize",
          },
        ]}
      />

      {/* WHY USE */}
      <WhyUseSection
        title="Why Choose PDF Studio for PNG to PDF"
        subtitle="Lossless image fidelity without compression degradation or server uploads."
        benefits={[
          {
            icon: ShieldCheck,
            title: "Zero-Knowledge Security",
            description: "Images are processed locally in your browser memory and never transmitted externally.",
            colorClass: "icon-security",
          },
          {
            icon: Sparkles,
            title: "Lossless Graphics",
            description: "Retains razor-sharp edges and logo clarity without lossy JPEG artifacts.",
            colorClass: "icon-convert",
          },
          {
            icon: Layers,
            title: "Multi-Image Merging",
            description: "Combine dozens of PNG screenshots into a single neatly paginated PDF book.",
            colorClass: "icon-organize",
          },
          {
            icon: Zap,
            title: "Instant Processing",
            description: "Local browser hardware acceleration delivers finished PDFs in milliseconds.",
            colorClass: "icon-compress",
          },
        ]}
      />

      {/* FAQS */}
      <ConsistentFaqSection
        badge="PNG to PDF FAQs"
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about converting PNG images to PDF."
        items={pngToPdfFaq}
      />

      {/* CTA */}
      <ConsistentCtaSection
        title="Explore More Free Document Tools"
        subtitle="Edit, convert, organize, and encrypt PDFs online — fast, private, and browser-powered."
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
