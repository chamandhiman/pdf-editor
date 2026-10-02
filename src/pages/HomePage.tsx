import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  FileUp,
  FileText,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Monitor,
  CheckCircle2,
  Lock,
  Layers,
  HelpCircle,
  FileCheck,
  Briefcase,
  FileSignature,
  Receipt,
  GraduationCap,
  FolderLock,
  Compass,
  Download,
  Edit3,
  ExternalLink,
  Folder,
  Image as LucideImage,
  Star,
  TrendingUp,
  Users,
  Award,
  BookOpen,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";

import { SaasHeader } from "@/components/saas/SaasHeader";
import { SaasFooter } from "@/components/saas/SaasFooter";
import { ToolWorkspaceModal } from "@/components/saas/ToolWorkspaceModal";
import { EditorPreviewSection } from "@/components/saas/EditorPreviewSection";
import {
  pdfTools,
  pdfToolCategories,
  getToolsByCategory,
  type PdfTool,
  type ToolCategory,
} from "@/lib/pdf-tools-data";
import { setUploadedPdf } from "@/lib/pdf-store";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function HomePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [isDragging, setIsDragging] = useState(false);
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTool, setSelectedTool] = useState<PdfTool | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const dragCounter = useRef(0);

  // File Upload Handlers
  const handleProcessFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
        toast.error("Please select a valid PDF file.");
        return;
      }

      setIsUploading(true);
      const toastId = toast.loading(`Loading ${file.name}...`);

      try {
        const buffer = await file.arrayBuffer();
        setUploadedPdf(buffer, file.name);

        toast.success("Document ready for editing", { id: toastId });
        navigate({
          to: "/editor",
          search: { file: file.name },
        });
      } catch (err) {
        console.error("Failed to load PDF:", err);
        toast.error("Failed to read the PDF file. Please try another file.", { id: toastId });
      } finally {
        setIsUploading(false);
      }
    },
    [navigate],
  );

  // Global window drag & drop listener (Claude-style full screen overlay)
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

      const files = e.dataTransfer?.files;
      if (files && files.length > 0 && files[0]) {
        handleProcessFile(files[0]);
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0 && files[0]) {
        handleProcessFile(files[0]);
      }
    },
    [handleProcessFile],
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      handleProcessFile(files[0]);
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSelectTool = (tool: PdfTool) => {
    if (tool.id === "protect-pdf" || tool.slug === "protect-pdf") {
      navigate({ to: "/protect" });
    } else if (tool.id === "merge-pdf" || tool.slug === "merge-pdf") {
      navigate({ to: "/merge-pdf" });
    } else if (tool.id === "split-pdf" || tool.slug === "split-pdf") {
      navigate({ to: "/split-pdf" });
    } else if (tool.id === "delete-pages" || tool.slug === "delete-pages") {
      navigate({ to: "/remove-pages" });
    } else if (tool.id === "reorder-pages" || tool.slug === "reorder-pages") {
      navigate({ to: "/reorder-pages" });
    } else if (tool.id === "unlock-pdf" || tool.slug === "unlock-pdf") {
      navigate({ to: "/unlock-pdf" });
    } else if (tool.id === "ocr-pdf" || tool.slug === "ocr-pdf") {
      navigate({ to: "/ocr-pdf" });
    } else if (tool.id === "compress-pdf" || tool.slug === "compress-pdf") {
      navigate({ to: "/compress-pdf" });
    } else if (tool.id === "jpg-to-pdf" || tool.slug === "jpg-to-pdf") {
      navigate({ to: "/jpg-to-pdf" });
    } else if (tool.id === "pdf-to-word" || tool.slug === "pdf-to-word") {
      navigate({ to: "/pdf-to-word" });
    } else if (tool.id === "pdf-to-excel" || tool.slug === "pdf-to-excel") {
      navigate({ to: "/pdf-to-excel" });
    } else if (tool.status === "available" && tool.slug === "edit-pdf") {
      navigate({ to: "/edit-pdf" });
    } else {
      setSelectedTool(tool);
    }
  };

  // Filtered tools for "All PDF Tools" section
  const filteredTools = pdfTools.filter((tool) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeCategory === "all" ||
      tool.category.toLowerCase() === activeCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Grouped tools for Core Features
  const editTools = getToolsByCategory("edit");
  const organizeTools = getToolsByCategory("organize");
  const convertTools = getToolsByCategory("convert").slice(0, 10);
  const utilityTools = pdfTools.filter(
    (t) =>
      t.category === "compress" ||
      t.category === "ocr" ||
      t.category === "security" ||
      t.category === "sign",
  );

  // FAQ Items (11 specified in requirements)
  const faqItems = [
    {
      q: "What can I do with PDF Studio?",
      a: "PDF Studio is a high-performance web-based PDF suite. You can view, annotate, add text, headings, shapes, freehand drawings, stamps, insert images, rotate, and delete pages directly inside your web browser. You can export clean, vector-rendered PDFs instantly.",
    },
    {
      q: "Can I edit existing PDF text?",
      a: "Yes! PDF Studio allows you to overlay new text, headings, paragraphs, lists, and shapes directly over your document pages. For native scanned PDFs, OCR text recognition and direct text layer editing workflows are currently being integrated.",
    },
    {
      q: "Can I upload a PDF from my computer?",
      a: "Absolutely. You can click 'Upload your PDF' or drag and drop any PDF file directly into the browser. Documents are processed locally on your machine without mandatory cloud uploading.",
    },
    {
      q: "Do I need an account?",
      a: "No account is required to start editing and downloading PDFs. You can open any PDF, make edits, and download the finished document immediately. Optional accounts allow you to sync preferences and manage saved documents across devices.",
    },
    {
      q: "Can I sign a PDF online?",
      a: "Yes. PDF Studio includes an integrated digital signature tool in the editor. You can draw your signature with your mouse or trackpad, type your name, customize ink colors, and stamp it anywhere on any page.",
    },
    {
      q: "Can I convert PDF to Word?",
      a: "PDF to Word conversion is currently under active development. You can preview the upcoming format preservation engine in our Convert section and subscribe for early access updates.",
    },
    {
      q: "Can I merge multiple PDFs?",
      a: "The multi-file merge engine is currently scheduled for the next platform release. Within the current editor, you can manage, reorder, rotate, and delete pages within your active document.",
    },
    {
      q: "Can I compress a PDF?",
      a: "A dedicated stream-compression utility is coming soon. The current PDF Studio export engine already optimizes image elements and font embeds to minimize output file size upon export.",
    },
    {
      q: "Can I edit PDFs on mobile?",
      a: "Yes. PDF Studio is built with responsive web standards and works seamlessly on tablets and modern mobile browsers with touch controls for annotating and reviewing documents on the go.",
    },
    {
      q: "Can I save my documents and continue later?",
      a: "Yes. PDF Studio features automatic local IndexedDB document persistence. If you accidentally close your tab or refresh, your current document and unsaved overlays can be restored from your local session.",
    },
    {
      q: "Are PDF tools free?",
      a: "Yes, our core PDF editing, annotation, signature, and page management tools are completely free to use with no hidden fees or credit card requirements.",
    },
  ];

  // Use cases list
  const useCases = [
    {
      title: "Business Documents",
      desc: "Prepare pitch decks, company memos, and executive briefs with customized branding and corporate notes.",
      icon: Briefcase,
      color: "text-blue-600 bg-blue-500/10 dark:text-blue-400",
    },
    {
      title: "Contracts & Agreements",
      desc: "Fill out vendor agreements, place legal signatures, and date stamps without printing a single page.",
      icon: FileSignature,
      color: "text-purple-600 bg-purple-500/10 dark:text-purple-400",
    },
    {
      title: "Invoices & Billing",
      desc: "Stamp payment approvals, annotate line items, and highlight discrepancies for accounting teams.",
      icon: Receipt,
      color: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
    },
    {
      title: "Resumes & CVs",
      desc: "Polish and tailor resume copy, adjust layout sections, and export crisp, high-resolution PDFs for recruiters.",
      icon: FileCheck,
      color: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
    },
    {
      title: "Forms & Applications",
      desc: "Quickly fill in checkboxes, add formal details, insert digital signatures, and submit official forms on time.",
      icon: Edit3,
      color: "text-indigo-600 bg-indigo-500/10 dark:text-indigo-400",
    },
    {
      title: "Research & Reports",
      desc: "Highlight key statistical findings, add margin notes, and extract critical excerpts for academic papers.",
      icon: FileText,
      color: "text-cyan-600 bg-cyan-500/10 dark:text-cyan-400",
    },
    {
      title: "Students & Academia",
      desc: "Annotate lecture slides, complete digital assignment handouts, and study lecture notes collaboratively.",
      icon: GraduationCap,
      color: "text-rose-600 bg-rose-500/10 dark:text-rose-400",
    },
    {
      title: "Personal Documents",
      desc: "Safely organize tax filings, medical records, leases, and identity cards with local client-side security.",
      icon: FolderLock,
      color: "text-teal-600 bg-teal-500/10 dark:text-teal-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-brand selection:text-white">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Global SaaS Header */}
      <SaasHeader
        onOpenUploadModal={handleTriggerUpload}
        onSelectTool={handleSelectTool}
      />

      <main className="flex-1">
        {/* ============================================================ */}
        {/* 2. HERO SECTION (Inline: Left Text, Right Upload Box)        */}
        {/* ============================================================ */}
        <section className="relative pt-10 pb-16 md:pt-20 md:pb-28 overflow-hidden pdf-hero-bg">
          {/* Rich animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-radial from-brand/8 to-transparent blur-3xl" />
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-brand/10 to-orange-500/5 blur-3xl" />
            <div className="absolute bottom-0 -left-16 w-64 h-64 rounded-full bg-gradient-to-tr from-blue-500/6 to-transparent blur-2xl" />
            {/* Decorative PDF icon floaters */}
            <div className="absolute top-12 right-12 lg:right-[42%] opacity-[0.06] dark:opacity-[0.04] animate-float">
              <FileText className="w-32 h-32 text-brand" strokeWidth={1} />
            </div>
            <div className="absolute bottom-16 left-8 lg:left-[20%] opacity-[0.05] dark:opacity-[0.03] animate-float-1">
              <Layers className="w-24 h-24 text-blue-500" strokeWidth={1} />
            </div>
            <div className="absolute top-24 left-4 lg:left-[8%] opacity-[0.05] dark:opacity-[0.03] animate-float-2">
              <ShieldCheck className="w-20 h-20 text-emerald-500" strokeWidth={1} />
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-center">
              {/* Left Column: Headline, Subheading, CTAs */}
              <div className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start">
                {/* Trust Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-brand/10 to-orange-500/10 border border-brand/25 text-brand text-xs font-semibold mb-6 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Next-Gen In-Browser PDF Suite</span>
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                  Start Editing PDF
                  <br />
                  <span className="gradient-brand">
                    Upload Your File
                  </span>
                </h1>

                {/* Subheading */}
                <p className="mt-5 text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-xl">
                  Edit existing text, add headings, sign documents, insert images, and organize pages — 100% private, right in your web browser.
                </p>

                {/* Action Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleTriggerUpload}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-[4px] bg-brand text-white font-bold text-base shadow-lg shadow-brand/30 hover:shadow-brand/50 hover:bg-brand/90 transition-all active:scale-[0.98] cursor-pointer animate-pulse-glow"
                  >
                    <FileUp className="w-5 h-5" />
                    <span>Start Editing PDF — Free</span>
                  </button>

                  <a
                    href="#tools"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-[4px] border border-border bg-card/70 backdrop-blur-sm hover:bg-accent text-foreground font-semibold text-base transition-colors hover:border-brand/30"
                  >
                    <Compass className="w-4 h-4 text-muted-foreground" />
                    <span>Explore All Tools</span>
                  </a>
                </div>

                {/* Stats row */}
                <div className="mt-9 flex flex-wrap items-center justify-center lg:justify-start gap-5">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {["bg-brand", "bg-blue-500", "bg-emerald-500", "bg-amber-500"].map((c, i) => (
                        <div key={i} className={`w-6 h-6 rounded-full ${c} ring-2 ring-background`} />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">50K+ users trust us</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                    <span className="text-xs font-semibold text-muted-foreground ml-1">4.9 / 5</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    No watermarks
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Lock className="w-3.5 h-3.5 text-brand" />
                    Files stay private
                  </span>
                </div>
              </div>

              {/* Right Column: Premium Upload Box */}
              <div className="lg:col-span-5 w-full max-w-lg mx-auto lg:max-w-none">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleTriggerUpload}
                  className={`relative group rounded-3xl p-8 sm:p-10 text-center transition-all cursor-pointer ${
                    isDragging
                      ? "bg-brand-soft border-2 border-brand scale-[1.02] shadow-xl shadow-brand/20"
                      : "bg-gradient-to-br from-white to-slate-50/80 dark:from-card dark:to-card border-2 border-dashed border-brand/30 hover:border-brand/60 hover:shadow-2xl shadow-lg"
                  }`}
                >
                  {/* Colorful corner accents */}
                  <div className="absolute top-0 left-0 w-16 h-16 rounded-tl-3xl overflow-hidden pointer-events-none">
                    <div className="absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-br from-brand/20 to-transparent rounded-full" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-16 h-16 rounded-br-3xl overflow-hidden pointer-events-none">
                    <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-gradient-to-tl from-blue-500/15 to-transparent rounded-full" />
                  </div>

                  <div className="flex flex-col items-center justify-center relative z-10">
                    {/* PDF icon with red gradient */}
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 transition-all group-hover:scale-110 shadow-lg ${
                      isDragging
                        ? "icon-edit shadow-brand/30"
                        : "icon-edit shadow-brand/20"
                    }`}>
                      <FileText className="w-10 h-10 text-white drop-shadow" />
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                      Start Editing PDF
                    </h3>
                    <p className="mt-1.5 text-sm sm:text-base text-muted-foreground font-medium">
                      Upload your file or drop PDF here to start editing
                    </p>

                    <div className="mt-5 flex items-center justify-center gap-3 w-36">
                      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">or</span>
                      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
                    </div>

                    <button
                      type="button"
                      className="mt-4 inline-flex items-center gap-2 px-7 py-3 rounded-[4px] bg-brand text-white text-sm font-bold shadow-lg shadow-brand/25 hover:bg-brand/90 transition-all pointer-events-none"
                    >
                      <FileUp className="w-4 h-4" />
                      <span>Upload PDF File to Edit</span>
                    </button>

                    {/* Feature badges */}
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                      {[
                        { icon: ShieldCheck, text: "100% Private", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
                        { icon: Zap, text: "Instant", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" },
                        { icon: Lock, text: "No Upload", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" },
                      ].map(({ icon: Icon, text, color }) => (
                        <span key={text} className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${color}`}>
                          <Icon className="w-3 h-3" />{text}
                        </span>
                      ))}
                    </div>
                  </div>

                  {isUploading && (
                    <div className="absolute inset-0 bg-card/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center z-20">
                      <div className="w-12 h-12 border-[3px] border-brand border-t-transparent rounded-full animate-spin" />
                      <p className="mt-4 text-sm font-bold text-foreground">Loading your PDF...</p>
                      <p className="text-xs text-muted-foreground mt-1">Preparing editor workspace</p>
                    </div>
                  )}
                </div>

                {/* Social proof below upload box */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { icon: TrendingUp, label: "All-in-One", sub: "PDF Tools", color: "text-brand" },
                    { icon: Users, label: "50K+", sub: "Users", color: "text-blue-500" },
                    { icon: Award, label: "4.9★", sub: "Rated", color: "text-amber-500" },
                  ].map(({ icon: Icon, label, sub, color }) => (
                    <div key={label} className="rounded-xl border border-border bg-card/60 backdrop-blur p-3 text-center hover:shadow-sm transition-shadow">
                      <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
                      <p className="text-sm font-bold text-foreground">{label}</p>
                      <p className="text-[10px] text-muted-foreground">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Full-Screen Claude-Style Drag & Drop Overlay (Screenshot 3) */}
        {isWindowDragging && (
          <div
            className="fixed inset-3 sm:inset-4 z-50 rounded-2xl border-2 border-brand bg-background/90 dark:bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto transition-all animate-in fade-in duration-150 shadow-2xl"
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
                handleProcessFile(files[0]);
              }
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="-rotate-12 transform text-brand">
                <LucideImage className="w-8 h-8 stroke-[1.8]" />
              </div>
              <div className="text-brand -mt-2">
                <FileText className="w-9 h-9 stroke-[1.8]" />
              </div>
              <div className="rotate-12 transform text-brand">
                <Folder className="w-8 h-8 stroke-[1.8]" />
              </div>
            </div>
            <p className="text-brand text-base sm:text-lg font-medium tracking-tight">
              Drop files here
            </p>
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. CORE FEATURES SECTION                                     */}
        {/* ============================================================ */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-muted/20 to-muted/40 border-y border-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand/8 border border-brand/20 text-brand text-xs font-bold uppercase tracking-widest mb-4">
                <Cpu className="w-3.5 h-3.5" />
                Core Modules
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                Everything PDF — In One Place
              </p>
              <p className="mt-3 text-muted-foreground text-base max-w-xl mx-auto">
                Specialized toolsets engineered for editing, organizing, converting, and protecting your documents.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Organize PDFs */}
              <div className="group rounded-2xl border border-border bg-card p-6 flex flex-col pdf-card-glow overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-1 icon-organize rounded-t-2xl" />
                <div className="flex items-center gap-3 mb-4 pt-1">
                  <div className="w-11 h-11 rounded-xl icon-organize flex items-center justify-center shadow-md">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Organize PDFs</h3>
                    <span className="text-xs text-muted-foreground">Page management</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  Rotate, rearrange, delete and extract pages within your documents.
                </p>
                <div className="space-y-1.5 mt-auto">
                  {organizeTools.map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => handleSelectTool(tool)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent flex items-center justify-between group/item transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <tool.icon className="w-3.5 h-3.5 text-muted-foreground group-hover/item:text-blue-600 flex-shrink-0" />
                        <span className="truncate">{tool.name}</span>
                      </div>
                      {tool.status === "available" ? (
                        <span className="status-active text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ml-1">Active</span>
                      ) : (
                        <span className="status-preview text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ml-1">Preview</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Convert PDFs */}
              <div className="group rounded-2xl border border-border bg-card p-6 flex flex-col pdf-card-glow overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-1 icon-convert rounded-t-2xl" />
                <div className="flex items-center gap-3 mb-4 pt-1">
                  <div className="w-11 h-11 rounded-xl icon-convert flex items-center justify-center shadow-md">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Convert PDFs</h3>
                    <span className="text-xs text-muted-foreground">Format transformations</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  High-fidelity document and image conversions to and from PDF format.
                </p>
                <div className="space-y-1.5 mt-auto">
                  {convertTools.slice(0, 7).map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => handleSelectTool(tool)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent flex items-center justify-between group/item transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <tool.icon className="w-3.5 h-3.5 text-muted-foreground group-hover/item:text-emerald-600 flex-shrink-0" />
                        <span className="truncate">{tool.name}</span>
                      </div>
                      <span className="status-staging text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ml-1">Staging</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* PDF Utilities */}
              <div className="group rounded-2xl border border-border bg-card p-6 flex flex-col pdf-card-glow overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-1 icon-compress rounded-t-2xl" />
                <div className="flex items-center gap-3 mb-4 pt-1">
                  <div className="w-11 h-11 rounded-xl icon-compress flex items-center justify-center shadow-md">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">PDF Utilities</h3>
                    <span className="text-xs text-muted-foreground">Security &amp; OCR</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  Compress, sign, protect, watermark and add page numbering with ease.
                </p>
                <div className="space-y-1.5 mt-auto">
                  {utilityTools.slice(0, 7).map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => handleSelectTool(tool)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent flex items-center justify-between group/item transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <tool.icon className="w-3.5 h-3.5 text-muted-foreground group-hover/item:text-purple-600 flex-shrink-0" />
                        <span className="truncate">{tool.name}</span>
                      </div>
                      {tool.status === "available" ? (
                        <span className="status-active text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ml-1">Active</span>
                      ) : (
                        <span className="status-preview text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ml-1">Preview</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 4. "ALL PDF TOOLS" SECTION (Searchable & Filterable)         */}
        {/* ============================================================ */}
        <section id="tools" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand mb-2">
                <Compass className="w-4 h-4" />
                Product Directory
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                All PDF Tools
              </h2>
              <p className="mt-2 text-muted-foreground text-sm sm:text-base max-w-xl">
                Select from our complete library of specialized PDF utilities. Cleanly organized
                for instant access.
              </p>
            </div>

            {/* Live Search Input */}
            <div className="w-full md:w-80 relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PDF tools (e.g. text, sign)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar touch-scroll px-1">
            {pdfToolCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === category.id
                    ? "bg-brand text-white shadow-sm"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Filtered Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredTools.length > 0 ? (
              filteredTools.map((tool) => {
                const catIconClass = tool.category === "edit" ? "icon-edit" :
                  tool.category === "organize" ? "icon-organize" :
                  tool.category === "convert" ? "icon-convert" :
                  tool.category === "compress" ? "icon-compress" :
                  tool.category === "sign" ? "icon-sign" :
                  tool.category === "security" ? "icon-security" :
                  tool.category === "ocr" ? "icon-ocr" : "icon-edit";
                return (
                  <div
                    key={tool.id}
                    onClick={() => handleSelectTool(tool)}
                    className="group relative rounded-2xl border border-border bg-card p-5 hover:border-brand/30 transition-all cursor-pointer flex flex-col justify-between pdf-card-glow pdf-shine"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-10 h-10 rounded-xl ${catIconClass} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                          <tool.icon className="w-5 h-5 text-white" />
                        </div>
                        {tool.status === "available" ? (
                          <span className="status-active text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide">
                            Ready
                          </span>
                        ) : (
                          <span className="status-preview text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide">
                            Soon
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-foreground text-base group-hover:text-brand transition-colors">
                        {tool.name}
                      </h3>
                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-bold text-brand group-hover:text-brand/80 transition-colors">
                      <span>{tool.status === "available" ? "Open Tool" : "Learn More"}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-16 text-center">
                <div className="w-16 h-16 rounded-2xl icon-edit flex items-center justify-center mx-auto mb-4 opacity-30">
                  <Search className="w-7 h-7 text-white" />
                </div>
                <p className="text-base font-bold text-foreground">No matching tools found</p>
                <p className="text-xs text-muted-foreground mt-1.5">Try another keyword or clear the category filter.</p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
                >
                  <ArrowRight className="w-3 h-3" /> Reset filters
                </button>
              </div>
            )}
          </div>

          {/* View All Tools CTA */}
          <div className="mt-12 text-center">
            <Link
              to="/tools"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-brand text-white font-bold text-sm shadow-lg shadow-brand/25 hover:bg-brand/90 hover:shadow-brand/40 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>Browse All PDF Tools</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 5. HOW IT WORKS                                              */}
        {/* ============================================================ */}
        <section className="py-20 bg-muted/40 border-y border-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-widest font-bold text-brand">
                Simple Workflow
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-2">
                How PDF Studio Works
              </h2>
              <p className="mt-3 text-muted-foreground text-base">
                Three effortless steps to complete your document edits directly in the browser.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className="relative rounded-2xl border border-border bg-card p-8 flex flex-col items-center text-center pdf-card-glow overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 icon-edit rounded-t-2xl" />
                <div className="w-14 h-14 rounded-2xl icon-edit flex items-center justify-center font-extrabold text-xl mb-6 shadow-lg text-white">
                  01
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Upload PDF</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Drag and drop or click to upload your PDF directly into the browser workspace — no server, no wait.
                </p>
                <div className="mt-6 w-full pt-4 border-t border-border/50 text-xs font-semibold text-brand flex items-center justify-center gap-1.5">
                  <FileUp className="w-4 h-4" />
                  <span>Instant local processing</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative rounded-2xl border border-border bg-card p-8 flex flex-col items-center text-center pdf-card-glow overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 icon-organize rounded-t-2xl" />
                <div className="w-14 h-14 rounded-2xl icon-organize flex items-center justify-center font-extrabold text-xl mb-6 shadow-lg text-white">
                  02
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Edit & Customize</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Make changes with interactive text, headings, signatures, drawings, and annotations on the visual canvas.
                </p>
                <div className="mt-6 w-full pt-4 border-t border-border/50 text-xs font-semibold text-blue-600 flex items-center justify-center gap-1.5">
                  <Edit3 className="w-4 h-4" />
                  <span>Precise visual canvas</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative rounded-2xl border border-border bg-card p-8 flex flex-col items-center text-center pdf-card-glow overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 icon-convert rounded-t-2xl" />
                <div className="w-14 h-14 rounded-2xl icon-convert flex items-center justify-center font-extrabold text-xl mb-6 shadow-lg text-white">
                  03
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Download & Share</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Export your finished document with clean vector text, zero watermarks, and full PDF compatibility.
                </p>
                <div className="mt-6 w-full pt-4 border-t border-border/50 text-xs font-semibold text-emerald-600 flex items-center justify-center gap-1.5">
                  <Download className="w-4 h-4" />
                  <span>Direct browser export</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 6. WHY PDF STUDIO (Product Benefits)                        */}
        {/* ============================================================ */}
        <section className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest font-bold text-brand">
              Enterprise Grade
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-2">
              Why PDF Studio
            </h2>
            <p className="mt-3 text-muted-foreground text-base">
              A modern architecture designed around security, speed, and cross-platform simplicity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-border bg-card p-6 pdf-card-glow">
              <div className="w-11 h-11 rounded-xl icon-organize flex items-center justify-center mb-4 shadow-sm">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1.5">
                Works in any browser
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Chrome, Safari, Edge, Firefox — no downloads, no plugins, no configuration required.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 pdf-card-glow">
              <div className="w-11 h-11 rounded-xl icon-compress flex items-center justify-center mb-4 shadow-sm">
                <Monitor className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1.5">No software installation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Forget bulky desktop installers. Everything is ready the instant you open the page.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 pdf-card-glow">
              <div className="w-11 h-11 rounded-xl icon-convert flex items-center justify-center mb-4 shadow-sm">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1.5">Blazing fast PDF processing</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Powered by WebAssembly and HTML5 Canvas for instantaneous page rendering and zoom.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 pdf-card-glow">
              <div className="w-11 h-11 rounded-xl icon-edit flex items-center justify-center mb-4 shadow-sm">
                <Edit3 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1.5">Modern PDF editing tools</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Overlay headings, lists, checkmarks, stamps, and custom highlights directly on PDFs.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 pdf-card-glow">
              <div className="w-11 h-11 rounded-xl icon-sign flex items-center justify-center mb-4 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1.5">Desktop, tablet &amp; mobile</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Adaptive layout ensures smooth document review whether you&apos;re at a desk or on the go.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 pdf-card-glow">
              <div className="w-11 h-11 rounded-xl icon-security flex items-center justify-center mb-4 shadow-sm">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1.5">Your documents stay private</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Files are read into local memory only. Nothing is sent to external servers or third parties.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 7. USE CASES SECTION                                         */}
        {/* ============================================================ */}
        <section className="py-20 bg-muted/30 border-y border-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-widest font-bold text-brand">
                Versatility
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-2">
                Built For Every Document Workflow
              </h2>
              <p className="mt-3 text-muted-foreground text-base">
                Whether you are executing enterprise contracts or polishing academic coursework.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {useCases.map((uc, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-card p-5 pdf-card-glow cursor-default"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${uc.color}`}>
                    <uc.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-foreground text-base mb-1.5">{uc.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{uc.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 8. PRODUCT PREVIEW SECTION                                   */}
        {/* ============================================================ */}
        <EditorPreviewSection onTryEditor={handleTriggerUpload} />

        {/* ============================================================ */}
        {/* 9. PRICING / PREMIUM TEASER                                  */}
        {/* ============================================================ */}
        <section id="pricing" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest font-bold text-brand">
              Simple Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-2">
              Transparent Plans For Every Need
            </h2>
            <p className="mt-3 text-muted-foreground text-base">
              Start completely free today. Upgrade when your team needs advanced high-volume
              capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="rounded-3xl border border-border bg-card p-8 flex flex-col justify-between shadow-sm">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-xs font-semibold text-muted-foreground mb-4">
                  Community Edition
                </div>
                <h3 className="text-2xl font-bold text-foreground">Free</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Core PDF tools for individuals and quick everyday edits.
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">$0</span>
                  <span className="text-sm text-muted-foreground">/ month</span>
                </div>

                <div className="mt-8 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Basic PDF tools</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Upload and edit any PDF</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Basic downloads without watermarks</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Local in-browser session storage</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={handleTriggerUpload}
                  className="w-full py-3 rounded-xl border border-input bg-card font-semibold text-sm text-foreground hover:bg-accent transition-colors cursor-pointer"
                >
                  Start Free Now
                </button>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="rounded-3xl border-2 border-brand bg-card p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-brand text-white text-[11px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">
                Most Popular
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-soft text-brand text-xs font-semibold mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  Pro Plans
                </div>
                <h3 className="text-2xl font-bold text-foreground">Pro</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Unlimited document saving, cloud storage & sync across devices.
                </p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-foreground">$2</span>
                  <span className="text-sm text-muted-foreground">/ mo (₹199/mo)</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full ml-1">
                    $10/yr (₹999)
                  </span>
                </div>

                <div className="mt-8 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                    <span>Advanced tools & OCR parsing</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                    <span>More document storage & cloud sync</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                    <span>Advanced PDF batch conversion</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                    <span>Priority features & early releases</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <Link
                  to="/pricing"
                  className="w-full py-3 rounded-xl bg-brand text-white font-semibold text-sm shadow-md hover:bg-brand/90 transition-colors flex items-center justify-center gap-2"
                >
                  <span>View Plans</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 10. FAQ ACCORDION                                            */}
        {/* ============================================================ */}
        <section id="faq" className="py-20 bg-muted/30 border-y border-border/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-xs uppercase tracking-widest font-bold text-brand">
                Got Questions?
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-2">
                Frequently Asked Questions
              </h2>
              <p className="mt-3 text-muted-foreground text-base">
                Factual answers regarding PDF Studio capabilities, privacy, and roadmap.
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-3">
              {faqItems.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="rounded-2xl border border-border bg-card px-6 py-1 data-[state=open]:shadow-sm"
                >
                  <AccordionTrigger className="text-base font-semibold text-foreground hover:no-underline py-4 text-left">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4 pt-1">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 11. FINAL CTA SECTION                                        */}
        {/* ============================================================ */}
        <section className="py-20 md:py-28 relative overflow-hidden">
          {/* Bold red gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand to-orange-600 pointer-events-none" />
          {/* Decorative circles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/5" />
            <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-white/5" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/3" />
            <div className="absolute top-8 right-8 opacity-20 animate-float">
              <FileText className="w-24 h-24 text-white" strokeWidth={1} />
            </div>
            <div className="absolute bottom-8 left-8 opacity-15 animate-float-1">
              <Layers className="w-20 h-20 text-white" strokeWidth={1} />
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mx-auto mb-6 shadow-lg border border-white/20">
              <FileText className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Your PDFs, Perfectly Edited
            </h2>

            <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
              Join 50,000+ users editing PDFs directly in their browser — no installs, no watermarks, no limits.
            </p>

            {/* Star rating */}
            <div className="mt-5 flex items-center justify-center gap-1.5">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
              <span className="ml-2 text-white/90 text-sm font-semibold">4.9 out of 5 from 2,000+ reviews</span>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleTriggerUpload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-xl bg-white text-brand font-bold text-base shadow-xl hover:bg-white/95 transition-all active:scale-[0.98] cursor-pointer"
              >
                <FileUp className="w-5 h-5" />
                <span>Start Editing — Free</span>
              </button>

              <Link
                to="/tools"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl border border-white/30 text-white font-semibold text-base hover:bg-white/10 transition-colors"
              >
                <span>Browse All Tools</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <p className="mt-5 text-xs text-white/60 flex items-center justify-center gap-3">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> No sign-up required</span>
              <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> 100% private</span>
              <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Instant processing</span>
            </p>
          </div>
        </section>
      </main>

      {/* Global SaaS Footer */}
      <SaasFooter onSelectTool={handleSelectTool} />

      {/* Interactive Tool Modal */}
      <ToolWorkspaceModal
        tool={selectedTool}
        isOpen={Boolean(selectedTool)}
        onClose={() => setSelectedTool(null)}
        onOpenEditor={handleTriggerUpload}
      />
    </div>
  );
}
