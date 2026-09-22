import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { FileUp, Files, Loader2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { ThumbnailSidebar } from "@/components/editor/ThumbnailSidebar";
import { PdfWorkspace } from "@/components/editor/PdfWorkspace";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { BottomToolbar } from "@/components/editor/BottomToolbar";
import { SignatureModal } from "@/components/editor/modals/SignatureModal";
import { ImageModal } from "@/components/editor/modals/ImageModal";
import { LinkModal } from "@/components/editor/modals/LinkModal";
import { useEditorState } from "@/components/editor/useEditorState";
import { PdfDocContext, usePdfUpload } from "@/components/editor/usePdfDocument";

export function EditorPage({ fileName }: { fileName?: string }) {
  const editor = useEditorState(fileName);
  const { status, pdf } = usePdfUpload();
  const setPdfPages = editor.setPdfPages;

  useEffect(() => {
    if (pdf) setPdfPages(pdf.sizes, pdf.fileName);
  }, [pdf, setPdfPages]);

  const closeModal = (open: boolean) => {
    if (!open) {
      editor.setModal(null);
      editor.setTool("select");
    }
  };

  const documentIsSynced =
    pdf !== null &&
    editor.document.fileName === pdf.fileName &&
    editor.document.pages.length === pdf.sizes.length &&
    editor.document.pages.every(
      (page, index) =>
        page.width === pdf.sizes[index]?.width && page.height === pdf.sizes[index]?.height,
    );

  if (status === "loading" || (status === "ready" && !documentIsSynced)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status !== "ready") {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-card shadow-panel">
          <FileUp className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-[19px] font-semibold tracking-tight">
            {status === "error" ? "That file could not be opened" : "No document open"}
          </h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Choose a PDF from your device to start editing.
          </p>
        </div>
        <Button variant="brand" size="lg" asChild>
          <Link to="/">Upload a PDF</Link>
        </Button>
      </div>
    );
  }

  return (
    <PdfDocContext.Provider value={pdf?.doc ?? null}>
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <EditorHeader editor={editor} />
      <EditorToolbar editor={editor} />

      <div className="flex min-h-0 flex-1">
        {editor.sidebarOpen && (
          <aside className="hidden w-[228px] shrink-0 border-r border-border lg:block">
            <ThumbnailSidebar editor={editor} />
          </aside>
        )}

        <main className="min-w-0 flex-1">
          <PdfWorkspace editor={editor} />
        </main>

        {editor.panelOpen && (
          <aside className="hidden w-[272px] shrink-0 border-l border-border lg:block">
            <PropertiesPanel editor={editor} />
          </aside>
        )}
      </div>

      <div className="flex h-11 items-center justify-between gap-2 border-t border-border bg-toolbar px-3 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <Files className="h-4 w-4" /> Pages
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] p-0">
            <SheetHeader className="border-b border-border p-3">
              <SheetTitle className="text-sm">Pages</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100%-3.25rem)]">
              <ThumbnailSidebar editor={editor} />
            </div>
          </SheetContent>
        </Sheet>

        <span className="text-[12px] tabular-nums text-muted-foreground">
          {editor.activePage} / {editor.document.pages.length}
        </span>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" /> Properties
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[288px] p-0">
            <SheetHeader className="border-b border-border p-3">
              <SheetTitle className="text-sm">Properties</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100%-3.25rem)]">
              <PropertiesPanel editor={editor} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden lg:block">
        <BottomToolbar editor={editor} />
      </div>

      <SignatureModal
        open={editor.modal === "signature"}
        onOpenChange={closeModal}
        onApply={(signature) => {
          editor.addSignature(editor.activePage, signature);
          editor.setModal(null);
          editor.setTool("select");
        }}
      />
      <ImageModal
        open={editor.modal === "image"}
        onOpenChange={closeModal}
        onApply={(src, alt) => {
          editor.addImage(editor.activePage, src, alt);
          editor.setModal(null);
          editor.setTool("select");
        }}
      />
      <LinkModal
        open={editor.modal === "link"}
        onOpenChange={closeModal}
        onApply={(url) => {
          editor.addLink(editor.activePage, url);
          editor.setModal(null);
          editor.setTool("select");
        }}
      />
    </div>
    </PdfDocContext.Provider>
  );
}
