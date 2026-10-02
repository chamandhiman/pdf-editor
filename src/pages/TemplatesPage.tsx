import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Sparkles,
  ArrowRight,
  Search,
  CheckCircle2,
  Plus,
  Loader2,
  Eye,
  Check,
  Layers,
  Zap,
  LayoutGrid,
  FileCode,
  Sliders,
  DollarSign,
  Award,
  FileText,
  Palette,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SaasHeader } from "@/components/saas/SaasHeader";
import { SaasFooter } from "@/components/saas/SaasFooter";
import {
  TEMPLATES_CATALOG,
  type TemplateMetadata,
} from "@/lib/pdf-templates-data";
import { generateTemplatePdfAndDoc } from "@/lib/pdf-templates";
import { setUploadedPdf } from "@/lib/pdf-store";
import { createBlankPdfDocument } from "@/lib/pdf-create";
import { useAuth } from "@/lib/auth-context";
import { getUserProfile } from "@/lib/cloud-documents";
import { PlanSelectionModal } from "@/components/editor/modals/PlanSelectionModal";
import { toast } from "sonner";

export function TemplatesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateMetadata | null>(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [pendingProTemplate, setPendingProTemplate] = useState<TemplateMetadata | null>(null);

  const categories = [
    { id: "All", label: "All Templates", icon: LayoutGrid },
    { id: "Pro", label: "Pro Templates", icon: Crown, isProOnly: true },
    { id: "Landing Pages", label: "Landing Pages & One-Pagers", icon: Sparkles },
    { id: "Architecture", label: "Information Architecture", icon: FileCode },
    { id: "Banners", label: "Banners & Posters", icon: Palette },
    { id: "Business", label: "Business Proposals", icon: Sliders },
    { id: "Finance", label: "Invoices & Finance", icon: DollarSign },
    { id: "Certificates", label: "Certificates & Awards", icon: Award },
    { id: "Resumes", label: "Resumes & CVs", icon: FileText },
  ];

  const filteredTemplates = useMemo(() => {
    return TEMPLATES_CATALOG.filter((tpl) => {
      const matchesCat =
        selectedCategory === "All"
          ? true
          : selectedCategory === "Pro"
          ? Boolean(tpl.isPro)
          : tpl.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        tpl.name.toLowerCase().includes(q) ||
        tpl.description.toLowerCase().includes(q) ||
        tpl.tags.some((tag) => tag.toLowerCase().includes(q));

      return matchesCat && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  const showBlankTemplate =
    (selectedCategory === "All" || selectedCategory === "Landing Pages") &&
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

  const checkIsProUser = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      const profile = await getUserProfile(user.uid);
      return profile?.planId === "pro_monthly" || profile?.planId === "pro_annual";
    } catch {
      return false;
    }
  };

  const loadAndOpenTemplate = async (template: TemplateMetadata) => {
    setLoadingId(template.id);
    const toastId = toast.loading(`Preparing ${template.name}...`);
    try {
      const generated = await generateTemplatePdfAndDoc(template.id);
      setUploadedPdf(generated.bytes, generated.fileName, generated.doc);

      toast.dismiss(toastId);
      toast.success(`${template.name} loaded into editor!`);
      setPreviewTemplate(null);
      navigate({
        to: "/editor",
        search: { file: generated.fileName },
      });
    } catch (err) {
      console.error("Failed to load template:", err);
      toast.dismiss(toastId);
      toast.error("Failed to load template. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleUseTemplate = async (template: TemplateMetadata) => {
    if (template.isPro) {
      const isPro = await checkIsProUser();
      if (!isPro) {
        setPendingProTemplate(template);
        setPlanModalOpen(true);
        toast.info("This stylish template is exclusive to Pro members. Choose a plan to unlock!", {
          icon: "👑",
        });
        return;
      }
    }

    await loadAndOpenTemplate(template);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SaasHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-muted/30 via-background to-background py-14 sm:py-18">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft/40 px-3.5 py-1 text-xs font-semibold text-brand mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Modern, Visual & 100% Fully Editable PDF Templates</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Next-Gen PDF <span className="text-brand">Template Studio</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
              Explore modern landing pages, technical architecture blueprints, high-impact keynote banners, 
              corporate invoices, award certificates, and ATS resumes. Every document opens directly in the editor with live editable text, shapes, and images.
            </p>

            {/* Search Bar */}
            <div className="mx-auto mt-8 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search templates (e.g. SaaS Landing, Architecture, Keynote Banner, Invoice, ATS Resume)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card/90 py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand shadow-sm"
                />
              </div>
            </div>

            {/* Clean Category Tabs (No messy dropdown filters) */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-5xl mx-auto">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                const isProTab = cat.id === "Pro";
                const count =
                  cat.id === "All"
                    ? TEMPLATES_CATALOG.length
                    : cat.id === "Pro"
                    ? TEMPLATES_CATALOG.filter((t) => Boolean(t.isPro)).length
                    : TEMPLATES_CATALOG.filter((t) => t.category === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? isProTab
                          ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/30 scale-[1.02] border border-amber-300/40"
                          : "bg-brand text-brand-foreground shadow-md shadow-brand/25 scale-[1.02]"
                        : isProTab
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/30"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/60 hover:border-brand/40"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isProTab && !isSelected ? "text-amber-500" : ""}`} />
                    <span>{cat.label}</span>
                    <span
                      className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : isProTab
                          ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Templates Grid Section */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>{selectedCategory === "All" ? "Featured Templates" : selectedCategory}</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                  {filteredTemplates.length} Available
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click any template to customize or preview instantly.
              </p>
            </div>
          </div>

          {filteredTemplates.length === 0 && !showBlankTemplate ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/60 mb-3" />
              <h3 className="text-base font-bold text-foreground">No templates found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                No templates matched "{searchQuery}". Try searching for another keyword or select another category.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-xs font-semibold"
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
              >
                Reset Search
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* CARD 0: BLANK CANVAS */}
              {showBlankTemplate && (
                <div className="group relative flex flex-col rounded-2xl border-2 border-dashed border-brand/40 bg-card shadow-sm hover:border-brand hover:shadow-lg transition-all overflow-hidden pdf-card-glow">
                  <div className="relative h-60 bg-gradient-to-b from-brand-soft/20 to-muted/80 p-4 border-b border-border/60 overflow-hidden flex flex-col justify-center items-center group-hover:bg-brand-soft/30 transition-colors">
                    <div className="relative w-44 h-52 bg-background rounded-md shadow-md border-2 border-dashed border-border/90 p-4 flex flex-col items-center justify-center text-center select-none group-hover:scale-105 group-hover:shadow-lg group-hover:border-brand/70 transition-all duration-300">
                      <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-2.5 shadow-sm group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-[11px] text-foreground">Clean Canvas</span>
                      <span className="text-[9px] text-muted-foreground mt-0.5">Start completely from scratch</span>
                      <div className="mt-3 px-2 py-0.5 rounded bg-muted/70 text-[8px] text-muted-foreground font-mono">
                        Standard US Letter
                      </div>
                    </div>

                    <div className="absolute top-3 left-3">
                      <span className="rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border/60">
                        Start Fresh
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="rounded-md bg-brand text-brand-foreground px-2 py-0.5 text-[10px] font-bold shadow-sm shadow-brand/20">
                        Blank PDF
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-base font-bold text-foreground group-hover:text-brand transition-colors">
                      Blank PDF Document
                    </h3>
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                      Start with a clean blank canvas. Add custom headings, paragraphs, bullet lists, shapes, signatures, and images.
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
                            <span>Create Blank</span>
                            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATES CARDS WITH RICH VISUAL THUMBNAILS */}
              {filteredTemplates.map((template) => {
                const isLoading = loadingId === template.id;

                return (
                  <div
                    key={template.id}
                    className="group relative flex flex-col rounded-2xl border border-border bg-card shadow-sm hover:border-brand/40 hover:shadow-lg transition-all overflow-hidden pdf-card-glow"
                  >
                    {/* Visual Miniature Document Preview */}
                    <div className="relative h-60 bg-gradient-to-b from-muted/30 to-muted/80 p-4 border-b border-border/60 overflow-hidden flex flex-col justify-center items-center group-hover:bg-brand-soft/20 transition-colors">
                      <TemplateVisualThumbnail template={template} />

                      {/* Top Floating Badges */}
                      <div className="absolute top-3 left-3 flex gap-1.5 items-center">
                        <span className="rounded-md bg-background/95 px-2 py-0.5 text-[10px] font-bold text-foreground border border-border/60 shadow-sm">
                          {template.category}
                        </span>
                        {template.isPro && (
                          <span className="rounded-md bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm flex items-center gap-1 border border-amber-300/40">
                            <Crown className="h-3 w-3" />
                            PRO
                          </span>
                        )}
                        {template.isAtsFriendly && (
                          <span className="rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold border border-emerald-500/20 shadow-sm">
                            ATS Friendly
                          </span>
                        )}
                      </div>

                      <div className="absolute top-3 right-3">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold text-white shadow-sm ${
                            template.isPro
                              ? "bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 border border-orange-300/40"
                              : ""
                          }`}
                          style={!template.isPro ? { backgroundColor: template.accentColor } : undefined}
                        >
                          {template.badge || template.category}
                        </span>
                      </div>
                    </div>

                    {/* Card Content & Details */}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-foreground group-hover:text-brand transition-colors line-clamp-1">
                          {template.name}
                        </h3>
                        <span className="text-[11px] font-semibold text-muted-foreground shrink-0 ml-2">
                          {template.pages} {template.pages > 1 ? "Pages" : "Page"}
                        </span>
                      </div>

                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                        {template.description}
                      </p>

                      {/* Tags */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-border/40"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 pt-4 border-t border-border/60 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs font-semibold"
                          onClick={() => setPreviewTemplate(template)}
                        >
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Preview</span>
                        </Button>

                        <Button
                          variant="brand"
                          size="sm"
                          className={`gap-1.5 text-xs font-bold shadow-sm shadow-brand/20 flex-1 ${
                            template.isPro
                              ? "bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-orange-500/20"
                              : ""
                          }`}
                          onClick={() => handleUseTemplate(template)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Opening...</span>
                            </>
                          ) : (
                            <>
                              {template.isPro && <Crown className="h-3.5 w-3.5 text-amber-200" />}
                              <span>{template.isPro ? "Use Pro Template" : "Use Template"}</span>
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

        {/* Feature Highlights */}
        <section className="border-t border-border/60 bg-muted/20 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-3 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Zero Login Required</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select any template, edit freely in browser memory, and download without signing in.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">100% Editable Documents</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Every element is a real interactive object. Move, resize, delete, and add sections with smart page flow.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Vector-Sharp Export</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Export high-resolution PDFs rendered directly from your latest edits with zero text clipping.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Template Preview Modal */}
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
          <DialogContent className="sm:max-w-[720px] p-6 rounded-2xl border-border bg-card shadow-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="rounded-md px-2.5 py-0.5 text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: previewTemplate.accentColor }}
                >
                  {previewTemplate.category}
                </span>
                {previewTemplate.isAtsFriendly && (
                  <span className="rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-xs font-bold border border-emerald-500/20">
                    ATS Friendly
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  • {previewTemplate.pages} {previewTemplate.pages > 1 ? "Pages" : "Page"}
                </span>
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                {previewTemplate.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
                {previewTemplate.description}
              </DialogDescription>
            </DialogHeader>

            {/* Document Preview Card inside Modal */}
            <div className="mt-4 rounded-xl border border-border bg-slate-50 dark:bg-slate-900/60 p-6 flex flex-col items-center justify-center">
              <TemplateModalPreview template={previewTemplate} />
            </div>

            {/* Modal Actions */}
            <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                Ready to customize in PDF Studio
              </span>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate(null)}>
                  Close
                </Button>
                <Button
                  variant="brand"
                  size="sm"
                  className={`gap-2 font-bold shadow-md shadow-brand/20 px-4 ${
                    previewTemplate.isPro
                      ? "bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-orange-500/20"
                      : ""
                  }`}
                  onClick={() => handleUseTemplate(previewTemplate)}
                  disabled={loadingId === previewTemplate.id}
                >
                  {loadingId === previewTemplate.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      {previewTemplate.isPro && <Crown className="h-4 w-4 text-amber-200" />}
                      <span>{previewTemplate.isPro ? "Use Pro Template" : "Use This Template"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Plan Selection Modal for Pro Gated Templates */}
      <PlanSelectionModal
        open={planModalOpen}
        onOpenChange={setPlanModalOpen}
        onSelectFreePlan={() => {
          setPlanModalOpen(false);
          if (pendingProTemplate) {
            loadAndOpenTemplate(pendingProTemplate);
            setPendingProTemplate(null);
          }
        }}
      />

      <SaasFooter />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category-Specific Visual Mini-Thumbnail Component
// ---------------------------------------------------------------------------
function TemplateVisualThumbnail({ template }: { template: TemplateMetadata }) {
  if (template.category === "Landing Pages") {
    return (
      <div className="relative w-44 h-52 bg-slate-950 text-white rounded-md shadow-md border border-indigo-900/50 p-2 flex flex-col justify-between overflow-hidden select-none group-hover:scale-105 group-hover:shadow-indigo-500/20 group-hover:shadow-lg transition-all duration-300">
        <div className="h-1 w-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mb-1 shrink-0" />
        <div className="bg-slate-900/90 rounded p-1.5 border border-indigo-800/40">
          <div className="inline-block px-1 py-0.2 rounded bg-indigo-950 border border-indigo-500/50 text-[5px] font-bold text-indigo-300 tracking-wider mb-0.5">
            ✦ AI WORKSPACE
          </div>
          <div className="text-[7.5px] font-extrabold text-white leading-tight">
            Accelerate Cloud Engineering
          </div>
          <div className="text-[5px] text-slate-400 mt-0.5 line-clamp-1">
            Autonomous agentic cloud release pipeline
          </div>
          <div className="mt-1 flex gap-1">
            <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[5px] font-bold">
              Try Free →
            </span>
            <span className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[5px]">
              Demo
            </span>
          </div>
        </div>

        {/* Miniature Mockup */}
        <div className="rounded bg-slate-900 border border-slate-700/60 p-1 shadow-inner">
          <div className="flex items-center gap-0.5 pb-0.5 border-b border-slate-800">
            <div className="w-1 h-1 rounded-full bg-red-500" />
            <div className="w-1 h-1 rounded-full bg-amber-500" />
            <div className="w-1 h-1 rounded-full bg-emerald-500" />
            <span className="text-[4px] text-slate-400 ml-1">app.cloudflow.io</span>
          </div>
          <div className="pt-0.5 flex items-center justify-between text-[4.5px]">
            <span className="text-cyan-400 font-bold">99.99%</span>
            <span className="text-purple-400 font-bold">10M+ req</span>
            <span className="text-emerald-400 font-bold">SOC-2</span>
          </div>
          <div className="h-3 w-full mt-0.5 bg-slate-950 rounded flex items-end p-0.5 gap-0.5">
            <div className="w-1/5 h-1.5 bg-indigo-500/50 rounded-t" />
            <div className="w-1/5 h-2 bg-indigo-500/80 rounded-t" />
            <div className="w-1/5 h-1.5 bg-cyan-500/80 rounded-t" />
            <div className="w-1/5 h-2.5 bg-emerald-500 rounded-t" />
            <div className="w-1/5 h-3 bg-indigo-400 rounded-t" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-0.5 text-[4.5px]">
          <div className="bg-slate-900/90 p-0.5 rounded border border-slate-800 text-center font-bold text-blue-400">
            ⚡ Sync
          </div>
          <div className="bg-slate-900/90 p-0.5 rounded border border-slate-800 text-center font-bold text-purple-400">
            🛡️ Zero-T
          </div>
          <div className="bg-slate-900/90 p-0.5 rounded border border-slate-800 text-center font-bold text-emerald-400">
            🤖 Copilot
          </div>
        </div>
      </div>
    );
  }

  if (template.category === "Architecture") {
    return (
      <div className="relative w-44 h-52 bg-slate-950 text-white rounded-md shadow-md border border-cyan-900/60 p-2 flex flex-col justify-between overflow-hidden select-none group-hover:scale-105 group-hover:shadow-cyan-500/20 group-hover:shadow-lg transition-all duration-300">
        <div className="h-1 w-full rounded-full bg-cyan-400 mb-1 shrink-0" />
        <div>
          <div className="flex items-center justify-between text-[4.5px] text-cyan-400 font-mono tracking-wider">
            <span>SYS-BLUEPRINT</span>
            <span>REV 3.2</span>
          </div>
          <div className="text-[7.5px] font-bold text-slate-100 truncate mt-0.5">
            Cloud Mesh Architecture
          </div>
          <div className="flex gap-1 mt-0.5 text-[4.5px] font-mono">
            <span className="px-1 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
              &lt;15ms
            </span>
            <span className="px-1 py-0.2 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
              99.999%
            </span>
          </div>
        </div>

        {/* Schematic Flow Preview */}
        <div className="rounded bg-slate-900/90 border border-slate-800 p-1 flex flex-col gap-0.5">
          <div className="flex items-center justify-between text-[4.5px]">
            <div className="px-1 py-0.2 bg-blue-900/80 border border-blue-500 rounded text-blue-200">
              Clients
            </div>
            <span className="text-[4px] text-slate-500">➔</span>
            <div className="px-1 py-0.2 bg-purple-900/80 border border-purple-500 rounded text-purple-200">
              Gateway
            </div>
            <span className="text-[4px] text-slate-500">➔</span>
            <div className="px-1 py-0.2 bg-amber-900/80 border border-amber-500 rounded text-amber-200">
              Kafka
            </div>
          </div>
          <div className="h-0.5 w-full bg-slate-800" />
          <div className="flex items-center justify-between text-[4.5px]">
            <div className="px-1 py-0.2 bg-emerald-900/80 border border-emerald-500 rounded text-emerald-200">
              EKS Mesh
            </div>
            <span className="text-[4px] text-slate-500">➔</span>
            <div className="px-1 py-0.2 bg-rose-900/80 border border-rose-500 rounded text-rose-200">
              Distributed DB
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-0.5 text-[4.5px]">
          <div className="p-0.5 rounded bg-slate-900 border border-slate-800">
            <span className="font-bold text-blue-400">T1: Gateway</span>
          </div>
          <div className="p-0.5 rounded bg-slate-900 border border-slate-800">
            <span className="font-bold text-purple-400">T2: Compute</span>
          </div>
          <div className="p-0.5 rounded bg-slate-900 border border-slate-800">
            <span className="font-bold text-orange-400">T3: Kafka Stream</span>
          </div>
          <div className="p-0.5 rounded bg-slate-900 border border-slate-800">
            <span className="font-bold text-emerald-400">T4: Persistence</span>
          </div>
        </div>
      </div>
    );
  }

  if (template.id === "banner-enterprise-circle") {
    return (
      <div className="relative w-44 h-52 bg-[#fffaf5] text-slate-900 rounded-md shadow-md border border-orange-200 p-2 flex flex-col justify-between overflow-hidden select-none group-hover:scale-105 group-hover:shadow-orange-500/20 group-hover:shadow-lg transition-all duration-300">
        {/* Top Header Logo + Anniversary */}
        <div className="flex items-center justify-between pb-1 border-b border-orange-100">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-xs bg-orange-600 flex items-center justify-center text-[5px] text-white font-bold">
              N
            </div>
            <div>
              <div className="text-[6px] font-extrabold text-slate-900 leading-none">Netsmartz</div>
              <div className="text-[4px] font-semibold text-slate-400 leading-none mt-0.5">SINCE 1999</div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 bg-orange-100/70 px-1 py-0.2 rounded border border-orange-200">
            <span className="text-[8px] font-black text-orange-600">27</span>
            <span className="text-[4px] font-bold text-slate-500 leading-none">Years</span>
          </div>
        </div>

        {/* Hero Section: Title & Handshake Image */}
        <div className="flex items-start justify-between gap-1 pt-1">
          <div className="flex-1">
            <div className="text-[7.5px] font-bold text-slate-900 leading-none">Netsmartz</div>
            <div className="text-[9.5px] font-black text-orange-600 leading-tight">Circle</div>
            <div className="text-[4.5px] text-slate-600 leading-tight mt-0.5 line-clamp-2">
              Connecting customers when we identify a business fit.
            </div>
          </div>
          <div className="relative w-16 h-12 rounded-lg overflow-hidden border border-orange-300 shrink-0 shadow-xs bg-orange-100">
            <img
              src="/enterprise-partnership-hero.jpg"
              alt="Partnership Handshake"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Section 1: How It Works Banner & 4 Steps */}
        <div className="mt-1">
          <div className="bg-orange-600 text-white text-[4.5px] font-bold px-1.5 py-0.5 rounded-full inline-block mb-1 shadow-2xs">
            How Netsmartz Circle works
          </div>
          <div className="grid grid-cols-4 gap-0.5 text-center">
            <div className="bg-white p-0.5 rounded border border-orange-200 shadow-2xs">
              <div className="w-2.5 h-2.5 mx-auto rounded-full bg-orange-100 text-orange-600 font-bold text-[4px] flex items-center justify-center">1</div>
              <div className="text-[3.8px] font-bold text-slate-800 mt-0.5 truncate">Understand</div>
            </div>
            <div className="bg-white p-0.5 rounded border border-orange-200 shadow-2xs">
              <div className="w-2.5 h-2.5 mx-auto rounded-full bg-orange-100 text-orange-600 font-bold text-[4px] flex items-center justify-center">2</div>
              <div className="text-[3.8px] font-bold text-slate-800 mt-0.5 truncate">Matches</div>
            </div>
            <div className="bg-white p-0.5 rounded border border-orange-200 shadow-2xs">
              <div className="w-2.5 h-2.5 mx-auto rounded-full bg-orange-100 text-orange-600 font-bold text-[4px] flex items-center justify-center">3</div>
              <div className="text-[3.8px] font-bold text-slate-800 mt-0.5 truncate">Introduce</div>
            </div>
            <div className="bg-white p-0.5 rounded border border-orange-200 shadow-2xs">
              <div className="w-2.5 h-2.5 mx-auto rounded-full bg-orange-100 text-orange-600 font-bold text-[4px] flex items-center justify-center">4</div>
              <div className="text-[3.8px] font-bold text-slate-800 mt-0.5 truncate">Connect</div>
            </div>
          </div>
        </div>

        {/* Section 2: What Can You Discover */}
        <div className="mt-0.5">
          <div className="bg-orange-600 text-white text-[4px] font-bold px-1.5 py-0.2 rounded-full inline-block mb-0.5">
            What can you discover?
          </div>
          <div className="grid grid-cols-3 gap-0.5 text-center">
            <div className="bg-white p-0.5 rounded border border-orange-200">
              <div className="text-[4px] font-bold text-slate-800 truncate">New Clients</div>
            </div>
            <div className="bg-white p-0.5 rounded border border-orange-200">
              <div className="text-[4px] font-bold text-slate-800 truncate">Partnerships</div>
            </div>
            <div className="bg-white p-0.5 rounded border border-orange-200">
              <div className="text-[4px] font-bold text-slate-800 truncate">Suppliers</div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 gap-0.5 mt-0.5 pt-0.5 border-t border-orange-100 text-[4px]">
          <div className="flex items-center gap-0.5 text-slate-700">
            <span className="text-orange-600 font-bold">✓</span> Approval First
          </div>
          <div className="flex items-center gap-0.5 text-slate-700">
            <span className="text-orange-600 font-bold">✓</span> Zero Fees
          </div>
        </div>
      </div>
    );
  }

  if (template.category === "Banners") {
    return (
      <div className="relative w-44 h-52 bg-gradient-to-b from-purple-950 via-fuchsia-950 to-pink-950 text-white rounded-md shadow-md border border-fuchsia-800/50 p-2 flex flex-col justify-between overflow-hidden select-none group-hover:scale-105 group-hover:shadow-pink-500/20 group-hover:shadow-lg transition-all duration-300">
        <div className="h-1 w-full rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 mb-1 shrink-0" />
        <div className="text-center">
          <div className="inline-block px-1.5 py-0.2 rounded-full bg-pink-500/20 border border-pink-400/40 text-[4.5px] font-bold text-pink-300">
            ✦ ANNUAL FLAGSHIP TECH SUMMIT ✦
          </div>
          <div className="text-[8.5px] font-black text-white leading-tight mt-0.5 tracking-tight">
            GLOBAL AI & CLOUD SUMMIT
          </div>
          <div className="text-[5px] text-pink-200 mt-0.5">
            San Francisco • Oct 14–16, 2026
          </div>
        </div>

        <div className="rounded bg-purple-900/60 border border-purple-500/30 p-1 flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-500 to-violet-500 p-0.5 shrink-0 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-purple-950 flex items-center justify-center text-[7px] font-bold text-pink-300">
              ER
            </div>
          </div>
          <div className="overflow-hidden">
            <div className="text-[4.5px] text-pink-400 font-bold uppercase">Keynote Speaker</div>
            <div className="text-[6px] font-bold text-white truncate">Dr. Elena Rostova</div>
            <div className="text-[4.5px] text-purple-200 truncate">Synthetix Labs AI Chief</div>
          </div>
        </div>

        <div className="bg-rose-900/80 rounded p-1 border border-rose-500/40 flex items-center justify-between text-[4.5px]">
          <span className="font-bold text-white">VIP Passes Open</span>
          <span className="px-1.5 py-0.5 rounded bg-white text-rose-900 font-extrabold">
            Register →
          </span>
        </div>
      </div>
    );
  }

  if (template.category === "Finance") {
    return (
      <div className="relative w-44 h-52 bg-white text-slate-900 rounded-md shadow-md border border-slate-200 p-2 flex flex-col justify-between overflow-hidden select-none group-hover:scale-105 group-hover:shadow-lg transition-all duration-300">
        <div className="h-1.5 w-full bg-emerald-600 rounded-full mb-1 shrink-0" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded bg-emerald-600 text-white flex items-center justify-center text-[6.5px] font-bold">
              V
            </div>
            <div>
              <div className="text-[6.5px] font-bold text-slate-900">Vertex Inc.</div>
              <div className="text-[4.5px] text-slate-500">Cloud Consulting</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[7.5px] font-bold text-emerald-600">INVOICE</div>
            <div className="text-[4.5px] text-slate-500">#INV-2026-0842</div>
          </div>
        </div>

        <div className="rounded border border-slate-200 overflow-hidden text-[4.5px]">
          <div className="bg-slate-900 text-white px-1 py-0.5 font-bold flex justify-between">
            <span>Description</span>
            <span>Amount</span>
          </div>
          <div className="px-1 py-0.5 border-b border-slate-100 flex justify-between text-slate-700">
            <span className="truncate">Cloud Architecture (40h)</span>
            <span className="font-mono font-semibold">$7,000</span>
          </div>
          <div className="px-1 py-0.5 bg-slate-50 flex justify-between text-slate-700">
            <span className="truncate">Frontend App (80h)</span>
            <span className="font-mono font-semibold">$12,000</span>
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded p-1 flex items-center justify-between text-[5px]">
          <div>
            <div className="text-[4.5px] text-slate-400">Total Due</div>
            <div className="font-extrabold text-emerald-400 text-[7.5px]">$26,500.00</div>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-[4.5px]">
            Net 30
          </span>
        </div>
      </div>
    );
  }

  if (template.category === "Certificates") {
    return (
      <div className="relative w-44 h-52 bg-amber-50/70 text-slate-900 rounded-md shadow-md border-2 border-amber-600/70 p-2 flex flex-col justify-between items-center text-center overflow-hidden select-none group-hover:scale-105 group-hover:shadow-amber-500/20 group-hover:shadow-lg transition-all duration-300">
        <div className="w-full h-full border border-amber-700/40 p-1.5 flex flex-col justify-between items-center">
          <div className="w-4 h-4 rounded-full bg-amber-200 border border-amber-600 flex items-center justify-center text-[6px] text-amber-800">
            ★
          </div>
          <div>
            <div className="text-[6px] tracking-widest font-serif font-bold text-amber-900 uppercase">
              Certificate of Excellence
            </div>
            <div className="text-[4.5px] text-amber-700/80 mt-0.5">PRESENTED PROUDLY TO</div>
            <div className="text-[8px] font-bold text-slate-900 mt-0.5 font-serif">
              Alex Morgan
            </div>
            <div className="w-14 h-0.5 bg-amber-600 mx-auto mt-0.5" />
            <div className="text-[4.5px] text-slate-600 mt-1 line-clamp-2 px-1">
              For exemplary engineering leadership and cloud architecture transformation.
            </div>
          </div>
          <div className="w-full flex justify-between items-center text-[4px] text-slate-500 pt-0.5 border-t border-amber-600/30">
            <span>CEO Signature</span>
            <span>VP Engineering</span>
          </div>
        </div>
      </div>
    );
  }

  if (template.category === "Business") {
    return (
      <div className="relative w-44 h-52 bg-white text-slate-900 rounded-md shadow-md border border-slate-200 p-2 flex flex-col justify-between overflow-hidden select-none group-hover:scale-105 group-hover:shadow-lg transition-all duration-300">
        <div className="bg-slate-900 text-white rounded p-1">
          <div className="text-[4.5px] text-blue-300 font-bold uppercase tracking-wider">STRATEGIC PROPOSAL</div>
          <div className="text-[7.5px] font-bold text-white truncate mt-0.5">Cloud Modernization</div>
          <div className="text-[4.5px] text-slate-300">Prepared for: Apex Global</div>
        </div>
        <div className="space-y-0.5 text-[4.5px]">
          <div className="p-0.5 rounded bg-slate-50 border border-slate-200 font-semibold text-slate-700">
            Phase 1: Discovery & Audit ($45k)
          </div>
          <div className="p-0.5 rounded bg-slate-50 border border-slate-200 font-semibold text-slate-700">
            Phase 2: Mesh Deployment ($85k)
          </div>
          <div className="p-0.5 rounded bg-slate-50 border border-slate-200 font-semibold text-slate-700">
            Phase 3: AI Copilot Enablement ($60k)
          </div>
        </div>
        <div className="bg-blue-900 text-white rounded p-1 flex justify-between items-center text-[4.5px]">
          <span>Total: $220,000</span>
          <span className="font-bold underline">Review Timeline</span>
        </div>
      </div>
    );
  }

  // Default: Resume (Clean ATS layout)
  return (
    <div className="relative w-44 h-52 bg-white text-slate-900 rounded-md shadow-md border border-slate-200 p-2 flex flex-col justify-between overflow-hidden select-none group-hover:scale-105 group-hover:shadow-lg transition-all duration-300">
      <div>
        <div
          className="h-1 w-full rounded-full mb-1 shrink-0"
          style={{ backgroundColor: template.accentColor }}
        />
        <div className="text-[7.5px] font-bold text-slate-900">{template.name}</div>
        <div className="w-14 h-0.5 bg-blue-600 rounded-full my-1" />
        <div className="text-[4.5px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 pb-0.5 mb-1">
          Experience
        </div>
        <div className="space-y-0.5">
          <div className="flex justify-between text-[4.5px] text-slate-700 font-semibold">
            <span>Senior Lead Role</span>
            <span className="text-slate-400">2022–Pres</span>
          </div>
          <div className="w-full h-0.5 bg-slate-200 rounded" />
          <div className="w-4/5 h-0.5 bg-slate-200 rounded" />
        </div>
        <div className="text-[4.5px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 pb-0.5 mt-1.5 mb-0.5">
          Education & Skills
        </div>
        <div className="flex flex-wrap gap-0.5">
          <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-600 text-[4px]">TypeScript</span>
          <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-600 text-[4px]">React</span>
          <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-600 text-[4px]">AWS</span>
        </div>
      </div>
      <div className="text-[4.5px] text-slate-400 text-center border-t border-slate-100 pt-0.5">
        Standard ATS Format
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category-Specific Modal Full Preview Component
// ---------------------------------------------------------------------------
function TemplateModalPreview({ template }: { template: TemplateMetadata }) {
  if (template.category === "Landing Pages") {
    return (
      <div className="w-full max-w-[500px] bg-slate-950 text-white rounded-xl shadow-2xl border border-indigo-900/60 p-6 select-none">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full mb-3" />
        <div className="bg-slate-900/90 rounded-lg p-4 border border-indigo-800/40">
          <span className="inline-block px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/50 text-[10px] font-bold text-indigo-300 tracking-wider mb-2">
            ✦ NEXT-GEN AI WORKSPACE
          </span>
          <h3 className="text-lg font-extrabold text-white leading-tight">
            Accelerate Cloud Engineering 10x Faster
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            The all-in-one developer workspace to design, simulate, and deploy microservices with autonomous AI agents.
          </p>
          <div className="mt-3 flex gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-md">
              Start Free Trial →
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
              Live Demo
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="font-bold text-blue-400">⚡ Instant Sync</div>
            <div className="text-[10px] text-slate-400 mt-1">Global sub-10ms state replication.</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="font-bold text-purple-400">🛡️ Zero-Trust</div>
            <div className="text-[10px] text-slate-400 mt-1">mTLS between all microservices.</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="font-bold text-emerald-400">🤖 AI Copilots</div>
            <div className="text-[10px] text-slate-400 mt-1">Automated test generation & triage.</div>
          </div>
        </div>
      </div>
    );
  }

  if (template.category === "Architecture") {
    return (
      <div className="w-full max-w-[500px] bg-slate-950 text-white rounded-xl shadow-2xl border border-cyan-900/60 p-6 select-none font-mono">
        <div className="h-1.5 w-full bg-cyan-400 rounded-full mb-3" />
        <div className="flex justify-between items-center text-xs text-cyan-400 border-b border-cyan-950 pb-2 mb-3">
          <span>SYS-ARCHITECTURE-BLUEPRINT</span>
          <span>REV 3.2 • PRODUCTION</span>
        </div>
        <h3 className="text-base font-bold text-white font-sans">
          Distributed Event Streaming Mesh v3.2
        </h3>
        <p className="text-xs text-slate-400 mt-1 font-sans">
          Multi-Region Kafka Event Sourcing with Envoy Gateway & Kubernetes Compute Mesh
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-sans">
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="font-bold text-blue-400">Tier 1: Edge Gateway</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Cloudflare CDN + Envoy Gateway</p>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="font-bold text-purple-400">Tier 2: Compute Mesh</span>
            <p className="text-[10px] text-slate-400 mt-0.5">EKS Cluster with Go/Rust pods</p>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="font-bold text-orange-400">Tier 3: Kafka Streaming</span>
            <p className="text-[10px] text-slate-400 mt-0.5">150k msg/sec partitioned topics</p>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="font-bold text-emerald-400">Tier 4: Distributed DB</span>
            <p className="text-[10px] text-slate-400 mt-0.5">CockroachDB + Redis session cache</p>
          </div>
        </div>
      </div>
    );
  }

  if (template.id === "banner-enterprise-circle") {
    return (
      <div className="w-full max-w-[540px] bg-[#fffaf5] text-slate-900 rounded-xl shadow-2xl border border-orange-200 p-5 select-none max-h-[70vh] overflow-y-auto">
        {/* Top Header Logo Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-orange-200/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-orange-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
              N
            </div>
            <div>
              <div className="text-base font-extrabold text-slate-900 leading-tight">netsmartz</div>
              <div className="text-[9px] font-bold text-slate-400 tracking-wider">SINCE 1999</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
            <span className="text-xl font-black text-orange-600">27</span>
            <div className="text-[9px] font-bold text-slate-600 leading-tight">
              CELEBRATING<br />Years
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-black text-slate-900 leading-none">Netsmartz</h2>
            <h2 className="text-3xl font-black text-orange-600 leading-tight">Circle</h2>
            <p className="text-xs text-slate-700 mt-2 leading-relaxed">
              We connect you with other Netsmartz customers when we identify a potential business fit -- helping you discover new customers, partners, suppliers and opportunities.
            </p>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              This initiative leverages our existing customer network to identify commercial opportunities between our customers and for our customers.
            </p>
          </div>
          <div className="relative w-44 h-36 rounded-xl overflow-hidden border-2 border-orange-400 shadow-md shrink-0 bg-orange-100">
            <img
              src="/enterprise-partnership-hero.jpg"
              alt="Corporate Handshake at Sunset"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <span className="absolute bottom-1.5 left-2 text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
              Executive Network
            </span>
          </div>
        </div>

        {/* 4 Orbit Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-4">
          <div className="bg-white p-1.5 rounded-lg border border-orange-200 text-center shadow-xs">
            <div className="text-[10px] font-bold text-orange-600">💡 Exchange Ideas</div>
          </div>
          <div className="bg-white p-1.5 rounded-lg border border-orange-200 text-center shadow-xs">
            <div className="text-[10px] font-bold text-orange-600">🤝 Partnerships</div>
          </div>
          <div className="bg-white p-1.5 rounded-lg border border-orange-200 text-center shadow-xs">
            <div className="text-[10px] font-bold text-orange-600">📈 Opportunities</div>
          </div>
          <div className="bg-white p-1.5 rounded-lg border border-orange-200 text-center shadow-xs">
            <div className="text-[10px] font-bold text-orange-600">👥 Connections</div>
          </div>
        </div>

        {/* Section 1: How It Works */}
        <div className="mt-5">
          <div className="bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-2.5 shadow-sm">
            How Netsmartz Circle works
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-white p-2.5 rounded-xl border border-orange-200 text-center shadow-xs flex flex-col justify-between">
              <div className="w-6 h-6 mx-auto rounded-full bg-orange-100 text-orange-600 font-extrabold text-xs flex items-center justify-center mb-1">
                1
              </div>
              <div className="text-[11px] font-bold text-slate-900 leading-tight">We understand your business</div>
              <p className="text-[9.5px] text-slate-500 mt-1 leading-snug">Learn about your goals and offerings.</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-orange-200 text-center shadow-xs flex flex-col justify-between">
              <div className="w-6 h-6 mx-auto rounded-full bg-orange-100 text-orange-600 font-extrabold text-xs flex items-center justify-center mb-1">
                2
              </div>
              <div className="text-[11px] font-bold text-slate-900 leading-tight">We identify matches</div>
              <p className="text-[9.5px] text-slate-500 mt-1 leading-snug">Search network for commercial fit.</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-orange-200 text-center shadow-xs flex flex-col justify-between">
              <div className="w-6 h-6 mx-auto rounded-full bg-orange-100 text-orange-600 font-extrabold text-xs flex items-center justify-center mb-1">
                3
              </div>
              <div className="text-[11px] font-bold text-slate-900 leading-tight">We make introduction</div>
              <p className="text-[9.5px] text-slate-500 mt-1 leading-snug">Approach you first for approval.</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-orange-200 text-center shadow-xs flex flex-col justify-between">
              <div className="w-6 h-6 mx-auto rounded-full bg-orange-100 text-orange-600 font-extrabold text-xs flex items-center justify-center mb-1">
                4
              </div>
              <div className="text-[11px] font-bold text-slate-900 leading-tight">Take forward</div>
              <p className="text-[9.5px] text-slate-500 mt-1 leading-snug">You decide how to partner or trade.</p>
            </div>
          </div>
        </div>

        {/* Section 2: What can you discover */}
        <div className="mt-4">
          <div className="bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-2.5 shadow-sm">
            What can you discover through Netsmartz Circle?
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="bg-white p-2.5 rounded-xl border border-orange-200 shadow-xs">
              <div className="text-xs font-bold text-slate-900">New Customers & Market</div>
              <p className="text-[10px] text-slate-500 mt-1">Get introduced to enterprises that need your services.</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-orange-200 shadow-xs">
              <div className="text-xs font-bold text-slate-900">Business Partnerships</div>
              <p className="text-[10px] text-slate-500 mt-1">Unite with complementary firms to win bigger deals.</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-orange-200 shadow-xs">
              <div className="text-xs font-bold text-slate-900">New Suppliers & Vendors</div>
              <p className="text-[10px] text-slate-500 mt-1">Source reliable, pre-vetted peer partners.</p>
            </div>
          </div>
        </div>

        {/* Section 3: Trust Pillars */}
        <div className="mt-4">
          <div className="bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-2 shadow-sm">
            A few things to know
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-white p-2.5 rounded-xl border border-orange-200 shadow-xs flex items-start gap-2">
              <span className="text-emerald-600 text-base">🛡️</span>
              <div>
                <div className="text-xs font-bold text-slate-900">Your approval comes first</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Your data stays 100% private. Introductions happen only after your consent.</div>
              </div>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-orange-200 shadow-xs flex items-start gap-2">
              <span className="text-orange-600 text-base">🚫</span>
              <div>
                <div className="text-xs font-bold text-slate-900">Zero referral fees or cuts</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Complimentary initiative for valued clients. We never take any transaction cut.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (template.category === "Banners") {
    return (
      <div className="w-full max-w-[500px] bg-gradient-to-b from-purple-950 via-fuchsia-950 to-pink-950 text-white rounded-xl shadow-2xl border border-fuchsia-800/60 p-6 select-none">
        <div className="h-1.5 w-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 rounded-full mb-3" />
        <div className="text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-pink-500/20 border border-pink-400/40 text-xs font-bold text-pink-300">
            ✦ ANNUAL FLAGSHIP TECH SUMMIT ✦
          </span>
          <h3 className="text-xl font-black text-white mt-2 tracking-tight">
            GLOBAL AI & CLOUD SUMMIT 2026
          </h3>
          <p className="text-xs text-pink-200 mt-1">
            Moscone Center, San Francisco • October 14–16, 2026
          </p>
        </div>

        <div className="mt-4 rounded-xl bg-purple-900/60 border border-purple-500/30 p-3.5 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-violet-500 p-0.5 shrink-0 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-purple-950 flex items-center justify-center text-sm font-bold text-pink-300">
              ER
            </div>
          </div>
          <div>
            <div className="text-[10px] text-pink-400 font-bold uppercase tracking-wider">Keynote Speaker</div>
            <div className="text-sm font-bold text-white">Dr. Elena Rostova</div>
            <div className="text-xs text-purple-200">Chief AI Scientist at Synthetix Labs</div>
          </div>
        </div>
      </div>
    );
  }

  if (template.category === "Finance") {
    return (
      <div className="w-full max-w-[500px] bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 p-6 select-none">
        <div className="h-2 w-full bg-emerald-600 rounded-full mb-3" />
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <div>
            <div className="text-base font-bold text-slate-900">Vertex Solutions Inc.</div>
            <div className="text-xs text-slate-500">Cloud Infrastructure Consulting</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-emerald-600">INVOICE</div>
            <div className="text-xs text-slate-500">#INV-2026-0842</div>
          </div>
        </div>

        <div className="mt-3 rounded border border-slate-200 overflow-hidden text-xs">
          <div className="bg-slate-900 text-white px-3 py-1.5 font-bold flex justify-between">
            <span>Description</span>
            <span>Amount</span>
          </div>
          <div className="px-3 py-2 border-b border-slate-100 flex justify-between">
            <span>Cloud Infrastructure Setup (40 hrs)</span>
            <span className="font-semibold">$7,000.00</span>
          </div>
          <div className="px-3 py-2 bg-slate-50 flex justify-between">
            <span>Frontend Application Engineering (80 hrs)</span>
            <span className="font-semibold">$12,000.00</span>
          </div>
        </div>

        <div className="mt-3 p-3 bg-slate-900 text-white rounded-lg flex justify-between items-center">
          <span className="text-xs text-slate-300">Total Amount Due</span>
          <span className="text-base font-bold text-emerald-400">$26,500.00</span>
        </div>
      </div>
    );
  }

  if (template.category === "Certificates") {
    return (
      <div className="w-full max-w-[500px] bg-amber-50/80 text-slate-900 rounded-xl shadow-2xl border-4 border-amber-600/80 p-6 select-none text-center">
        <div className="border border-amber-700/40 p-4 rounded">
          <div className="w-10 h-10 rounded-full bg-amber-200 border-2 border-amber-600 mx-auto flex items-center justify-center text-sm font-bold text-amber-800">
            ★
          </div>
          <h3 className="text-lg font-serif font-bold text-amber-950 tracking-widest mt-2 uppercase">
            Certificate of Excellence
          </h3>
          <div className="text-xs text-amber-800 mt-0.5">THIS RECOGNITION IS PRESENTED TO</div>
          <div className="text-xl font-serif font-bold text-slate-950 mt-1">
            Alex Morgan
          </div>
          <div className="w-24 h-0.5 bg-amber-600 mx-auto my-1.5" />
          <p className="text-xs text-slate-600 italic px-4">
            For outstanding leadership and exemplary technical contributions to the Enterprise Cloud Architecture project.
          </p>
        </div>
      </div>
    );
  }

  // Default: Resume Preview
  return (
    <div className="w-full max-w-[500px] bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 p-6 select-none">
      <div
        className="h-2 w-full rounded-full mb-3"
        style={{ backgroundColor: template.accentColor }}
      />
      <div className="text-base font-bold text-slate-900">{template.name}</div>
      <div className="text-xs text-blue-600 font-semibold mb-1">
        Senior Professional Layout
      </div>
      <div className="text-xs text-slate-500 pb-2 border-b border-slate-200 mb-3">
        San Francisco, CA • candidate@example.com • (555) 234-5678
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <div className="font-bold uppercase text-[10px] text-slate-800 tracking-wider">
            Work Experience
          </div>
          <div className="flex justify-between font-semibold text-slate-800 mt-1">
            <span>Senior Lead — Acme Tech</span>
            <span className="text-slate-400 font-normal">2022 – Present</span>
          </div>
          <div className="text-slate-600 text-[11px] mt-0.5">
            • Led architecture and scaling of multi-region cloud services.
          </div>
        </div>

        <div>
          <div className="font-bold uppercase text-[10px] text-slate-800 tracking-wider mt-2">
            Key Skills
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {template.tags.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
