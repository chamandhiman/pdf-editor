import { Link } from "@tanstack/react-router";
import {
  Type,
  Heading,
  Highlighter,
  PenTool,
  Image as ImageIcon,
  Shapes,
  StickyNote,
  SlidersHorizontal,
  ChevronDown,
  Download,
  Printer,
  Copy,
  Trash2,
  Move,
  FileText,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandMark } from "@/components/BrandMark";

interface EditorPreviewSectionProps {
  onTryNow?: () => void;
  onTryEditor?: () => void;
}

export function EditorPreviewSection({ onTryNow, onTryEditor }: EditorPreviewSectionProps) {
  const handleTry = onTryNow || onTryEditor || (() => {});

  return (
    <section className="relative overflow-hidden py-20 bg-gradient-to-b from-background via-secondary/30 to-background border-y border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="gap-1.5 py-1 px-3 text-xs border-brand/30 bg-brand-soft/50 text-brand">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Built on PDF.js & Client-Side Canvas</span>
          </Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            A Modern, Desktop-Grade Editor Inside Your Browser
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Experience in-place text editing, accurate typography styling, vector shapes, electronic
            signatures, and page organization without uploading files to third-party servers.
          </p>
        </div>

        {/* Realistic Editor Frame */}
        <div className="mt-12 rounded-2xl border border-border/80 bg-card shadow-2xl shadow-black/10 overflow-hidden ring-1 ring-border/50">
          {/* Editor Header */}
          <div className="flex h-12 items-center justify-between border-b border-border bg-toolbar px-4 select-none">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/80 inline-block" />
              </div>
              <div className="h-4 w-px bg-border mx-1" />
              <div className="flex items-center gap-2">
                <BrandMark className="h-4 w-4" />
                <span className="text-xs font-semibold text-foreground">
                  Master_Service_Agreement_v4.pdf
                </span>
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                  4 Pages
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground bg-secondary/80 rounded px-2 py-1">
                <span>Zoom 100%</span>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                <Download className="h-3 w-3" />
                <span>Download</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </div>
          </div>

          {/* Editor Toolbar */}
          <div className="flex h-10 items-center gap-1 border-b border-border bg-background px-4 overflow-x-auto text-xs text-muted-foreground select-none">
            <div className="flex items-center gap-1 rounded bg-brand-soft text-brand px-2.5 py-1 font-medium">
              <Type className="h-3.5 w-3.5" />
              <span>Edit Text</span>
            </div>
            <div className="flex items-center gap-1 rounded hover:bg-accent px-2 py-1 cursor-pointer">
              <Heading className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add Text</span>
            </div>
            <div className="flex items-center gap-1 rounded hover:bg-accent px-2 py-1 cursor-pointer">
              <Highlighter className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Highlight</span>
            </div>
            <div className="flex items-center gap-1 rounded hover:bg-accent px-2 py-1 cursor-pointer">
              <PenTool className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign</span>
            </div>
            <div className="flex items-center gap-1 rounded hover:bg-accent px-2 py-1 cursor-pointer">
              <ImageIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Image</span>
            </div>
            <div className="flex items-center gap-1 rounded hover:bg-accent px-2 py-1 cursor-pointer">
              <Shapes className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Shapes</span>
            </div>
            <div className="flex items-center gap-1 rounded hover:bg-accent px-2 py-1 cursor-pointer">
              <StickyNote className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Note</span>
            </div>
          </div>

          {/* Main Workspace Simulation */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px] bg-canvas/60">
            {/* Left Page Thumbnails */}
            <div className="hidden md:flex md:col-span-2 border-r border-border bg-background/50 p-3 flex-col gap-3">
              <div className="rounded-lg border-2 border-brand bg-card p-2 shadow-sm">
                <div className="h-24 w-full bg-secondary/70 rounded flex flex-col p-1.5 gap-1">
                  <div className="h-2 w-3/4 bg-brand/30 rounded" />
                  <div className="h-1.5 w-full bg-muted-foreground/20 rounded" />
                  <div className="h-1.5 w-5/6 bg-muted-foreground/20 rounded" />
                  <div className="h-6 w-full bg-brand-soft/80 rounded mt-1 border border-brand/20" />
                </div>
                <span className="text-[10px] font-semibold text-brand block mt-1 text-center">
                  Page 1 (Active)
                </span>
              </div>
              <div className="rounded-lg border border-border bg-card p-2 opacity-60">
                <div className="h-24 w-full bg-secondary/40 rounded flex flex-col p-1.5 gap-1">
                  <div className="h-2 w-2/3 bg-muted-foreground/20 rounded" />
                  <div className="h-1.5 w-full bg-muted-foreground/20 rounded" />
                  <div className="h-1.5 w-4/5 bg-muted-foreground/20 rounded" />
                </div>
                <span className="text-[10px] text-muted-foreground block mt-1 text-center">
                  Page 2
                </span>
              </div>
            </div>

            {/* Center Canvas Preview */}
            <div className="col-span-12 md:col-span-7 flex items-center justify-center p-6 sm:p-8">
              <div className="relative w-full max-w-lg rounded-xl bg-card border border-border shadow-xl p-8 text-foreground">
                <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-5">
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      SERVICES & NON-DISCLOSURE AGREEMENT
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Confidential Document • Executed 2026
                    </p>
                  </div>
                  <Badge variant="outline" className="border-emerald-600/30 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-[10px]">
                    Verified
                  </Badge>
                </div>

                {/* Simulated Selected Text with Bounding Box & 4-Corner Move Handles */}
                <div className="relative rounded-md border-2 border-brand bg-brand-soft/20 p-3 my-4">
                  {/* Corner handles */}
                  <span className="absolute -top-1.5 -left-1.5 h-3 w-3 rounded-full border-2 border-brand bg-background shadow-sm" />
                  <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full border-2 border-brand bg-background shadow-sm" />
                  <span className="absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-full border-2 border-brand bg-background shadow-sm" />
                  <span className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-full border-2 border-brand bg-background shadow-sm" />

                  {/* Contextual Toolbar Pill */}
                  <div className="absolute -top-8 right-2 flex items-center gap-1 rounded bg-background border border-border shadow-md px-1.5 py-0.5 text-[11px]">
                    <span className="font-semibold text-brand flex items-center gap-1">
                      <Move className="h-2.5 w-2.5" /> Move
                    </span>
                    <span className="text-muted-foreground">|</span>
                    <Copy className="h-2.5 w-2.5 text-muted-foreground" />
                    <Trash2 className="h-2.5 w-2.5 text-destructive" />
                  </div>

                  <p className="text-sm font-semibold text-foreground">
                    1. Scope of Commercial Deliverables
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Provider agrees to supply comprehensive digital asset workflows, automated document
                    transformation, and encrypted client-side storage architecture.
                  </p>
                </div>

                {/* Simulated Signature Stamp */}
                <div className="mt-6 flex items-end justify-between border-t border-dashed border-border pt-4">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                      Authorized Signature
                    </span>
                    <span className="font-serif italic text-lg text-brand mt-0.5 block">
                      Chaman Dhiman
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block">Date of Execution</span>
                    <span className="text-xs font-medium text-foreground">September 27, 2026</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Properties Panel */}
            <div className="hidden md:flex md:col-span-3 border-l border-border bg-toolbar/60 p-4 flex-col gap-4 text-xs">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                  Text Properties
                </span>
                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Font Family</label>
                <div className="rounded border border-input bg-background px-2 py-1 font-medium">
                  Inter (System Sans)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Size</label>
                  <div className="rounded border border-input bg-background px-2 py-1 font-medium">
                    14 px
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Color</label>
                  <div className="flex items-center gap-2 rounded border border-input bg-background px-2 py-1">
                    <span className="h-3 w-3 rounded-full bg-brand" />
                    <span>#2f5bd1</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Page Assignment</label>
                <div className="rounded border border-input bg-background px-2 py-1 font-medium">
                  Page 1 of 4
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-border">
                <Button variant="brand" size="sm" className="w-full gap-2 text-xs" onClick={handleTry}>
                  Try PDF Studio Now
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview CTA */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-center">
          <Button variant="brand" size="lg" className="gap-2 px-8" onClick={handleTry}>
            Try PDF Studio Free
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Link to="/tools">
            <Button variant="outline" size="lg">
              Explore All 30+ Tools
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
