import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  FileUp,
  Lock,
  Menu,
  PenTool,
  ShieldCheck,
  Signature,
  SquareStack,
  Type,
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
    <div className="flex min-h-screen flex-col bg-background">
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
            <Button variant="brand" size="sm" onClick={() => openEditor()}>
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-[12px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-brand" />
            Private by default — files never leave your session
          </span>
          <h1 className="mt-6 text-[42px] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[54px]">
            Edit PDFs. Simply.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-muted-foreground">
            Edit, annotate, sign and manage your PDF documents from one powerful workspace.
          </p>
        </section>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            openEditor(e.dataTransfer.files?.[0]?.name);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          className={cn(
            "mt-12 cursor-pointer rounded-xl border border-dashed border-border bg-secondary/40 px-6 py-14 text-center transition-all",
            "hover:border-brand/60 hover:bg-brand-soft/50",
            dragging && "border-brand bg-brand-soft shadow-panel",
          )}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-background shadow-panel">
            <FileUp className={cn("h-6 w-6 text-muted-foreground", dragging && "text-brand")} />
          </div>
          <h2 className="mt-5 text-[19px] font-semibold tracking-tight">Drop your PDF here</h2>
          <p className="mt-1 text-[13.5px] text-muted-foreground">or click to browse</p>
          <Button
            variant="brand"
            size="xl"
            className="mt-6"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            Choose PDF
          </Button>
          <p className="mt-4 text-[12.5px] text-muted-foreground">PDF files up to 100 MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => openEditor(e.target.files?.[0]?.name)}
          />
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-[12.5px] text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          Your files stay private and secure.
        </p>

        <section id="tools" className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Type, title: "Edit text", text: "Change words, fonts and layout in place." },
            { icon: Signature, title: "Sign", text: "Draw, type or upload a signature." },
            { icon: PenTool, title: "Annotate", text: "Highlight, comment and mark up pages." },
            { icon: SquareStack, title: "Organise", text: "Reorder, rotate, merge and split pages." },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-border bg-card p-4 shadow-panel transition-colors hover:border-brand/40"
            >
              <f.icon className="h-4.5 w-4.5 text-brand" />
              <h3 className="mt-3 text-[14px] font-semibold">{f.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{f.text}</p>
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
