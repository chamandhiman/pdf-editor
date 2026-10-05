import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Layers,
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
  Type,
  Stamp,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { SaasHeader } from "@/components/saas/SaasHeader";
import { SaasFooter } from "@/components/saas/SaasFooter";
import { HowItWorksSection } from "@/components/saas/HowItWorksSection";
import { WhyUseSection } from "@/components/saas/WhyUseSection";
import { ConsistentFaqSection } from "@/components/saas/ConsistentFaqSection";
import { ConsistentCtaSection } from "@/components/saas/ConsistentCtaSection";
import { ToolWorkspaceModal } from "@/components/saas/ToolWorkspaceModal";
import {
  watermarkPdf,
  getPdfPageCount,
  renderPageThumbnail,
} from "@/lib/pdf-operations";
import { setUploadedPdf } from "@/lib/pdf-store";
import { watermarkPdfFaq } from "@/lib/faq-data";
import { type PdfTool } from "@/lib/pdf-tools-data";

const QUICK_STAMPS = [
  "CONFIDENTIAL",
  "DRAFT",
  "SAMPLE",
  "APPROVED",
  "PAID",
  "URGENT",
  "TOP SECRET",
  "COPY",
];

const PRESET_COLORS = [
  { name: "Brand Red", hex: "#ef4444", r: 0.93, g: 0.27, b: 0.27 },
  { name: "Charcoal Gray", hex: "#4b5563", r: 0.3, g: 0.33, b: 0.39 },
  { name: "Navy Blue", hex: "#2563eb", r: 0.15, g: 0.39, b: 0.92 },
  { name: "Emerald Green", hex: "#059669", r: 0.02, g: 0.59, b: 0.41 },
  { name: "Deep Amber", hex: "#d97706", r: 0.85, g: 0.47, b: 0.02 },
];

export function WatermarkPdfPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    buffer: ArrayBuffer;
    pageCount: number;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(0.25);
  const [angle, setAngle] = useState(45); // 45 or 0
  const [fontSize, setFontSize] = useState(48);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [page1PreviewUrl, setPage1PreviewUrl] = useState<string | null>(null);

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
      setResultPdfBytes(null);

      // Render thumbnail of page 1
      try {
        const url = await renderPageThumbnail(buffer, 1, 320);
        setPage1PreviewUrl(url);
      } catch (e) {
        console.warn("Preview thumbnail failed:", e);
      }

      toast.success(`Loaded ${file.name} (${count} ${count === 1 ? "page" : "pages"})`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to parse PDF document.");
    }
  };

  const handleApplyWatermark = async () => {
    if (!selectedFile) return;

    if (!watermarkText.trim()) {
      toast.error("Please enter watermark text.");
      return;
    }

    setIsProcessing(true);
    try {
      const col = selectedColor || PRESET_COLORS[0]!;
      const bytes = await watermarkPdf(selectedFile.buffer, {
        text: watermarkText.trim(),
        fontSize,
        opacity,
        angle,
        color: { r: col.r, g: col.g, b: col.b },
      });
      setResultPdfBytes(bytes);
      toast.success("Watermark applied to all pages!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to apply watermark.");
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
    a.download = `${base}_watermarked.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Watermarked PDF downloaded!");
  };

  const handleOpenInEditor = () => {
    if (!resultPdfBytes || !selectedFile) return;
    const fileName = `${selectedFile.file.name.replace(/\.pdf$/i, "")}_watermarked.pdf`;
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
            <Stamp className="w-3.5 h-3.5" />
            <span>Document Security & Branding</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto">
            Watermark PDF <span className="text-brand">Online Free</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Stamp confidential notices, custom text, or approval marks across all pages. 
            Adjust opacity, angle, and font size with 100% in-browser privacy.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              100% Client-Side Private
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand" />
              Customizable Opacity & Angle
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              Zero Server Uploads
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
              Drop your document here to add custom watermark stamps
            </p>

            <Button
              type="button"
              className="bg-brand text-brand-foreground hover:bg-brand/90 px-6 py-2.5 rounded-xl font-semibold shadow-md"
            >
              Choose PDF Document
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT / SETTINGS COLUMN */}
            <div className="lg:col-span-7 bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Watermark Configuration
                  </h3>
                  <p className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-md">
                    {selectedFile.file.name} ({selectedFile.pageCount} pages)
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setResultPdfBytes(null);
                  }}
                  className="text-xs rounded-xl"
                >
                  Change File
                </Button>
              </div>

              {/* WATERMARK TEXT INPUT */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  Watermark Text
                </label>
                <Input
                  value={watermarkText}
                  onChange={(e) => {
                    setWatermarkText(e.target.value);
                    setResultPdfBytes(null);
                  }}
                  placeholder="e.g. CONFIDENTIAL"
                  className="rounded-xl font-medium"
                />
              </div>

              {/* QUICK STAMPS */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  Quick Stamp Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_STAMPS.map((stamp) => (
                    <button
                      key={stamp}
                      type="button"
                      onClick={() => {
                        setWatermarkText(stamp);
                        setResultPdfBytes(null);
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        watermarkText === stamp
                          ? "bg-brand text-brand-foreground border-brand font-semibold shadow-xs"
                          : "bg-muted/40 border-border/80 hover:bg-muted text-foreground"
                      }`}
                    >
                      {stamp}
                    </button>
                  ))}
                </div>
              </div>

              {/* ANGLE SELECTION */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  Watermark Angle
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAngle(45);
                      setResultPdfBytes(null);
                    }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      angle === 45
                        ? "border-brand bg-brand-soft text-brand font-bold shadow-xs"
                        : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <span className="text-sm block">Diagonal (45°)</span>
                    <span className="text-[11px] opacity-75">Standard watermark</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAngle(0);
                      setResultPdfBytes(null);
                    }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      angle === 0
                        ? "border-brand bg-brand-soft text-brand font-bold shadow-xs"
                        : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <span className="text-sm block">Horizontal (0°)</span>
                    <span className="text-[11px] opacity-75">Banner stamp</span>
                  </button>
                </div>
              </div>

              {/* OPACITY SLIDER */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Opacity: {Math.round(opacity * 100)}%
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    {opacity < 0.2 ? "Subtle" : opacity > 0.5 ? "Solid" : "Balanced"}
                  </span>
                </div>
                <Slider
                  value={[opacity * 100]}
                  min={10}
                  max={80}
                  step={5}
                  onValueChange={([val = 25]) => {
                    setOpacity(val / 100);
                    setResultPdfBytes(null);
                  }}
                  className="py-2"
                />
              </div>

              {/* FONT SIZE SLIDER */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Font Size: {fontSize}pt
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    {fontSize < 36 ? "Compact" : fontSize > 56 ? "Headline" : "Medium"}
                  </span>
                </div>
                <Slider
                  value={[fontSize]}
                  min={24}
                  max={72}
                  step={4}
                  onValueChange={([val = 48]) => {
                    setFontSize(val);
                    setResultPdfBytes(null);
                  }}
                  className="py-2"
                />
              </div>

              {/* COLOR PRESETS */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  Watermark Color
                </label>
                <div className="flex items-center gap-3">
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => {
                        setSelectedColor(col);
                        setResultPdfBytes(null);
                      }}
                      title={col.name}
                      style={{ backgroundColor: col.hex }}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        selectedColor?.name === col.name
                          ? "ring-2 ring-offset-2 ring-brand scale-110 shadow-sm"
                          : "opacity-80 hover:opacity-100"
                      }`}
                    />
                  ))}
                  <span className="text-xs font-medium text-foreground ml-2">
                    {selectedColor?.name ?? "Brand Red"}
                  </span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-4 border-t border-border/60 flex flex-wrap items-center gap-3">
                {!resultPdfBytes ? (
                  <Button
                    type="button"
                    onClick={handleApplyWatermark}
                    disabled={isProcessing}
                    className="bg-brand text-brand-foreground hover:bg-brand/90 px-6 py-2.5 rounded-xl font-bold shadow-md gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Applying Watermark...
                      </>
                    ) : (
                      <>
                        <Stamp className="w-4 h-4" />
                        Apply Watermark to All Pages
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
                      Download Watermarked PDF
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

            {/* RIGHT / PREVIEW COLUMN */}
            <div className="lg:col-span-5 bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground self-start mb-4">
                Interactive Live Preview (Page 1)
              </span>

              <div className="w-full max-w-sm aspect-[3/4] bg-white rounded-2xl border border-border/80 shadow-md relative overflow-hidden flex items-center justify-center p-4">
                {page1PreviewUrl ? (
                  <img
                    src={page1PreviewUrl}
                    alt="Page 1 Background"
                    className="max-h-full max-w-full object-contain pointer-events-none opacity-90 select-none"
                  />
                ) : (
                  <div className="text-muted-foreground text-xs flex flex-col items-center gap-2">
                    <FileText className="w-8 h-8 text-brand" />
                    <span>Loading Document Page...</span>
                  </div>
                )}

                {/* OVERLAY WATERMARK PREVIEW */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
                  style={{ opacity }}
                >
                  <span
                    style={{
                      transform: `rotate(${angle === 45 ? "-45deg" : "0deg"})`,
                      color: selectedColor?.hex ?? "#ef4444",
                      fontSize: `${Math.round(fontSize * 0.7)}px`,
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      border: `3px solid ${selectedColor?.hex ?? "#ef4444"}`,
                      padding: "8px 24px",
                      borderRadius: "8px",
                    }}
                  >
                    {watermarkText || "WATERMARK"}
                  </span>
                </div>
              </div>

              <p className="mt-4 text-xs text-muted-foreground text-center">
                Watermark will be burned into all {selectedFile.pageCount} pages upon export.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <HowItWorksSection
        title="How to Add Watermarks to PDF Online"
        subtitle="Protect and label your intellectual property in three effortless steps."
        steps={[
          {
            step: "01",
            title: "Upload Your PDF",
            description: "Drag and drop any PDF file. The document is loaded securely in your browser.",
            badgeText: "Private & Safe",
            badgeIcon: FileUp,
            colorClass: "icon-edit",
          },
          {
            step: "02",
            title: "Customize Stamp & Opacity",
            description: "Choose presets like CONFIDENTIAL or type custom text with custom angles and colors.",
            badgeText: "Full Control",
            badgeIcon: Sliders,
            colorClass: "icon-convert",
          },
          {
            step: "03",
            title: "Download Protected File",
            description: "Export your watermarked PDF instantly with zero quality loss.",
            badgeText: "Instant Export",
            badgeIcon: Download,
            colorClass: "icon-organize",
          },
        ]}
      />

      {/* WHY USE */}
      <WhyUseSection
        title="Why Choose PDF Studio for Watermarking"
        subtitle="Engineered for corporate legal teams, freelancers, and businesses who value privacy."
        benefits={[
          {
            icon: ShieldCheck,
            title: "100% Client-Side Privacy",
            description: "Your confidential proposals and NDAs never touch remote servers. Everything runs in-memory.",
            colorClass: "icon-security",
          },
          {
            icon: Zap,
            title: "Adjustable Transparency",
            description: "Keep underlying text crisp and readable by fine-tuning opacity from 10% to 80%.",
            colorClass: "icon-compress",
          },
          {
            icon: Stamp,
            title: "Pre-Configured Stamps",
            description: "One-click templates for DRAFT, APPROVED, CONFIDENTIAL, PAID, and TOP SECRET.",
            colorClass: "icon-edit",
          },
          {
            icon: CheckCircle2,
            title: "Direct Editor Integration",
            description: "Continue modifying your document in our full browser-based PDF editor with a single click.",
            colorClass: "icon-organize",
          },
        ]}
      />

      {/* FAQS */}
      <ConsistentFaqSection
        title="Frequently Asked Questions About Watermarking PDFs"
        subtitle="Learn more about watermark customization, legal branding, and data confidentiality."
        items={watermarkPdfFaq}
      />

      {/* CTA */}
      <ConsistentCtaSection
        title="Ready to Secure and Organize Your Documents?"
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
