import { useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Compass, ArrowRight, FileUp, Zap, ShieldCheck, Globe, Download, Lock, FileCheck } from "lucide-react";
import { toast } from "sonner";

import { SaasHeader } from "@/components/saas/SaasHeader";
import { SaasFooter } from "@/components/saas/SaasFooter";
import { ToolWorkspaceModal } from "@/components/saas/ToolWorkspaceModal";
import { HowItWorksSection } from "@/components/saas/HowItWorksSection";
import { WhyUseSection } from "@/components/saas/WhyUseSection";
import { ConsistentFaqSection } from "@/components/saas/ConsistentFaqSection";
import { ConsistentCtaSection } from "@/components/saas/ConsistentCtaSection";
import { toolsFaq } from "@/lib/faq-data";
import {
  pdfTools,
  pdfToolCategories,
  type PdfTool,
} from "@/lib/pdf-tools-data";
import { setUploadedPdf } from "@/lib/pdf-store";

export function ToolsPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedTool, setSelectedTool] = useState<PdfTool | null>(null);

  const handleProcessFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      toast.error("Please select a valid PDF file.");
      return;
    }

    const toastId = toast.loading(`Loading ${file.name}...`);
    try {
      const buffer = await file.arrayBuffer();
      setUploadedPdf(buffer, file.name);

      toast.success("Document loaded successfully", { id: toastId });
      navigate({
        to: "/editor",
        search: { file: file.name },
      });
    } catch (err) {
      console.error("Failed to load PDF:", err);
      toast.error("Failed to read PDF file.", { id: toastId });
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
    } else if (tool.id === "pdf-to-ppt" || tool.slug === "pdf-to-ppt") {
      navigate({ to: "/pdf-to-ppt" });
    } else if (tool.id === "pdf-to-jpg" || tool.slug === "pdf-to-jpg") {
      navigate({ to: "/pdf-to-jpg" });
    } else if (tool.id === "pdf-to-png" || tool.slug === "pdf-to-png") {
      navigate({ to: "/pdf-to-png" });
    } else if (tool.id === "word-to-pdf" || tool.slug === "word-to-pdf") {
      navigate({ to: "/word-to-pdf" });
    } else if (tool.id === "excel-to-pdf" || tool.slug === "excel-to-pdf") {
      navigate({ to: "/excel-to-pdf" });
    } else if (tool.id === "ppt-to-pdf" || tool.slug === "ppt-to-pdf") {
      navigate({ to: "/ppt-to-pdf" });
    } else if (tool.id === "png-to-pdf" || tool.slug === "png-to-pdf") {
      navigate({ to: "/png-to-pdf" });
    } else if (tool.id === "rotate-pdf" || tool.slug === "rotate-pdf") {
      navigate({ to: "/rotate-pdf" });
    } else if (tool.id === "watermark-pdf" || tool.slug === "watermark-pdf") {
      navigate({ to: "/watermark-pdf" });
    } else if (tool.id === "extract-pages" || tool.slug === "extract-pages") {
      navigate({ to: "/extract-pages" });
    } else if (tool.id === "page-numbers" || tool.slug === "page-numbers") {
      navigate({ to: "/page-numbers" });
    } else if (tool.id === "sign-pdf" || tool.slug === "sign-pdf") {
      navigate({ to: "/sign-pdf" });
    } else if (tool.id === "stamp-pdf" || tool.slug === "stamp-pdf") {
      navigate({ to: "/stamp-pdf" });
    } else if (tool.id === "edit-pdf" || tool.slug === "edit-pdf") {
      navigate({ to: "/edit-pdf" });
    } else {
      setSelectedTool(tool);
    }
  };

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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-brand selection:text-white">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleProcessFile(e.target.files[0]);
        }}
      />

      <SaasHeader
        onOpenUploadModal={handleTriggerUpload}
        onSelectTool={handleSelectTool}
      />

      <main className="flex-1 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-soft text-brand text-xs font-semibold mb-4">
              <Compass className="w-3.5 h-3.5" />
              <span>Complete PDF Suite</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              All PDF Tools
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground">
              Explore tools for editing, converting, compressing, organizing, and protecting your documents.
            </p>
          </div>

          {/* Search & Categories Bar */}
          <div className="max-w-4xl mx-auto mb-10 space-y-6">
            <div className="relative">
              <Search className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools by name or description (e.g., merge, compress, excel, signature)..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-input bg-card text-base text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>

            <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 no-scrollbar touch-scroll px-1">
              {pdfToolCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === category.id
                      ? "bg-brand text-white shadow-sm"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredTools.map((tool) => {
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
                  className="group rounded-2xl border border-border bg-card p-5 hover:border-brand/30 transition-all cursor-pointer flex flex-col justify-between pdf-card-glow pdf-shine"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl ${catIconClass} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                        <tool.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="status-active text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide font-medium">
                        Active
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground text-base group-hover:text-brand transition-colors">
                      {tool.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-bold text-brand group-hover:text-brand/80 transition-colors">
                    <span>Open Tool</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* 1. HOW IT WORKS SECTION */}
        <HowItWorksSection
          badge="Productivity Directory"
          title="How to Use WebToolOcean PDF Tools"
          subtitle="Everything you need to modify, encrypt, and transform documents in 3 clean steps."
          steps={[
            {
              step: "01",
              title: "Choose Your Specialty Tool",
              description: "Select from dedicated utilities for editing, protection, page organization, and conversions.",
              badgeText: "Dedicated PDF modules",
              badgeIcon: Compass,
              colorClass: "icon-edit",
            },
            {
              step: "02",
              title: "Instant In-Browser Processing",
              description: "Files are rendered and transformed locally in browser memory without sending private data to cloud servers.",
              badgeText: "Zero server uploads",
              badgeIcon: Zap,
              colorClass: "icon-organize",
            },
            {
              step: "03",
              title: "Download or Continue Editing",
              description: "Save high-fidelity PDF documents or seamlessly open them in the full in-browser editor workspace.",
              badgeText: "Lossless vector quality",
              badgeIcon: Download,
              colorClass: "icon-convert",
            },
          ]}
        />

        {/* 2. WHY USE SECTION */}
        <WhyUseSection
          badge="Why WebToolOcean"
          title="A Modern PDF Suite Built for Privacy & Speed"
          subtitle="No software bloat, no desktop installs, and zero security compromises."
          benefits={[
            {
              icon: Globe,
              title: "100% Web-Based Suite",
              description: "Runs seamlessly in Chrome, Edge, Safari, and Firefox across Windows, macOS, Linux, and mobile devices.",
              colorClass: "icon-organize",
            },
            {
              icon: Lock,
              title: "Military-Grade Encryption",
              description: "Protect sensitive contracts and financial statements with standard 256-bit AES password encryption.",
              colorClass: "icon-security",
            },
            {
              icon: Zap,
              title: "High-Performance Engine",
              description: "Engineered with WebAssembly and HTML5 Canvas for sub-second rendering, zooming, and processing.",
              colorClass: "icon-edit",
            },
            {
              icon: ShieldCheck,
              title: "Pure Local Sandbox",
              description: "Your documents stay strictly on your device. We do not store, copy, or index your private content.",
              colorClass: "icon-compress",
            },
            {
              icon: FileCheck,
              title: "ISO 32000 PDF Standard",
              description: "All exported files strictly adhere to global PDF standards, ensuring 100% visual parity across all PDF viewers.",
              colorClass: "icon-convert",
            },
            {
              icon: FileUp,
              title: "Free Community Access",
              description: "Enjoy clean exports with zero watermarks, zero hidden download limits, and instant document processing.",
              colorClass: "icon-security",
            },
          ]}
        />

        {/* 3. CONSISTENT FAQ ACCORDION */}
        <ConsistentFaqSection
          badge="Tools FAQs"
          title="Frequently Asked Questions"
          subtitle="Answers to common questions regarding tools, browser capabilities, and file safety."
          items={toolsFaq}
        />

        {/* 4. FINAL CTA BANNER */}
        <ConsistentCtaSection
          title="Ready to Edit or Protect Your PDF Right Now?"
          subtitle="Open any PDF and start modifying text, applying 256-bit encryption, or organizing pages instantly."
          primaryCtaText="Open In-Browser Editor"
          onPrimaryClick={handleTriggerUpload}
          secondaryCtaText="Password Protect a PDF"
          secondaryCtaLink="/protect"
        />
      </main>

      <SaasFooter onSelectTool={handleSelectTool} />

      <ToolWorkspaceModal
        tool={selectedTool}
        isOpen={Boolean(selectedTool)}
        onClose={() => setSelectedTool(null)}
        onOpenEditor={handleTriggerUpload}
      />
    </div>
  );
}
