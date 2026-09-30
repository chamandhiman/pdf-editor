import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Unlock,
  Lock,
  FileUp,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Key,
  KeyRound,
  ShieldOff,
  ShieldAlert,
  FileCheck,
  FileText,
  Printer,
  Copy,
  AlertCircle,
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
import { detectPdfEncryption, unlockPdf, type UnlockDetectionResult } from "@/lib/pdf-unlock";
import { renderAllDocumentThumbnails } from "@/lib/pdf-operations";
import { setUploadedPdf } from "@/lib/pdf-store";
import { unlockPdfFaq } from "@/lib/faq-data";
import { type PdfTool } from "@/lib/pdf-tools-data";

export function UnlockPdfPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    buffer: ArrayBuffer;
    detection: UnlockDetectionResult;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const dragCounter = useRef(0);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{ current: number; total: number } | null>(null);
  const [resultPdfBytes, setResultPdfBytes] = useState<Uint8Array | null>(null);
  const [unlockedPageCount, setUnlockedPageCount] = useState<number>(0);
  const [activeToolModal, setActiveToolModal] = useState<PdfTool | null>(null);

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

    const toastId = toast.loading(`Analyzing security on ${file.name}...`);
    try {
      const buffer = await file.arrayBuffer();
      const detection = await detectPdfEncryption(buffer);

      setSelectedFile({
        file,
        buffer,
        detection,
      });

      setPassword("");
      setResultPdfBytes(null);
      setThumbnailUrl(null);

      if (!detection.requiresPassword) {
        renderAllDocumentThumbnails(buffer, (pageNum, url) => {
          if (pageNum === 1) setThumbnailUrl(url);
        });
      }

      if (!detection.isEncrypted) {
        toast.info("This PDF is not password-protected. You can still re-save or edit it.", { id: toastId });
      } else if (detection.requiresPassword) {
        toast.success("Protected PDF detected. Please enter password to unlock.", { id: toastId });
      } else {
        toast.success("Permissions lock detected. Click Unlock to remove restrictions.", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to analyze PDF file.", { id: toastId });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleUnlock = async () => {
    if (!selectedFile) return;

    if (selectedFile.detection.requiresPassword && !password.trim()) {
      toast.error("Please enter the document password.");
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(null);

    try {
      const { bytes, pageCount } = await unlockPdf(
        selectedFile.buffer,
        password.trim() || undefined,
        (current, total) => {
          setProcessingProgress({ current, total });
        }
      );

      setResultPdfBytes(bytes);
      setUnlockedPageCount(pageCount);

      if (bytes) {
        const copyBuf = bytes.slice(0).buffer as ArrayBuffer;
        renderAllDocumentThumbnails(copyBuf, (pageNum, url) => {
          if (pageNum === 1) setThumbnailUrl(url);
        });
      }

      toast.success("PDF unlocked and decrypted successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to unlock PDF. Please check your password.");
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
    link.download = `${baseName}_unlocked.pdf`;
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
    const fileName = `${baseName}_unlocked.pdf`;
    setUploadedPdf(arrayBuffer, fileName);
    navigate({ to: "/editor", search: { file: fileName } });
  };

  const resetAll = () => {
    setSelectedFile(null);
    setPassword("");
    setResultPdfBytes(null);
    setThumbnailUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
        {/* ──────────────── FULL-WIDTH TOOL ZONE ──────────────── */}
        <section className="relative border-b border-border/30 pdf-hero-bg overflow-hidden py-10 md:py-16">
          {/* Continuous floating background icons (customized for Unlock PDF) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            {/* Giant Unlock slow float */}
            <div className="absolute top-1/2 right-[6%] -translate-y-1/2 opacity-[0.06] animate-float">
              <Unlock className="w-64 h-64 text-brand" strokeWidth={0.6} />
            </div>
            {/* Key top-left */}
            <div className="absolute -top-4 left-[5%] opacity-[0.05] animate-float-1">
              <Key className="w-52 h-52 text-brand" strokeWidth={0.7} />
            </div>
            {/* ShieldOff bottom-right */}
            <div className="absolute bottom-4 right-[26%] opacity-[0.04] animate-float-2">
              <ShieldOff className="w-36 h-36 text-brand-accent" strokeWidth={0.8} />
            </div>
            {/* ShieldCheck top-right */}
            <div className="absolute top-8 right-[24%] opacity-[0.04] animate-float-1">
              <ShieldCheck className="w-24 h-24 text-brand-accent" strokeWidth={1} />
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
            {!selectedFile && (
              <div className="py-6 md:py-8 flex flex-col items-center justify-center text-center">
                {/* Page title ABOVE the box */}
                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8 leading-tight gradient-brand">
                  Unlock PDF
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
                        ? "icon-security scale-110 rotate-6"
                        : "icon-security group-hover:scale-110 group-hover:-rotate-3"
                      }
                    `}
                  >
                    <Unlock className="w-12 h-12 text-white drop-shadow-lg" />
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

            {/* ── STATE 2 & 3: Configure Password / Unlock Success ── */}
            {selectedFile && (
              <>
                {/* Header Title Section */}
                <div className="text-center max-w-3xl mx-auto mb-10">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
                    <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                    <span>PDF Decryption Center</span>
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
                    Unlock PDF <span className="gradient-brand">Password</span>
                  </h1>
                  <p className="mt-3.5 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                    Remove PDF passwords, decrypt protected documents, and strip printing or copying restrictions.
                    Fast, lossless, and processed 100% privately in your web browser.
                  </p>
                </div>

                {/* Interactive Workspace Card */}
                <div className="bg-card/95 backdrop-blur-md border border-border rounded-3xl shadow-2xl overflow-hidden pdf-card-glow transition-all max-w-4xl mx-auto">
                  {/* Top brand accent bar */}
                  <div className="h-1.5 bg-gradient-to-r from-emerald-600 via-brand to-teal-500" />

                  {resultPdfBytes ? (
                /* SUCCESS / DOWNLOAD SCREEN */
                <div className="p-8 sm:p-14 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    Password & Restrictions Removed!
                  </h3>
                  <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                    Your PDF is now completely unlocked ({unlockedPageCount} pages). You can open, view, print, edit, and copy content on any device without a password.
                  </p>

                  {/* Thumbnail / Document Preview Card */}
                  <div className="mt-8 p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between text-left max-w-md mx-auto gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {thumbnailUrl ? (
                        <div className="w-12 h-16 rounded-lg overflow-hidden border border-border shadow-sm bg-white shrink-0">
                          <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shrink-0 text-white font-extrabold text-xs shadow-md">
                          PDF
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{selectedFile.file.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Unlock className="w-3 h-3 text-emerald-500" />
                          <span>Fully Unlocked • {unlockedPageCount} pages</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                      Decrypted
                    </span>
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                    <Button
                      variant="brand"
                      size="xl"
                      onClick={handleDownload}
                      className="w-full sm:w-auto font-bold shadow-lg shadow-brand/25 px-8 py-3.5 pdf-shine"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download Unlocked PDF
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
                    <Button
                      variant="ghost"
                      size="xl"
                      onClick={resetAll}
                      className="w-full sm:w-auto text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Unlock Another
                    </Button>
                  </div>
                </div>
            ) : (
              /* CONFIGURE UNLOCK SCREEN */
              <div className="p-6 sm:p-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
                  <div className="flex items-center gap-4">
                    {thumbnailUrl ? (
                      <div className="w-14 h-20 rounded-xl overflow-hidden border border-border shadow-md bg-white shrink-0">
                        <img src={thumbnailUrl} alt="Document preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-14 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-md">
                        PDF
                      </div>
                    )}
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-foreground truncate max-w-md">
                        {selectedFile.file.name}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {(selectedFile.file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        {selectedFile.detection.isEncrypted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                            <Lock className="w-3 h-3" />
                            {selectedFile.detection.requiresPassword ? "Password Protected" : "Restrictions Lock"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Not Encrypted
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold self-end sm:self-auto"
                  >
                    Change File
                  </Button>
                </div>

                {/* Password Input or Direct Unlock */}
                <div className="py-8 max-w-xl mx-auto">
                  {selectedFile.detection.requiresPassword ? (
                    <div>
                      <div className="text-center mb-6">
                        <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand mx-auto flex items-center justify-center mb-3">
                          <Key className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">
                          Enter Password to Unlock
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                          This document has viewing encryption. Enter the password once to permanently remove it.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                            placeholder="Enter PDF password..."
                            className="w-full px-4 py-3.5 pr-11 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all shadow-sm"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground space-y-1.5">
                          <div className="flex items-center gap-1.5 text-foreground font-semibold">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            <span>100% Privacy Guaranteed</span>
                          </div>
                          <p>
                            Your password and documents are never transmitted over the internet.
                            Decryption executes locally in your browser memory via Web Crypto.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : !selectedFile.detection.isEncrypted ? (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground">
                        Document Has No Password
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                        This file is already open and unencrypted. You can open it in the editor directly or click below to re-save a clean standard PDF.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-3">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground">
                        Permissions Lock Detected
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                        This file can be opened without a password, but printing or editing is restricted by an Owner Lock.
                        Click below to strip all restrictions instantly.
                      </p>
                    </div>
                  )}
                </div>

                {/* Main Action Button */}
                <div className="mt-8 text-center">
                    <Button
                      variant="brand"
                      size="xl"
                      disabled={isProcessing || (selectedFile.detection.requiresPassword && !password.trim())}
                      onClick={handleUnlock}
                      className="w-full sm:w-auto px-10 py-3.5 font-bold shadow-lg shadow-brand/25 text-base"
                    >
                      <Unlock className="w-4 h-4 mr-2" />
                      {isProcessing
                        ? processingProgress
                          ? `Decrypting (${processingProgress.current}/${processingProgress.total})...`
                          : "Unlocking Document..."
                        : "Unlock PDF"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        </div>
      </section>

        {/* 1. HOW IT WORKS WORKFLOW */}
        <HowItWorksSection
          badge="Effortless Decryption"
          title="How to Unlock a Password-Protected PDF"
          subtitle="Remove restrictions and passwords in three straightforward client-side steps."
          steps={[
            {
              step: "01",
              title: "Upload Protected PDF",
              description: "Select or drop your encrypted document into the private local browser workspace.",
              badgeText: "Local client-side parsing",
              badgeIcon: FileUp,
              colorClass: "icon-security",
            },
            {
              step: "02",
              title: "Authenticate Password",
              description: "If an open password is required, enter it once to authorize browser Web Crypto decryption.",
              badgeText: "Zero server storage",
              badgeIcon: Key,
              colorClass: "icon-edit",
            },
            {
              step: "03",
              title: "Download Unrestricted File",
              description: "Instantly download a clean, unencrypted PDF with all viewing and printing locks removed forever.",
              badgeText: "ISO 32000 standard",
              badgeIcon: Download,
              colorClass: "icon-convert",
            },
          ]}
        />

        {/* 2. WHY USE UNLOCK PDF */}
        <WhyUseSection
          badge="Universal Access"
          title="Why Unlock PDFs with WebToolOcean"
          subtitle="Safe, verified client-side decryption designed for total document freedom."
          benefits={[
            {
              icon: ShieldCheck,
              title: "100% In-Browser Privacy",
              description: "Files and passwords never leave your device. All cryptographic operations run inside local memory.",
              colorClass: "icon-security",
            },
            {
              icon: Printer,
              title: "Restore Print & Copy Access",
              description: "Strip restrictive owner passwords that prevent copying, printing, or extracting content from documents.",
              colorClass: "icon-organize",
            },
            {
              icon: Sparkles,
              title: "Zero Quality Loss",
              description: "Typography, embedded fonts, vector graphics, and metadata are preserved losslessly without blur.",
              colorClass: "icon-edit",
            },
            {
              icon: FileCheck,
              title: "Universal PDF Compatibility",
              description: "The resulting unencrypted file opens immediately on Adobe Acrobat, Apple Preview, Chrome, Edge, and iOS/Android.",
              colorClass: "icon-convert",
            },
            {
              icon: Lock,
              title: "Standard AES-256 Support",
              description: "Seamlessly handles modern 128-bit and 256-bit AES encryption algorithms with fast browser execution.",
              colorClass: "icon-security",
            },
            {
              icon: RefreshCw,
              title: "No Daily Limits or Watermarks",
              description: "Enjoy completely unrestricted document utilities without watermarks, sign-ups, or hidden payment locks.",
              colorClass: "icon-compress",
            },
          ]}
        />

        {/* 3. CONSISTENT FAQ ACCORDION */}
        <ConsistentFaqSection
          badge="Unlock FAQs"
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about decrypting PDFs and removing password restrictions."
          items={unlockPdfFaq}
        />

        {/* 4. FINAL CTA BANNER */}
        <ConsistentCtaSection
          title="Remove Passwords from Your PDFs Today"
          subtitle="Decrypt contracts, financial statements, and personal records in seconds."
          primaryCtaText="Unlock PDF Now"
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
            if (files && files.length > 0 && files[0]) {
              void handleProcessFile(files[0]);
            }
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="-rotate-12 transform text-brand/80">
              <ShieldOff className="w-9 h-9 stroke-[1.8]" />
            </div>
            <div className="text-brand -mt-2">
              <Unlock className="w-11 h-11 stroke-[1.8]" />
            </div>
            <div className="rotate-12 transform text-brand/80">
              <KeyRound className="w-9 h-9 stroke-[1.8]" />
            </div>
          </div>
          <p className="text-brand text-lg sm:text-xl font-bold tracking-tight mb-1">
            Drop PDF to Unlock & Decrypt
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Files are processed locally and securely in your browser
          </p>
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
