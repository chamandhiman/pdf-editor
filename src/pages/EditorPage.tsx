import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { FileUp, Files, Loader2, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
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
import { CropImageModal } from "@/components/editor/modals/CropImageModal";
import { LinkModal } from "@/components/editor/modals/LinkModal";
import { ReplacePdfModal } from "@/components/editor/modals/ReplacePdfModal";
import { SignInModal } from "@/components/editor/modals/SignInModal";
import { useEditorState } from "@/components/editor/useEditorState";
import { PdfDocContext, usePdfUpload } from "@/components/editor/usePdfDocument";
import { recordRecentDoc } from "@/lib/recent-docs";
import { saveDocumentState } from "@/lib/pdf-storage";

export function EditorPage({ fileName }: { fileName?: string }) {
  const navigate = useNavigate();
  const editor = useEditorState(fileName);
  const { status, pdf, errorMessage, reload } = usePdfUpload();
  const setPdfPages = editor.setPdfPages;
  const setDocument = editor.setDocument;

  // Modal visibility state
  const [replacePdfOpen, setReplacePdfOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

  // If no document can be restored on refresh, redirect to home/upload page
  useEffect(() => {
    if (status === "empty") {
      navigate({ to: "/" });
    }
  }, [status, navigate]);

  // Restore PDF and document state
  useEffect(() => {
    if (pdf) {
      if (pdf.storedDocState && pdf.storedDocState.pages && pdf.storedDocState.pages.length > 0) {
        setDocument(pdf.storedDocState, pdf.fileName);
      } else {
        setPdfPages(pdf.sizes, pdf.fileName);
      }
      // Record in recent docs so the dashboard can show it
      recordRecentDoc(pdf.fileName, pdf.sizes.length);
    }
  }, [pdf, setPdfPages, setDocument]);

  // Persist editor changes (text edits, annotations, objects) across refreshes
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (status === "ready" && pdf && editor.document.pages.length > 0) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveDocumentState(editor.document);
      }, 500);
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [editor.document, status, pdf]);

  const closeModal = (open: boolean) => {
    if (!open) {
      editor.setModal(null);
      editor.setTool("select");
    }
  };

  const handlePdfReplaced = (_bytes: ArrayBuffer, newFileName: string) => {
    toast.success(`Loaded "${newFileName}"`);
    reload();
  };

  const documentIsSynced =
    pdf !== null &&
    editor.document.fileName === pdf.fileName &&
    editor.document.pages.length > 0;

  if (status === "loading" || (status === "ready" && !documentIsSynced) || status === "empty") {
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
          <p className="mt-1 max-w-md text-[13.5px] text-muted-foreground">
            {status === "error" && errorMessage
              ? errorMessage
              : "Choose a PDF from your device to start editing."}
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
        <EditorHeader
          editor={editor}
          onReplaceClick={() => setReplacePdfOpen(true)}
          onSignInRequired={() => setSignInOpen(true)}
        />
        <EditorToolbar editor={editor} />

        <div className="flex min-h-0 flex-1">
          {editor.sidebarOpen && (
            <aside className="hidden w-[228px] shrink-0 border-r border-border lg:block">
              <ThumbnailSidebar editor={editor} doc={pdf?.doc ?? null} />
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

        {/* Mobile bottom bar */}
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
                <ThumbnailSidebar editor={editor} doc={pdf?.doc ?? null} />
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

        {/* Editor modals */}
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
            // If an image is already selected, replace its source
            if (editor.selected && editor.selected.type === "image") {
              editor.updateObject(editor.selected.id, {
                image: {
                  ...editor.selected.image,
                  src,
                  alt: alt || editor.selected.image?.alt || "Image",
                  originalSrc: src,
                },
              });
              editor.setModal(null);
              toast.success("Image replaced successfully");
              return;
            }

            // Immediately place the image onto active page in visible area
            const img = new Image();
            img.onload = () => {
              const nw = img.naturalWidth || 400;
              const nh = img.naturalHeight || 300;
              const maxW = 320;
              const maxH = 260;
              let w = nw;
              let h = nh;
              if (w > maxW || h > maxH) {
                const ratio = Math.min(maxW / w, maxH / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
              }

              const currentPage = editor.document.pages.find((p) => p.index === editor.activePage);
              const pageWidth = currentPage?.width ?? 794;
              const pageHeight = currentPage?.height ?? 1123;
              const x = Math.max(20, Math.round((pageWidth - w) / 2));
              const y = Math.max(50, Math.min(320, Math.round((pageHeight - h) / 3)));

              const newId = editor.addImage(editor.activePage, src, alt, { x, y }, { width: w, height: h });
              if (newId) {
                editor.setSelectedId(newId);
              }
              editor.setModal(null);
              editor.setTool("select");
              toast.success("Image placed on canvas! Drag to move, use handles to resize, or click Crop.");
            };
            img.onerror = () => {
              const newId = editor.addImage(editor.activePage, src, alt, { x: 160, y: 220 }, { width: 260, height: 170 });
              if (newId) {
                editor.setSelectedId(newId);
              }
              editor.setModal(null);
              editor.setTool("select");
              toast.success("Image placed on canvas!");
            };
            img.src = src;
          }}
        />

        {/* Crop Image Modal */}
        {editor.selected && editor.selected.type === "image" && editor.selected.image && (
          <CropImageModal
            open={editor.modal === "crop"}
            onOpenChange={(open) => {
              if (!open && editor.modal === "crop") {
                editor.setModal(null);
              }
            }}
            imageSrc={editor.selected.image.src}
            originalSrc={editor.selected.image.originalSrc || editor.selected.image.src}
            currentWidth={editor.selected.width}
            currentHeight={editor.selected.height}
            onApplyCrop={(croppedSrc, newWidth, newHeight) => {
              if (!editor.selected) return;
              editor.updateObject(editor.selected.id, {
                width: newWidth,
                height: newHeight,
                image: {
                  ...editor.selected.image!,
                  src: croppedSrc,
                  originalSrc: editor.selected.image?.originalSrc || editor.selected.image?.src || croppedSrc,
                },
              });
              editor.setModal(null);
              toast.success("Image cropped successfully!");
            }}
            onResetOriginal={() => {
              if (!editor.selected || !editor.selected.image?.originalSrc) return;
              editor.updateObject(editor.selected.id, {
                image: {
                  ...editor.selected.image,
                  src: editor.selected.image.originalSrc,
                },
              });
              editor.setModal(null);
              toast.success("Reset to original image");
            }}
          />
        )}
        <LinkModal
          open={editor.modal === "link"}
          onOpenChange={closeModal}
          onApply={(url) => {
            editor.addLink(editor.activePage, url);
            editor.setModal(null);
            editor.setTool("select");
          }}
        />

        {/* Replace PDF modal */}
        <ReplacePdfModal
          open={replacePdfOpen}
          onOpenChange={setReplacePdfOpen}
          onReplace={handlePdfReplaced}
        />

        {/* Sign In modal */}
        <SignInModal open={signInOpen} onOpenChange={setSignInOpen} />
      </div>
    </PdfDocContext.Provider>
  );
}
