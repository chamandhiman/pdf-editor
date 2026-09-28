import { useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Compass, ArrowRight, FileUp } from "lucide-react";
import { toast } from "sonner";

import { SaasHeader } from "@/components/saas/SaasHeader";
import { SaasFooter } from "@/components/saas/SaasFooter";
import { ToolWorkspaceModal } from "@/components/saas/ToolWorkspaceModal";
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
    if (tool.status === "available" && tool.slug === "edit-pdf") {
      handleTriggerUpload();
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
              Explore 30+ tools for editing, converting, compressing, organizing, and protecting your documents.
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
                    <span>{tool.status === "available" ? "Open Tool" : "Coming Soon"}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick upload footer banner */}
          <div className="mt-16 rounded-3xl bg-gradient-to-br from-brand to-orange-600 p-8 md:p-12 text-center max-w-3xl mx-auto shadow-xl shadow-brand/20 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white" />
            </div>
            <h2 className="text-2xl font-bold text-white relative z-10">Ready to edit a PDF right now?</h2>
            <p className="mt-2 text-sm text-white/80 relative z-10">
              Upload any PDF and start editing text, adding signatures, annotations, and more — free, instantly.
            </p>
            <button
              type="button"
              onClick={handleTriggerUpload}
              className="mt-6 inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-white text-brand font-bold text-sm shadow-lg hover:bg-white/95 transition-all active:scale-[0.98] cursor-pointer relative z-10"
            >
              <FileUp className="w-4 h-4" />
              <span>Open PDF Editor — Free</span>
            </button>
          </div>
        </div>
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
