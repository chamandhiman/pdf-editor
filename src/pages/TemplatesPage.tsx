import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  FileText,
  Sparkles,
  ArrowRight,
  Search,
  CheckCircle2,
  FileCheck,
  FileSpreadsheet,
  Briefcase,
  FileSignature,
  Receipt,
  ListTodo,
  Award,
  BookOpen,
  FolderLock,
  Layers,
  Zap,
  ShieldCheck,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaasHeader } from "@/components/saas/SaasHeader";
import { SaasFooter } from "@/components/saas/SaasFooter";
import {
  PDF_TEMPLATES,
  generateTemplatePdf,
  type TemplateDefinition,
} from "@/lib/pdf-templates";
import { setUploadedPdf } from "@/lib/pdf-store";
import { createBlankPdfDocument } from "@/lib/pdf-create";
import { loadPdfDocument } from "@/lib/pdf-loader";
import { toast } from "sonner";

// In-memory cache for rendered template thumbnails
const realPreviewCache = new Map<string, string>();

export function TemplatesPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [realPreviews, setRealPreviews] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [k, v] of realPreviewCache.entries()) {
      initial[k] = v;
    }
    return initial;
  });

  // Generate real vector previews using PDF.js
  useEffect(() => {
    let cancelled = false;

    const generatePreviews = async () => {
      for (const tpl of PDF_TEMPLATES) {
        if (cancelled) break;
        if (realPreviewCache.has(tpl.id)) continue;

        try {
          const generated = await generateTemplatePdf(tpl.id);
          if (cancelled) break;
          const doc = await loadPdfDocument(generated.bytes);
          const page = await doc.getPage(1);
          const unscaledVp = page.getViewport({ scale: 1 });
          const targetWidth = 360;
          const scale = targetWidth / unscaledVp.width;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          await page.render({
            canvasContext: ctx,
            canvas,
            viewport,
            background: "rgb(255,255,255)",
          }).promise;

          if (cancelled) break;
          const url = canvas.toDataURL("image/webp", 0.85);
          realPreviewCache.set(tpl.id, url);
          setRealPreviews((prev) => ({ ...prev, [tpl.id]: url }));
        } catch (e) {
          console.warn("Failed preview for", tpl.id, e);
        }
      }
    };

    generatePreviews();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = ["All", "Career", "Business", "Productivity", "Legal"];

  const filteredTemplates = PDF_TEMPLATES.filter((tpl) => {
    const matchesCat = selectedCategory === "All" || tpl.category === selectedCategory;
    const matchesQuery =
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const showBlankTemplate =
    (selectedCategory === "All" || selectedCategory === "Productivity") &&
    (searchQuery === "" || "blank document new canvas".includes(searchQuery.toLowerCase()));

  const handleUseBlank = async () => {
    setLoadingId("blank");
    const toastId = toast.loading("Creating blank PDF canvas...");
    try {
      const blank = await createBlankPdfDocument("Untitled.pdf");
      setUploadedPdf(blank.bytes, blank.fileName);
      toast.dismiss(toastId);
      toast.success("Blank document is ready for editing!");
      navigate({
        to: "/editor",
        search: { file: blank.fileName },
      });
    } catch (err) {
      console.error("Failed to create blank document:", err);
      toast.dismiss(toastId);
      toast.error("Could not create blank document.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleUseTemplate = async (template: TemplateDefinition) => {
    setLoadingId(template.id);
    const toastId = toast.loading(`Preparing ${template.name}...`);
    try {
      const generated = await generateTemplatePdf(template.id);
      setUploadedPdf(generated.bytes, generated.fileName);
      toast.dismiss(toastId);
      toast.success(`${template.name} is ready for editing!`);
      navigate({
        to: "/editor",
        search: { file: generated.fileName },
      });
    } catch (err) {
      console.error("Failed to load template:", err);
      toast.dismiss(toastId);
      toast.error("Failed to generate template. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SaasHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-muted/30 via-background to-background py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft/40 px-3.5 py-1 text-xs font-semibold text-brand mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>100% Free & Editable PDF Templates</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Professional PDF <span className="text-brand">Templates</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
              Start with a blank document or choose from beautifully structured templates. Click any template to immediately open, edit text, add list items, and customize in the PDF Studio editor — no sign-in or payment required.
            </p>

            {/* Search Bar */}
            <div className="mx-auto mt-8 max-w-md">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search templates (e.g. invoice, resume, contract)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card/80 py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand shadow-sm"
                />
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-brand text-brand-foreground shadow-sm shadow-brand/20"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/60"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Templates Grid */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {!showBlankTemplate && filteredTemplates.length === 0 ? (
            <div className="py-20 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
              <h3 className="text-base font-semibold">No templates found</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for something else or switch categories.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* ── CARD 0: BLANK TEMPLATE (ALWAYS ON TOP FIRST) ── */}
              {showBlankTemplate && (
                <div
                  className="group relative flex flex-col rounded-2xl border-2 border-dashed border-brand/40 bg-card shadow-sm hover:border-brand hover:shadow-lg transition-all overflow-hidden pdf-card-glow"
                >
                  {/* Visual Document Preview Card */}
                  <div className="relative h-56 bg-gradient-to-b from-brand-soft/20 to-muted/80 p-4 border-b border-border/60 overflow-hidden flex flex-col justify-center items-center group-hover:bg-brand-soft/30 transition-colors">
                    <div className="relative w-44 h-48 bg-background rounded-md shadow-md border-2 border-dashed border-border/90 p-4 flex flex-col items-center justify-center text-center select-none group-hover:scale-105 group-hover:shadow-lg group-hover:border-brand/70 transition-all duration-300">
                      <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-2.5 shadow-sm group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-[11px] text-foreground">Clean Canvas</span>
                      <span className="text-[9px] text-muted-foreground mt-0.5">Start completely from scratch</span>
                      <div className="mt-3 px-2 py-0.5 rounded bg-muted/70 text-[8px] text-muted-foreground font-mono">
                        A4 • 595 × 842 pt
                      </div>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border/60 backdrop-blur-xs">
                        Start Fresh
                      </span>
                    </div>

                    {/* Perk Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="rounded-md bg-brand text-brand-foreground px-2 py-0.5 text-[10px] font-bold shadow-sm shadow-brand/20">
                        Blank PDF
                      </span>
                    </div>
                  </div>

                  {/* Template Details */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-base font-bold text-foreground group-hover:text-brand transition-colors">
                      Blank PDF Document
                    </h3>
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                      Start with a clean blank canvas. Add custom text, headings, shapes, signatures, drawings, and images from scratch.
                    </p>

                    <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Blank Canvas
                      </span>

                      <Button
                        variant="brand"
                        size="sm"
                        className="gap-1.5 text-xs font-bold shadow-sm shadow-brand/20"
                        onClick={handleUseBlank}
                        disabled={loadingId === "blank"}
                      >
                        {loadingId === "blank" ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Creating...</span>
                          </>
                        ) : (
                          <>
                            <span>Create Blank PDF</span>
                            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STANDARD TEMPLATES WITH REAL PREVIEW ── */}
              {filteredTemplates.map((template) => {
                const isLoading = loadingId === template.id;
                const hasRealPreview = !!realPreviews[template.id];

                return (
                  <div
                    key={template.id}
                    className="group relative flex flex-col rounded-2xl border border-border bg-card shadow-sm hover:border-brand/40 hover:shadow-lg transition-all overflow-hidden pdf-card-glow"
                  >
                    {/* Visual Document Preview Card */}
                    <div className="relative h-56 bg-gradient-to-b from-muted/30 to-muted/80 p-4 border-b border-border/60 overflow-hidden flex flex-col justify-center items-center group-hover:bg-brand-soft/20 transition-colors">
                      {hasRealPreview ? (
                        /* Genuine Real Vector PDF Render */
                        <div className="relative w-44 h-48 bg-white rounded-md shadow-md border border-border/80 overflow-hidden select-none group-hover:scale-105 group-hover:shadow-lg transition-all duration-300">
                          <img
                            src={realPreviews[template.id]}
                            alt={template.name}
                            className="w-full h-full object-cover object-top"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        /* Realistic Paper Mockup fallback while loading */
                        <div className="relative w-44 h-48 bg-background rounded-md shadow-md border border-border/80 p-3.5 flex flex-col overflow-hidden text-[9px] font-mono leading-tight select-none group-hover:scale-105 group-hover:shadow-lg transition-all duration-300">
                          <div
                            className="h-1.5 w-full rounded-full mb-2 shrink-0"
                            style={{ backgroundColor: template.accentColor }}
                          />
                          <div className="font-bold text-[10px] text-foreground truncate mb-1">
                            {template.name}
                          </div>
                          <div className="w-16 h-1 bg-muted-foreground/30 rounded-full mb-2.5 shrink-0" />
                          <div className="space-y-1.5 text-muted-foreground/80 line-clamp-6 whitespace-pre-line text-[8px] leading-relaxed">
                            {template.previewSnippet}
                          </div>
                          <div className="mt-auto pt-2 border-t border-border/40 flex justify-between items-center text-[7px] text-muted-foreground/60">
                            <span>PDF STUDIO</span>
                            <span className="font-bold text-foreground">A4 READY</span>
                          </div>
                        </div>
                      )}

                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border/60 backdrop-blur-xs">
                          {template.category}
                        </span>
                      </div>

                      {/* Perk Badge */}
                      <div className="absolute top-3 right-3">
                        <span className="rounded-md bg-brand/10 text-brand px-2 py-0.5 text-[10px] font-bold border border-brand/20">
                          {template.badge}
                        </span>
                      </div>
                    </div>

                    {/* Template Details */}
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-base font-bold text-foreground group-hover:text-brand transition-colors">
                        {template.name}
                      </h3>
                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                        {template.description}
                      </p>

                      <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Fully Editable
                        </span>

                        <Button
                          variant="brand"
                          size="sm"
                          className="gap-1.5 text-xs font-bold shadow-sm shadow-brand/20"
                          onClick={() => handleUseTemplate(template)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Loading...</span>
                            </>
                          ) : (
                            <>
                              <span>Use Template</span>
                              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Feature Highlights Banner */}
        <section className="border-t border-border/60 bg-muted/20 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-3 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Zero Account Required</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select any template, personalize its contents directly in your browser, and download.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Bank-Grade Privacy</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Templates render locally in browser memory. Your confidential information never touches external cloud servers.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">100% Vector Quality</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Export high-resolution PDFs formatted precisely for standard A4 printing and digital sharing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SaasFooter />
    </div>
  );
}
