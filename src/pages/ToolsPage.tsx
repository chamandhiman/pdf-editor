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

            <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 no-scrollbar">
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
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => handleSelectTool(tool)}
                className="group rounded-2xl border border-border bg-card p-5 hover:border-brand/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-brand-soft text-brand flex items-center justify-center group-hover:scale-105 transition-transform">
                      <tool.icon className="w-5 h-5" />
                    </div>
                    {tool.status === "available" ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Available
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Preview
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

                <div className="mt-6 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-brand">
                  <span>{tool.status === "available" ? "Open Tool" : "View Details"}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

          {/* Quick upload footer banner */}
          <div className="mt-16 rounded-3xl border border-border bg-card p-8 md:p-12 text-center max-w-3xl mx-auto shadow-sm">
            <h2 className="text-2xl font-bold text-foreground">Need to edit a document right away?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Open our primary PDF editor to add text, headings, sign documents, and customize pages.
            </p>
            <button
              type="button"
              onClick={handleTriggerUpload}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand text-white font-semibold text-sm shadow hover:bg-brand/90 transition-colors cursor-pointer"
            >
              <FileUp className="w-4 h-4" />
              <span>Launch Editor with PDF</span>
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
