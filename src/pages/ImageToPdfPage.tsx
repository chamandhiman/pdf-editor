import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  FileImage,
  FileUp,
  Download,
  RotateCw,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Plus,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Zap,
  Layers,
  Settings2,
  Image as LucideImage,
  RefreshCw,
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
import { imageToPdfFaq } from "@/lib/faq-data";
import { type PdfTool } from "@/lib/pdf-tools-data";

export function ImageToPdfPage() {
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
      file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|svg|gif|bmp)$/i.test(file.name)
    );

    if (validFiles.length === 0) {
      toast.error("Please upload valid image files (JPG, PNG, WebP, SVG, BMP).");
      return;
    }

    const toastId = toast.loading(`Loading ${validFiles.length} image${validFiles.length > 1 ? "s" : ""}...`);

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
      toast.success(`Added ${newItems.length} image${newItems.length > 1 ? "s" : ""}.`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load some images. Please try again.", { id: toastId });
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
      if (e.dataTransfer?.files?.length) {
        handleAddFiles(e.dataTransfer.files);
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
  }, [handleAddFiles]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleRotateImage = (id: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img
      )
    );
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleMoveImage = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      const target = copy[targetIndex];
      if (temp && target) {
        copy[index] = target;
        copy[targetIndex] = temp;
      }
      return copy;
    });
  };

  const handleConvert = async () => {
    if (images.length === 0) return;
    setIsConverting(true);
    const toastId = toast.loading("Converting images to PDF...");

    try {
      const pdfBytes = await convertImagesToPdf(images, options, (current, total) => {
        setConversionProgress({ current, total });
      });

      setConvertedPdfBytes(pdfBytes);
      setConvertedPdfSize(pdfBytes.byteLength);
      toast.success("PDF created successfully!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to convert images to PDF.", { id: toastId });
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
    const baseName = images[0]?.file.name.replace(/\.[^/.]+$/, "") || "converted_images";
    a.download = `${baseName}_converted.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("PDF downloaded successfully!");
  };

  const handleOpenInEditor = () => {
    if (!convertedPdfBytes) return;
    const baseName = images[0]?.file.name.replace(/\.[^/.]+$/, "") || "converted_images";
    const filename = `${baseName}_converted.pdf`;
    setUploadedPdf((convertedPdfBytes.buffer as ArrayBuffer).slice(0), filename);
    toast.success("Opened converted document in PDF Studio Editor!");
    navigate({ to: "/editor", search: { file: filename } });
  };

  const handleReset = () => {
    setImages([]);
    setConvertedPdfBytes(null);
    setConvertedPdfSize(0);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-brand selection:text-white">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.jpg,.jpeg,.png,.webp,.svg,.bmp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleAddFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={addMoreInputRef}
        type="file"
        multiple
        accept="image/*,.jpg,.jpeg,.png,.webp,.svg,.bmp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleAddFiles(e.target.files);
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
              <FileImage className="w-64 h-64 text-brand" strokeWidth={0.6} />
            </div>
            <div className="absolute -top-6 left-[5%] opacity-[0.05] animate-float-1">
              <LucideImage className="w-48 h-48 text-brand" strokeWidth={0.7} />
            </div>
            <div className="absolute bottom-0 right-[30%] opacity-[0.04] animate-float-2">
              <Layers className="w-36 h-36 text-brand-accent" strokeWidth={0.8} />
            </div>
          </div>

          <div className="container max-w-6xl mx-auto px-4 relative z-10 py-6 md:py-8">
            {/* Header Title */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 leading-tight gradient-brand">
                Image to PDF
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Convert JPG, PNG, WebP, and photos into a clean, professional PDF document in seconds.
              </p>
            </div>

            {/* STATE 1: Empty Dropzone */}
            {images.length === 0 && (
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
                  ${isDragging ? "icon-image scale-110 rotate-6" : "icon-image group-hover:scale-110 group-hover:-rotate-3"}
                `}>
                  <FileImage className="w-12 h-12 text-white drop-shadow-lg" />
                  <span className="absolute inset-0 rounded-3xl border-2 border-white/25 animate-ping opacity-50" />
                </div>

                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1.5">
                  Drop your images here
                </h2>
                <p className="text-sm md:text-base text-muted-foreground mb-6">
                  or click anywhere to browse JPG, PNG, WebP files
                </p>

                <Button
                  size="lg"
                  className="rounded px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-brand hover:bg-brand-hover text-white pointer-events-none"
                  style={{ borderRadius: "4px" }}
                >
                  <FileUp className="w-5 h-5 mr-2" />
                  Select Images
                </Button>

                {/* Trust Pills */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full border border-border/60">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                    <span>100% Client-Side</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full border border-border/60">
                    <Zap className="w-3.5 h-3.5 text-brand" />
                    <span>Instant Rendering</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full border border-border/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Zero Quality Loss</span>
                  </div>
                </div>
              </div>
            )}

            {/* STATE 2: Images Loaded & Configuration Workbench */}
            {images.length > 0 && !convertedPdfBytes && (
              <div className="space-y-6">
                {/* Control Bar */}
                <div className="bg-card/90 backdrop-blur-md rounded-2xl border border-border/70 p-4 sm:p-6 shadow-sm">
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                      <div className="w-10 h-10 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                        <FileImage className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-base">
                          {images.length} Image{images.length > 1 ? "s" : ""} Selected
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Each image will become a dedicated page in your PDF document.
                        </p>
                      </div>
                    </div>

                    {/* Options Row */}
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
                      {/* Page Size */}
                      <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1.5 rounded border border-border/60 text-xs">
                        <span className="font-semibold text-muted-foreground">Page:</span>
                        <select
                          value={options.pageSize}
                          onChange={(e) => setOptions((prev) => ({ ...prev, pageSize: e.target.value as any }))}
                          className="bg-transparent font-medium text-foreground focus:outline-none cursor-pointer"
                        >
                          <option value="a4" className="bg-card">A4 (Standard)</option>
                          <option value="letter" className="bg-card">US Letter</option>
                          <option value="fit" className="bg-card">Fit to Image Size</option>
                        </select>
                      </div>

                      {/* Orientation */}
                      <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1.5 rounded border border-border/60 text-xs">
                        <span className="font-semibold text-muted-foreground">Layout:</span>
                        <select
                          value={options.orientation}
                          onChange={(e) => setOptions((prev) => ({ ...prev, orientation: e.target.value as any }))}
                          className="bg-transparent font-medium text-foreground focus:outline-none cursor-pointer"
                        >
                          <option value="portrait" className="bg-card">Portrait</option>
                          <option value="landscape" className="bg-card">Landscape</option>
                          <option value="auto" className="bg-card">Auto-detect</option>
                        </select>
                      </div>

                      {/* Margins */}
                      <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1.5 rounded border border-border/60 text-xs">
                        <span className="font-semibold text-muted-foreground">Margin:</span>
                        <select
                          value={options.margin}
                          onChange={(e) => setOptions((prev) => ({ ...prev, margin: e.target.value as any }))}
                          className="bg-transparent font-medium text-foreground focus:outline-none cursor-pointer"
                        >
                          <option value="none" className="bg-card">No Margin (Full Bleed)</option>
                          <option value="small" className="bg-card">Small (20pt)</option>
                          <option value="big" className="bg-card">Big (40pt)</option>
                        </select>
                      </div>

                      {/* Add more button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addMoreInputRef.current?.click()}
                        style={{ borderRadius: "4px" }}
                        className="text-xs font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Images
                      </Button>

                      {/* Convert Button */}
                      <Button
                        size="sm"
                        onClick={handleConvert}
                        disabled={isConverting}
                        style={{ borderRadius: "4px" }}
                        className="bg-brand hover:bg-brand-hover text-white text-xs font-bold px-5"
                      >
                        {isConverting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            {conversionProgress
                              ? `Converting ${conversionProgress.current}/${conversionProgress.total}...`
                              : "Converting..."}
                          </>
                        ) : (
                          <>
                            <FileText className="w-3.5 h-3.5 mr-1.5" />
                            Convert to PDF
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Thumbnails Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {images.map((img, idx) => (
                    <div
                      key={img.id}
                      className="group relative bg-card rounded-xl border border-border/70 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                    >
                      {/* Page badge */}
                      <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-[11px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm shadow">
                        Page {idx + 1}
                      </div>

                      {/* Thumbnail view */}
                      <div className="h-44 w-full bg-muted/40 flex items-center justify-center p-3 relative overflow-hidden">
                        <img
                          src={img.previewUrl}
                          alt={img.file.name}
                          style={{
                            transform: `rotate(${img.rotation}deg)`,
                            maxHeight: "100%",
                            maxWidth: "100%",
                            objectFit: "contain",
                          }}
                          className="transition-transform duration-200 drop-shadow-sm"
                        />
                      </div>

                      {/* Controls Footer */}
                      <div className="p-2.5 bg-card border-t border-border/60 flex items-center justify-between gap-1 text-xs">
                        <div className="truncate font-medium text-foreground text-[11px] flex-1 pr-1" title={img.file.name}>
                          {img.file.name}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Move left */}
                          <button
                            type="button"
                            onClick={() => handleMoveImage(idx, "left")}
                            disabled={idx === 0}
                            title="Move earlier"
                            className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded disabled:opacity-30 transition-colors"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>

                          {/* Move right */}
                          <button
                            type="button"
                            onClick={() => handleMoveImage(idx, "right")}
                            disabled={idx === images.length - 1}
                            title="Move later"
                            className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded disabled:opacity-30 transition-colors"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          {/* Rotate */}
                          <button
                            type="button"
                            onClick={() => handleRotateImage(img.id)}
                            title="Rotate 90°"
                            className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(img.id)}
                            title="Remove image"
                            className="p-1 hover:bg-rose-50 text-muted-foreground hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STATE 3: Conversion Success View */}
            {convertedPdfBytes && (
              <div className="max-w-2xl mx-auto bg-card rounded-3xl border border-border/80 p-8 shadow-xl text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <h2 className="text-2xl font-black text-foreground mb-1">
                    Your PDF is Ready!
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Successfully converted {images.length} images into a single multi-page PDF ({formatFileSize(convertedPdfSize)}).
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
                    Download PDF
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleOpenInEditor}
                    style={{ borderRadius: "4px" }}
                    className="w-full sm:w-auto px-6 py-6 font-semibold"
                  >
                    <Sparkles className="w-5 h-5 mr-2 text-brand" />
                    Open in Editor
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
            )}
          </div>
        </section>

        {/* Global Window Drag Overlay */}
        {isWindowDragging && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center p-6 border-4 border-dashed border-primary">
            <div className="w-24 h-24 rounded-3xl bg-brand/10 text-brand flex items-center justify-center mb-4 animate-bounce">
              <FileUp className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">Drop Images Anywhere to Convert</h3>
            <p className="text-sm text-muted-foreground mt-1">Supports JPG, PNG, WebP, SVG, and BMP</p>
          </div>
        )}

        {/* Informative Sections */}
        <HowItWorksSection
          title="How to Convert Images to PDF Online"
          subtitle="Transform multiple photos, scans, and graphic files into a PDF in three quick steps"
          steps={[
            {
              step: "01",
              title: "Upload Images",
              description: "Select or drag and drop JPG, PNG, or WebP images from your computer or phone.",
              badgeText: "Multi-image select",
              badgeIcon: FileUp,
              colorClass: "icon-compress",
            },
            {
              step: "02",
              title: "Reorder & Customize",
              description: "Arrange image order, rotate pages, choose page sizes (A4, Letter), and pick margins.",
              badgeText: "Visual grid control",
              badgeIcon: Settings2,
              colorClass: "icon-organize",
            },
            {
              step: "03",
              title: "Download PDF",
              description: "Click Convert to PDF. Your file is created 100% locally in your browser ready to save.",
              badgeText: "Zero server uploads",
              badgeIcon: Download,
              colorClass: "icon-convert",
            },
          ]}
        />

        <WhyUseSection
          title="Why Choose PDF Studio Image to PDF?"
          subtitle="Fast, high-fidelity conversion with complete local privacy"
          benefits={[
            {
              icon: ShieldCheck,
              title: "100% Private & Local",
              description: "Files never leave your machine. Conversion runs entirely inside your browser using client-side WebAssembly.",
              colorClass: "icon-security",
            },
            {
              icon: Zap,
              title: "Lightning Fast Speed",
              description: "Zero waiting for upload or download queues. Batch convert dozens of high-res photos instantly.",
              colorClass: "icon-compress",
            },
            {
              icon: FileImage,
              title: "Multi-Format Support",
              description: "Seamlessly converts JPG, JPEG, PNG, WebP, SVG, GIF, and BMP graphics with intact color accuracy.",
              colorClass: "icon-edit",
            },
            {
              icon: Settings2,
              title: "Custom Sizing & Margins",
              description: "Choose standard A4 or US Letter formats, fit pages to image dimensions, and control margin spacing.",
              colorClass: "icon-organize",
            },
          ]}
        />

        <ConsistentFaqSection
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about our Image to PDF converter"
          items={imageToPdfFaq}
        />

        <ConsistentCtaSection
          title="Ready to Convert Your Images to PDF?"
          subtitle="Experience instant, private, and high-fidelity image conversion with PDF Studio."
          primaryCtaText="Select Images Now"
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
