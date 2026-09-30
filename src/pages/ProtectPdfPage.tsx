import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Lock,
  Unlock,
  Key,
  KeyRound,
  Shield,
  ShieldCheck,
  ShieldAlert,
  FileText,
  FileUp,
  Download,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Printer,
  Copy,
  ChevronDown,
  ChevronUp,
  FileCheck,
  HelpCircle,
  FolderOpen,
  Image as LucideImage,
  Folder,
} from "lucide-react";
import { toast } from "sonner";
import { PDFDocument } from "pdf-lib";

import { Button } from "@/components/ui/button";
import { SaasHeader } from "@/components/saas/SaasHeader";
import { SaasFooter } from "@/components/saas/SaasFooter";
import { ToolWorkspaceModal } from "@/components/saas/ToolWorkspaceModal";
import { BrandMark } from "@/components/BrandMark";
import { setUploadedPdf } from "@/lib/pdf-store";
import type { PdfTool } from "@/lib/pdf-tools-data";
import {
  protectPdf,
  evaluatePasswordStrength,
  isPdfEncrypted,
} from "@/lib/pdf-protect";
import { renderAllDocumentThumbnails } from "@/lib/pdf-operations";
import { HowItWorksSection } from "@/components/saas/HowItWorksSection";
import { WhyUseSection } from "@/components/saas/WhyUseSection";
import { ConsistentFaqSection } from "@/components/saas/ConsistentFaqSection";
import { ConsistentCtaSection } from "@/components/saas/ConsistentCtaSection";
import { protectFaq } from "@/lib/faq-data";

interface SelectedFileInfo {
  file: File;
  bytes: Uint8Array;
  pageCount: number;
}

export function ProtectPdfPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File state
  const [selectedFile, setSelectedFile] = useState<SelectedFileInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const dragCounter = useRef(0);
  const [loadingFile, setLoadingFile] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

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

  // Password & Security settings
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [ownerPassword, setOwnerPassword] = useState("");
  const [algorithm, setAlgorithm] = useState<"AES-256" | "RC4">("AES-256");
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowCopying, setAllowCopying] = useState(true);

  // Processing & Result state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [protectedPdfBytes, setProtectedPdfBytes] = useState<Uint8Array | null>(null);
  const [protectedFileName, setProtectedFileName] = useState("");

  // Header modal state
  const [activeToolModal, setActiveToolModal] = useState<PdfTool | null>(null);

  const strength = evaluatePasswordStrength(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      toast.error("Please upload a valid PDF document.");
      return;
    }

    setLoadingFile(true);
    const toastId = toast.loading("Inspecting document...");
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // Check if already encrypted
      const alreadyEncrypted = await isPdfEncrypted(bytes);
      if (alreadyEncrypted) {
        toast.error("This PDF is already encrypted or password protected.", { id: toastId });
        setLoadingFile(false);
        return;
      }

      // Read page count
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pageCount = doc.getPageCount();

      setSelectedFile({
        file,
        bytes,
        pageCount,
      });

      // Reset previous results & render thumbnail
      setProtectedPdfBytes(null);
      setPassword("");
      setConfirmPassword("");
      setThumbnailUrl(null);

      renderAllDocumentThumbnails(buffer, (pageNum, url) => {
        if (pageNum === 1) {
          setThumbnailUrl(url);
        }
      });

      toast.success(`Loaded "${file.name}" (${pageCount} pages)`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to read PDF file.", { id: toastId });
    } finally {
      setLoadingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      void handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Perform PDF Protection
  const handleProtect = async () => {
    if (!selectedFile) {
      toast.error("Please select a PDF file first.");
      return;
    }

    if (!password || password.trim().length === 0) {
      toast.error("Please enter a password.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match. Please verify.");
      return;
    }

    setIsProcessing(true);
    setProcessingStep("Generating 256-bit encryption keys...");

    try {
      await new Promise((r) => setTimeout(r, 400));
      setProcessingStep("Encrypting PDF streams and catalog...");

      const encrypted = await protectPdf(selectedFile.bytes, {
        userPassword: password,
        ownerPassword: ownerPassword.trim() || undefined,
        algorithm,
        allowPrinting,
        allowCopying,
      });

      await new Promise((r) => setTimeout(r, 400));
      setProcessingStep("Finalizing encrypted PDF...");

      const baseName = selectedFile.file.name.replace(/\.pdf$/i, "");
      const outputName = `${baseName}_protected.pdf`;

      setProtectedPdfBytes(encrypted);
      setProtectedFileName(outputName);

      toast.success("PDF protected successfully with 256-bit encryption!");
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Failed to encrypt PDF.";
      toast.error(msg);
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  // Download protected file
  const handleDownload = () => {
    if (!protectedPdfBytes) return;

    const blob = new Blob([protectedPdfBytes as unknown as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = protectedFileName || "protected.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Download started!");
  };

  const handleOpenInEditor = () => {
    if (!protectedPdfBytes) return;
    const arrayBuffer = protectedPdfBytes.slice().buffer as ArrayBuffer;
    setUploadedPdf(arrayBuffer, protectedFileName || "protected.pdf");
    navigate({ to: "/editor", search: { file: protectedFileName || "protected.pdf" } });
  };

  // Reset and protect another
  const handleReset = () => {
    setSelectedFile(null);
    setProtectedPdfBytes(null);
    setPassword("");
    setConfirmPassword("");
    setOwnerPassword("");
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
          if (e.target.files?.[0]) void handleFileSelect(e.target.files[0]);
        }}
      />

      {/* Main SaaS Navigation Bar */}
      <SaasHeader
        onOpenUploadModal={() => fileInputRef.current?.click()}
        onSelectTool={(tool) => setActiveToolModal(tool)}
      />

      <main className="flex-1">
        {/* ──────────────── FULL-WIDTH TOOL ZONE ──────────────── */}
        <section className="relative border-b border-border/30 pdf-hero-bg overflow-hidden py-10 md:py-16">
          {/* Continuous floating background icons (customized for Protect PDF) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            {/* Giant Lock slow float */}
            <div className="absolute top-1/2 right-[6%] -translate-y-1/2 opacity-[0.06] animate-float">
              <Lock className="w-64 h-64 text-brand" strokeWidth={0.6} />
            </div>
            {/* Shield top-left */}
            <div className="absolute -top-4 left-[5%] opacity-[0.05] animate-float-1">
              <Shield className="w-52 h-52 text-brand" strokeWidth={0.7} />
            </div>
            {/* KeyRound bottom-right */}
            <div className="absolute bottom-4 right-[26%] opacity-[0.04] animate-float-2">
              <KeyRound className="w-36 h-36 text-brand-accent" strokeWidth={0.8} />
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
                  Protect PDF
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
                    <Lock className="w-12 h-12 text-white drop-shadow-lg" />
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
                    className="mt-5 rounded-[4px] px-14 h-14 text-base font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all pointer-events-none animate-pulse-glow"
                  >
                    <FileUp className="w-5 h-5 mr-2" />
                    Select PDF file
                  </Button>
                </div>
              </div>
            )}

            {/* ── STATE 2 & 3: Configure Password / Success View ── */}
            {selectedFile && (
              <>
                {/* Header Title Section matching screenshot */}
                <div className="text-center max-w-3xl mx-auto mb-10">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
                    <Shield className="w-3.5 h-3.5 text-red-500" />
                    <span>PDF Security Center</span>
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
                    Protect PDF with <span className="gradient-brand">Password</span>
                  </h1>
                  <p className="mt-3.5 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                    Encrypt your PDF documents with industry-standard 256-bit AES encryption.
                    Prevent unauthorized viewing, editing, or copying — executed 100% privately in your browser.
                  </p>
                </div>

                {/* MAIN WORKSPACE CARD */}
                <div className="rounded-3xl border border-border bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden pdf-card-glow relative max-w-4xl mx-auto">
                  {/* Top red brand bar matching user screenshot */}
                  <div className="h-1.5 bg-gradient-to-r from-red-600 via-brand to-orange-500" />

                  <div className="p-6 sm:p-10">
                    {/* SUCCESS VIEW */}
                    {protectedPdfBytes ? (
                      <div className="py-8 px-4 text-center max-w-xl mx-auto">
                        <div className="w-20 h-20 rounded-3xl icon-security flex items-center justify-center mx-auto mb-6 shadow-xl shadow-cyan-500/20">
                          <CheckCircle2 className="w-10 h-10 text-white" />
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                          Document Successfully Protected!
                        </h2>
                        <p className="mt-3 text-sm sm:text-base text-muted-foreground">
                          Your PDF has been encrypted with <strong>256-bit AES encryption</strong>.
                          Anyone attempting to open this file will now be required to enter your password.
                        </p>

                        {/* File preview badge with thumbnail */}
                        <div className="mt-8 p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between text-left gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {thumbnailUrl ? (
                              <div className="w-12 h-16 rounded-lg overflow-hidden border border-border shadow-sm bg-white shrink-0">
                                <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center shrink-0 text-white font-extrabold text-xs shadow-md">
                                PDF
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-foreground truncate">{protectedFileName}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                <Lock className="w-3 h-3 text-brand" />
                                <span>Password protected • {selectedFile?.pageCount} pages</span>
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                            Encrypted
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                          <Button
                            variant="brand"
                            size="xl"
                            className="w-full sm:w-auto px-8 py-3 font-bold text-base shadow-lg shadow-brand/30 pdf-shine"
                            onClick={handleDownload}
                          >
                            <Download className="w-5 h-5 mr-2" />
                            Download Protected PDF
                          </Button>

                          <Button
                            variant="outline"
                            size="xl"
                            className="w-full sm:w-auto px-6 font-semibold"
                            onClick={handleOpenInEditor}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Open in Editor
                          </Button>

                          <Button
                            variant="ghost"
                            size="xl"
                            className="w-full sm:w-auto px-6 font-semibold text-muted-foreground hover:text-foreground"
                            onClick={handleReset}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Protect Another
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* CONFIGURATION VIEW */
                      <div className="space-y-8">
                      /* Document selected bar with rich thumbnail preview */
                      <div className="p-4 sm:p-5 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                          {thumbnailUrl ? (
                            <div className="w-16 h-22 rounded-xl overflow-hidden border border-border shadow-md bg-white shrink-0">
                              <img src={thumbnailUrl} alt="Document page 1" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-14 h-16 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center shrink-0 text-white font-black text-sm shadow-md">
                              PDF
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                                Ready to Encrypt
                              </span>
                              <span className="text-xs text-muted-foreground">{selectedFile.pageCount} page(s)</span>
                            </div>
                            <p className="font-bold text-base text-foreground truncate mt-1 max-w-xs sm:max-w-md">
                              {selectedFile.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {(selectedFile.file.size / (1024 * 1024)).toFixed(2)} MB • Client-side encryption
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-semibold shrink-0"
                        >
                          Change PDF
                        </Button>
                      </div>

                      {/* Step 2: Password Inputs */}
                      <div className="space-y-6 pt-4 border-t border-border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Primary Password Input */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Key className="w-3.5 h-3.5 text-brand" />
                              Choose Password
                            </span>
                            <span className="text-[11px] font-normal text-muted-foreground">Required to open PDF</span>
                          </label>

                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter strong password..."
                              className="w-full pr-10 pl-4 py-3 rounded-xl border border-input bg-background text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>

                          {/* Password Strength Meter */}
                          {password && (
                            <div className="pt-1.5 space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Password Strength:</span>
                                <span className="font-bold text-foreground">{strength.label}</span>
                              </div>
                              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex gap-1">
                                {[0, 1, 2, 3].map((step) => (
                                  <div
                                    key={step}
                                    className={`h-full flex-1 rounded-full transition-colors ${
                                      step <= strength.score ? strength.color : "bg-muted"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Confirm Password Input */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                              Confirm Password
                            </span>
                            {confirmPassword && (
                              <span
                                className={`text-[11px] font-bold ${
                                  passwordsMatch ? "text-emerald-600" : "text-destructive"
                                }`}
                              >
                                {passwordsMatch ? "✓ Passwords Match" : "✗ Do not match"}
                              </span>
                            )}
                          </label>

                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Re-enter password..."
                              className={`w-full pr-10 pl-4 py-3 rounded-xl border bg-background text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 ${
                                confirmPassword
                                  ? passwordsMatch
                                    ? "border-emerald-500 focus:ring-emerald-500/30"
                                    : "border-destructive focus:ring-destructive/30"
                                  : "border-input focus:ring-brand/40"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Advanced Options Toggle */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAdvanced(!showAdvanced)}
                          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-brand cursor-pointer transition-colors"
                        >
                          <span>{showAdvanced ? "Hide Advanced Permissions" : "Show Advanced Permissions & Algorithm"}</span>
                          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {showAdvanced && (
                          <div className="mt-4 p-5 rounded-2xl bg-muted/30 border border-border/80 space-y-5 animate-in fade-in-50 duration-200">
                            {/* Algorithm Selection */}
                            <div>
                              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                                Encryption Algorithm
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label
                                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                                    algorithm === "AES-256"
                                      ? "border-brand bg-brand-soft/40 text-foreground"
                                      : "border-border bg-card hover:bg-accent/40"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="algo"
                                    checked={algorithm === "AES-256"}
                                    onChange={() => setAlgorithm("AES-256")}
                                    className="mt-1"
                                  />
                                  <div>
                                    <div className="font-bold text-xs flex items-center gap-1.5">
                                      <span>AES-256 (PDF 2.0 / Acrobat X+)</span>
                                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-brand text-white">Recommended</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                      Highest military-grade security. Supported by all modern PDF viewers.
                                    </p>
                                  </div>
                                </label>

                                <label
                                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                                    algorithm === "RC4"
                                      ? "border-brand bg-brand-soft/40 text-foreground"
                                      : "border-border bg-card hover:bg-accent/40"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="algo"
                                    checked={algorithm === "RC4"}
                                    onChange={() => setAlgorithm("RC4")}
                                    className="mt-1"
                                  />
                                  <div>
                                    <div className="font-bold text-xs">RC4 128-bit (Legacy Acrobat 5+)</div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                      Backwards compatible with older or embedded systems.
                                    </p>
                                  </div>
                                </label>
                              </div>
                            </div>

                            {/* Permissions Checkboxes */}
                            <div className="pt-2 border-t border-border/60">
                              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                                Document Permissions
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <label className="flex items-center gap-2.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={allowPrinting}
                                    onChange={(e) => setAllowPrinting(e.target.checked)}
                                    className="rounded border-input text-brand focus:ring-brand w-4 h-4"
                                  />
                                  <span className="font-medium text-foreground">Allow printing document</span>
                                </label>

                                <label className="flex items-center gap-2.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={allowCopying}
                                    onChange={(e) => setAllowCopying(e.target.checked)}
                                    className="rounded border-input text-brand focus:ring-brand w-4 h-4"
                                  />
                                  <span className="font-medium text-foreground">Allow copying text & graphics</span>
                                </label>
                              </div>
                            </div>

                            {/* Optional Master/Owner Password */}
                            <div className="pt-2 border-t border-border/60">
                              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                                Permissions Master Password (Optional)
                              </label>
                              <input
                                type="password"
                                value={ownerPassword}
                                onChange={(e) => setOwnerPassword(e.target.value)}
                                placeholder="Leave blank to use the same password"
                                className="w-full max-w-md px-3.5 py-2 rounded-xl border border-input bg-background text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Main Encrypt CTA Button */}
                      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Protected with 256-bit AES encryption client-side</span>
                        </div>

                        <Button
                          variant="brand"
                          size="xl"
                          disabled={!password || !confirmPassword || !passwordsMatch || isProcessing}
                          onClick={handleProtect}
                          className="w-full sm:w-auto px-8 py-3.5 font-bold text-base shadow-xl shadow-brand/25 pdf-shine disabled:opacity-50"
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          {isProcessing ? processingStep || "Encrypting PDF..." : "Encrypt & Protect PDF"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </section>

        {/* 1. HOW IT WORKS WORKFLOW */}
        <HowItWorksSection
          badge="3-Step Encryption"
          title="How to Password Protect a PDF"
          subtitle="Simple, secure, and completed locally on your device in seconds."
          steps={[
            {
              step: "01",
              title: "Select Your PDF",
              description: "Drag & drop or browse your PDF document into the secure local browser workspace.",
              badgeText: "Private in-memory parsing",
              badgeIcon: FileUp,
              colorClass: "icon-security",
            },
            {
              step: "02",
              title: "Configure Password & Rights",
              description: "Enter a strong password and choose optional restrictions for printing or text copying.",
              badgeText: "256-bit AES encryption",
              badgeIcon: Key,
              colorClass: "icon-edit",
            },
            {
              step: "03",
              title: "Download Encrypted PDF",
              description: "Get your password-locked file instantly. Fully compatible with Adobe Acrobat and mobile readers.",
              badgeText: "ISO 32000 compliant",
              badgeIcon: Download,
              colorClass: "icon-convert",
            },
          ]}
        />

        {/* 2. WHY USE PROTECT PDF */}
        <WhyUseSection
          badge="Enterprise Grade Security"
          title="Why Protect PDFs with WebToolOcean"
          subtitle="A modern security architecture that guarantees zero data leakage and military-grade protection."
          benefits={[
            {
              icon: ShieldCheck,
              title: "100% In-Browser Privacy",
              description: "Your files never touch remote cloud servers. Hashing, encryption, and key generation run in local memory.",
              colorClass: "icon-security",
            },
            {
              icon: Lock,
              title: "Standard 256-Bit AES",
              description: "Industry-standard AES cipher prevents unauthorized viewing, brute-force cracking, and data extraction.",
              colorClass: "icon-edit",
            },
            {
              icon: FileCheck,
              title: "Universal Compatibility",
              description: "Protected documents open seamlessly on Adobe Acrobat, Apple Preview, Google Chrome, Edge, and iOS/Android.",
              colorClass: "icon-organize",
            },
            {
              icon: Key,
              title: "Custom Permissions",
              description: "Optionally restrict recipients from printing, copying graphics, or modifying your document.",
              colorClass: "icon-compress",
            },
            {
              icon: Sparkles,
              title: "Instant Processing",
              description: "Powered by WebAssembly for near-instant execution. Typical documents are encrypted in less than 400ms.",
              colorClass: "icon-convert",
            },
            {
              icon: ShieldAlert,
              title: "No Watermarks or Hidden Fees",
              description: "Export clean, professional files with zero watermarks, zero subscription traps, and unlimited daily usage.",
              colorClass: "icon-security",
            },
          ]}
        />

        {/* 3. CONSISTENT FAQ ACCORDION */}
        <ConsistentFaqSection
          badge="Protection FAQs"
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about encrypting and protecting your PDF files."
          items={protectFaq}
        />

        {/* 4. FINAL CTA BANNER */}
        <ConsistentCtaSection
          title="Protect Your Confidential Documents Today"
          subtitle="Secure contracts, bank statements, personal records, and confidential PDFs in seconds."
          primaryCtaText="Protect PDF Now"
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
              void handleFileSelect(files[0]);
            }
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="-rotate-12 transform text-brand/80">
              <Shield className="w-9 h-9 stroke-[1.8]" />
            </div>
            <div className="text-brand -mt-2">
              <Lock className="w-11 h-11 stroke-[1.8]" />
            </div>
            <div className="rotate-12 transform text-brand/80">
              <KeyRound className="w-9 h-9 stroke-[1.8]" />
            </div>
          </div>
          <p className="text-brand text-lg sm:text-xl font-bold tracking-tight mb-1">
            Drop PDF to Protect with Password
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
