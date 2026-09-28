import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  FileText,
  FileUp,
  Folder,
  Image as LucideImage,
  Lock,
  Menu,
  PenTool,
  ShieldCheck,
  Signature,
  Sparkles,
  SquareStack,
  Type,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BrandMark } from "@/components/BrandMark";
import { cn } from "@/lib/utils";
import { setUploadedPdf } from "@/lib/pdf-store";

const nav = ["Tools", "Features", "Pricing", "Resources"];

export function UploadPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const openFile = async (file?: File | null) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file.");
      return;
    }
    setError(null);
    const bytes = await file.arrayBuffer();
    setUploadedPdf(bytes, file.name);
    navigate({ to: "/editor", search: { file: file.name } });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-brand selection:text-white">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-5">
          <div className="flex items-center gap-2">
            <BrandMark />
            <span className="text-[15px] font-semibold tracking-tight">PDF Studio</span>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <a
                key={item}
                href="#tools"
                className="rounded-md px-3 py-1.5 text-[13.5px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              Sign In
            </Button>
            <Button variant="brand" size="sm" onClick={() => inputRef.current?.click()}>
              Get Started
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="mt-4 flex flex-col">
                  {[...nav, "Sign In"].map((item) => (
                    <a
                      key={item}
                      href="#tools"
                      className="rounded-md px-2 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      {item}
                    </a>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-16 sm:py-20">
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand">
            <ShieldCheck className="h-3.5 w-3.5" />
            Zero-Cloud Leak Privacy · Files Stay In Your Browser
          </span>
          <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight">
            The Complete <span className="bg-gradient-to-r from-brand via-brand to-orange-500 bg-clip-text text-transparent">PDF Center</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Edit text in-place, annotate, sign, merge, and convert your PDF documents with professional speed.
          </p>
        </section>

        {/* Upload Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void openFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          className={cn(
            "mt-10 cursor-pointer rounded-3xl border-2 border-dashed border-border bg-card/60 p-8 sm:p-14 text-center transition-all relative overflow-hidden",
            "hover:border-brand hover:bg-brand-soft/30 hover:shadow-xl pdf-card-glow",
            dragging && "border-brand bg-brand-soft/60 shadow-2xl scale-[1.01]",
          )}
        >
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-1/4 w-48 h-48 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

          {/* Floating file icons */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="-rotate-12 transform rounded-xl p-2.5 bg-background shadow-md border border-border text-brand">
              <LucideImage className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="rounded-2xl p-4 bg-gradient-to-br from-brand to-orange-600 shadow-xl shadow-brand/30 text-white transform -translate-y-2">
              <FileText className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div className="rotate-12 transform rounded-xl p-2.5 bg-background shadow-md border border-border text-brand">
              <Folder className="w-6 h-6 stroke-[2]" />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Drop your PDF here
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            or choose a file from your device
          </p>

          <Button
            variant="brand"
            size="xl"
            className="mt-6 px-8 py-3 text-base font-semibold shadow-lg shadow-brand/30 pdf-shine hover:shadow-brand/50"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            <FileUp className="w-5 h-5 mr-2" />
            Select PDF File
          </Button>

          <p className="mt-4 text-xs text-muted-foreground">
            Supports PDF files up to 100 MB · Instant in-browser processing
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => void openFile(e.target.files?.[0])}
          />
          {error && <p className="mt-3 text-xs text-destructive font-medium">{error}</p>}
        </div>

        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5 text-emerald-600" />
          End-to-end local sandbox — files are never uploaded to remote servers without consent.
        </p>

        {/* Feature Cards with Module Theme Gradients */}
        <section id="tools" className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Type,
              title: "Edit text",
              text: "Modify original text with automatic font matching.",
              colorClass: "icon-edit",
            },
            {
              icon: Signature,
              title: "Sign & Fill",
              text: "Draw, type, or place verifiable electronic signatures.",
              colorClass: "icon-sign",
            },
            {
              icon: PenTool,
              title: "Annotate",
              text: "Highlighter, pens, sticky notes, and vector shapes.",
              colorClass: "icon-compress",
            },
            {
              icon: SquareStack,
              title: "Organize",
              text: "Rearrange, rotate, merge, split, and extract pages.",
              colorClass: "icon-organize",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-brand/40 hover:shadow-md pdf-card-glow flex flex-col justify-between"
            >
              <div>
                <div className={`w-10 h-10 rounded-xl ${f.colorClass} flex items-center justify-center shadow-md mb-4`}>
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-base font-bold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 text-[12.5px] text-muted-foreground">
          <span>© 2026 PDF Studio</span>
          <div className="flex gap-4">
            <a href="#tools" className="hover:text-foreground">
              Privacy
            </a>
            <a href="#tools" className="hover:text-foreground">
              Terms
            </a>
            <a href="#tools" className="hover:text-foreground">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
