import { useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { HelpCircle, Search, ShieldCheck, Zap, Lock, Cloud, HeartHandshake, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { SaasHeader } from "@/components/saas/SaasHeader";
import { SaasFooter } from "@/components/saas/SaasFooter";
import { ToolWorkspaceModal } from "@/components/saas/ToolWorkspaceModal";
import { WhyUseSection } from "@/components/saas/WhyUseSection";
import { ConsistentCtaSection } from "@/components/saas/ConsistentCtaSection";
import { type PdfTool } from "@/lib/pdf-tools-data";
import { setUploadedPdf } from "@/lib/pdf-store";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FaqPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTool, setSelectedTool] = useState<PdfTool | null>(null);
  const [search, setSearch] = useState("");

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

  const allFaqs = [
    {
      q: "What can I do with PDF Studio?",
      a: "PDF Studio is a high-performance web-based PDF suite. You can view, annotate, add text, headings, shapes, freehand drawings, stamps, insert images, rotate, and delete pages directly inside your web browser. You can export clean, vector-rendered PDFs instantly.",
    },
    {
      q: "Is WebToolOcean PDF Studio secure and private?",
      a: "Yes, 100%. Our platform uses client-side WebAssembly and modern browser APIs so your files are never transmitted to external servers. Your documents remain entirely within your private device memory.",
    },
    {
      q: "Can I edit existing PDF text?",
      a: "Yes! PDF Studio allows you to overlay new text, headings, paragraphs, lists, and shapes directly over your document pages. For native scanned PDFs, OCR text recognition and direct text layer editing workflows are currently being integrated.",
    },
    {
      q: "What encryption standard is used to protect PDFs?",
      a: "We use standard 256-bit AES encryption conforming to the ISO 32000 PDF security specification, ensuring maximum military-grade confidentiality compatible with Adobe Acrobat and all standard PDF readers.",
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
      q: "Can I edit PDFs on mobile and tablets?",
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

  const filteredFaqs = allFaqs.filter(
    (item) =>
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase()),
  );

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
        onSelectTool={(tool) => setSelectedTool(tool)}
      />

      <main className="flex-1 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-soft text-brand text-xs font-semibold mb-4">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Support & Information</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Frequently Asked Questions
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground">
              Find transparent answers about PDF Studio capabilities, privacy policies, and technical workflows.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-10">
            <Search className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search frequently asked questions..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-input bg-card text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          {/* Accordion with consistent styling */}
          <Accordion type="single" collapsible className="w-full space-y-3.5">
            {filteredFaqs.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-2xl border border-border bg-card px-5 sm:px-6 py-1 data-[state=open]:border-brand/40 data-[state=open]:shadow-md transition-all pdf-card-glow"
              >
                <AccordionTrigger className="text-sm sm:text-base font-semibold text-foreground hover:no-underline py-4 text-left cursor-pointer group">
                  <span className="group-hover:text-brand transition-colors">{item.q}</span>
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pb-4 pt-1">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Ask Support */}
          <div className="mt-16 text-center rounded-3xl border border-border bg-card p-8">
            <h2 className="text-xl font-bold text-foreground">Still have questions?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Can't find what you're looking for? Reach out to our product support team.
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: "/contact" })}
              className="mt-6 px-6 py-2.5 rounded-xl bg-brand text-white font-semibold text-sm shadow hover:bg-brand/90 transition-colors cursor-pointer"
            >
              Contact Support
            </button>
          </div>
        </div>
      </main>

      {/* WHY USE SECTION */}
      <WhyUseSection
        badge="Enterprise Guarantee"
        title="Engineered For Privacy & Speed"
        subtitle="Every tool in WebToolOcean PDF Studio is built for maximum confidentiality and zero learning curve."
        benefits={[
          {
            icon: ShieldCheck,
            title: "Private In-Browser Engine",
            description: "Files are handled in your device's memory. No document uploads, zero data logs.",
            colorClass: "icon-security",
          },
          {
            icon: Zap,
            title: "Instant Zero-Lag Processing",
            description: "No server queuing or download waiting periods. Processing is instant.",
            colorClass: "icon-convert",
          },
          {
            icon: Lock,
            title: "256-Bit AES Encryption",
            description: "Protect sensitive legal, medical, and financial documents with standard ISO 32000 encryption.",
            colorClass: "icon-edit",
          },
          {
            icon: Cloud,
            title: "Universal Cross-Platform",
            description: "Fully compatible with Windows, macOS, Linux, iOS, and Android web browsers.",
            colorClass: "icon-organize",
          },
          {
            icon: HeartHandshake,
            title: "100% Free Core Tools",
            description: "No subscriptions, mandatory watermarks, or hidden checkout screens for core editing.",
            colorClass: "icon-edit",
          },
          {
            icon: Sparkles,
            title: "Crystal-Clear Vector Quality",
            description: "Annotated PDFs export with high precision vector fonts and lossless graphics.",
            colorClass: "icon-convert",
          },
        ]}
      />

      {/* CONSISTENT CTA SECTION */}
      <ConsistentCtaSection
        title="Ready to Edit or Protect Your PDF?"
        subtitle="Start editing documents in seconds. No registration or credit card required."
        primaryCtaText="Launch PDF Studio"
        onPrimaryClick={handleTriggerUpload}
        secondaryCtaText="Explore All Tools"
        secondaryCtaLink="/tools"
      />

      <SaasFooter onSelectTool={(tool) => setSelectedTool(tool)} />

      <ToolWorkspaceModal
        tool={selectedTool}
        isOpen={Boolean(selectedTool)}
        onClose={() => setSelectedTool(null)}
        onOpenEditor={handleTriggerUpload}
      />
    </div>
  );
}
