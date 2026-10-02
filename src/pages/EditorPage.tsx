import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { FileUp, Files, Loader2, SlidersHorizontal, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { ThumbnailSidebar } from "@/components/editor/ThumbnailSidebar";
import { PdfWorkspace } from "@/components/editor/PdfWorkspace";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { BottomToolbar } from "@/components/editor/BottomToolbar";
import { EditorCursorFollower } from "@/components/editor/EditorCursorFollower";
import { SignatureModal } from "@/components/editor/modals/SignatureModal";
import { ImageModal } from "@/components/editor/modals/ImageModal";
import { CropImageModal } from "@/components/editor/modals/CropImageModal";
import { LinkModal } from "@/components/editor/modals/LinkModal";
import { ReplacePdfModal } from "@/components/editor/modals/ReplacePdfModal";
import { SignInModal } from "@/components/editor/modals/SignInModal";
import { ResumeSectionBuilderModal } from "@/components/editor/ResumeSectionBuilderModal";
import { useEditorState } from "@/components/editor/useEditorState";
import { PdfDocContext, usePdfUpload } from "@/components/editor/usePdfDocument";
import { recordRecentDoc } from "@/lib/recent-docs";
import { saveDocumentState } from "@/lib/pdf-storage";
import { SaveDocumentModal } from "@/components/editor/modals/SaveDocumentModal";
import { LeaveEditorModal } from "@/components/editor/modals/LeaveEditorModal";
import { PlanSelectionModal } from "@/components/editor/modals/PlanSelectionModal";
import { PlanLimitModal } from "@/components/editor/modals/PlanLimitModal";
import { saveDocumentToCloud, canUserSaveDocument, getUserProfile, getCloudDocuments } from "@/lib/cloud-documents";
import { clearUploadedPdf } from "@/lib/pdf-store";
import { getDocumentPdfBytes } from "@/lib/pdf-download";
import { renderPageThumbnail } from "@/lib/pdf-operations";
import { useAuth } from "@/lib/auth-context";
import { auth } from "@/lib/firebase";
import type { PlanId } from "@/lib/pricing-plans";

export function EditorPage({ fileName }: { fileName?: string | undefined }) {
  const navigate = useNavigate();
  const editor = useEditorState(fileName);
  const { status, pdf, errorMessage, reload } = usePdfUpload(fileName);
  const setPdfPages = editor.setPdfPages;
  const setDocument = editor.setDocument;

  const { user, signInWithGoogle } = useAuth();

  // Modal visibility state
  const [replacePdfOpen, setReplacePdfOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [currentSavedDocId, setCurrentSavedDocId] = useState<string | undefined>();

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

  // Auto-link existing cloud document ID if document with same filename was already saved
  useEffect(() => {
    if (user && pdf?.fileName && !currentSavedDocId) {
      getCloudDocuments(user.uid)
        .then((docs) => {
          const match = docs.find((d) => d.name.toLowerCase() === pdf.fileName.toLowerCase());
          if (match) {
            setCurrentSavedDocId(match.id);
          }
        })
        .catch(() => {});
    }
  }, [user, pdf?.fileName, currentSavedDocId]);

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

  const lastSavedJsonRef = useRef<string>("");
  const documentRef = useRef(editor.document);
  documentRef.current = editor.document;
  const isSavingRef = useRef(isSaving);
  isSavingRef.current = isSaving;
  const currentSavedDocIdRef = useRef(currentSavedDocId);
  currentSavedDocIdRef.current = currentSavedDocId;

  // Initialize lastSavedJsonRef when document is first synced
  useEffect(() => {
    if (editor.document.pages.length > 0 && !lastSavedJsonRef.current) {
      lastSavedJsonRef.current = JSON.stringify(editor.document);
    }
  }, [editor.document]);

  // Periodic cloud auto-save every 2 minutes for authenticated users
  useEffect(() => {
    if (!user || status !== "ready") return;

    const interval = setInterval(async () => {
      if (isSavingRef.current) return;
      if (!documentRef.current || documentRef.current.pages.length === 0) return;

      const currentJson = JSON.stringify(documentRef.current);
      // Only auto-save if edits were made since last save
      if (lastSavedJsonRef.current && currentJson === lastSavedJsonRef.current) {
        return;
      }

      try {
        const profile = await getUserProfile(user.uid);
        const planId = profile?.planId || "free";
        const check = await canUserSaveDocument(
          user.uid,
          currentSavedDocIdRef.current,
          documentRef.current.fileName
        );
        if (!check.allowed) return;

        await executeSave(user.uid, planId, true);
      } catch (err) {
        console.warn("[auto-save] Background auto-save skipped:", err);
      }
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [user, status]);

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

  const executeSave = async (uid: string, planId: PlanId = "free", isAutoSave = false) => {
    setIsSaving(true);
    const toastId = !isAutoSave ? toast.loading("Saving document to cloud…") : undefined;
    try {
      const bytes = await getDocumentPdfBytes(documentRef.current);
      let thumbnailUrl: string | undefined;
      try {
        thumbnailUrl = await renderPageThumbnail(bytes, 1, 160);
      } catch {
        // Thumbnail generation is optional
      }

      const cloudDoc = await saveDocumentToCloud(uid, {
        name: documentRef.current.fileName || "Untitled.pdf",
        bytes,
        pageCount: documentRef.current.pages.length,
        editorState: documentRef.current,
        thumbnailUrl,
        existingId: currentSavedDocIdRef.current,
        planId,
        userEmail: user?.email ?? null,
        userDisplayName: user?.displayName ?? null,
      });

      setCurrentSavedDocId(cloudDoc.id);
      lastSavedJsonRef.current = JSON.stringify(documentRef.current);
      recordRecentDoc(documentRef.current.fileName || "Untitled.pdf", documentRef.current.pages.length);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 4000);
      if (toastId) {
        toast.success("Document saved successfully.", { id: toastId });
      } else {
        toast.success("Document auto-saved to cloud.", { duration: 3000 });
      }
      return cloudDoc;
    } catch (err: any) {
      console.error("[cloud-save] Failed to save document:", err);
      if (toastId) {
        toast.error(`Failed to save to cloud: ${err?.message || "Please check connection"}`, { id: toastId });
      }
      if (!isAutoSave) throw err;
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const proceedSaveWithLimitCheck = async (uid: string, planId: PlanId) => {
    try {
      const check = await canUserSaveDocument(uid, currentSavedDocId, editor.document.fileName);
      if (!check.allowed) {
        setLimitModalOpen(true);
        return;
      }
      await executeSave(uid, planId);
    } catch {
      // Toast already handled inside executeSave
    }
  };

  const handleConfirmLeave = () => {
    clearUploadedPdf();
    setLeaveModalOpen(false);
    navigate({ to: user ? "/dashboard" : "/" });
  };

  const handleSaveAndExit = async () => {
    try {
      if (user) {
        const profile = await getUserProfile(user.uid);
        const planId = profile?.planId || "free";
        const check = await canUserSaveDocument(user.uid, currentSavedDocId, editor.document.fileName);
        if (!check.allowed) {
          setLeaveModalOpen(false);
          setLimitModalOpen(true);
          return;
        }
        await executeSave(user.uid, planId);
      } else {
        // Guest user: safely preserve in local storage IndexedDB and recent docs
        if (documentRef.current) {
          await saveDocumentState(documentRef.current);
          recordRecentDoc(documentRef.current.fileName || "Untitled.pdf", documentRef.current.pages.length);
        }
        toast.success("Document saved locally.");
      }
      setLeaveModalOpen(false);
      navigate({ to: user ? "/dashboard" : "/" });
    } catch (err: any) {
      console.error("[save-and-exit] Failed to save and exit:", err);
    }
  };

  const handleSaveClick = async () => {
    if (!user) {
      setSaveModalOpen(true);
      return;
    }

    // Check if user already has an active plan selected
    const profile = await getUserProfile(user.uid);
    if (!profile || !profile.planId) {
      setPlanModalOpen(true);
      return;
    }

    await proceedSaveWithLimitCheck(user.uid, profile.planId);
  };

  const handleContinueWithGoogle = async () => {
    await signInWithGoogle();
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Could not retrieve authenticated user.");
    setSaveModalOpen(false);

    // After successful login: OPEN PLAN SELECTION SCREEN
    const profile = await getUserProfile(currentUser.uid);
    if (!profile || !profile.planId) {
      setPlanModalOpen(true);
    } else {
      await proceedSaveWithLimitCheck(currentUser.uid, profile.planId);
    }
  };

  const handleSelectFreePlan = async () => {
    setPlanModalOpen(false);
    const currentUser = user || (auth.currentUser ? { uid: auth.currentUser.uid } : null);
    if (!currentUser) {
      setSaveModalOpen(true);
      return;
    }
    await proceedSaveWithLimitCheck(currentUser.uid, "free");
  };

  // Only wait for initial synchronization when a document is first opened
  const [syncedFile, setSyncedFile] = useState<string | null>(null);

  useEffect(() => {
    if (pdf && editor.document.fileName === pdf.fileName && editor.document.pages.length > 0) {
      setSyncedFile(pdf.fileName);
    }
  }, [pdf, editor.document.fileName, editor.document.pages.length]);

  const documentIsSynced =
    pdf !== null &&
    (syncedFile === pdf.fileName ||
      (editor.document.fileName === pdf.fileName && editor.document.pages.length > 0)) &&
    editor.document.pages.every((p) => p.type === "pdf" || p.type === "blank");

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
          onSaveClick={handleSaveClick}
          onLeaveClick={() => setLeaveModalOpen(true)}
          isSaving={isSaving}
          isSaved={isSaved}
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
        <div className="flex min-h-[48px] h-auto shrink-0 items-center justify-between gap-1 border-t border-border bg-toolbar px-2 py-1 pb-safe lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs text-muted-foreground">
                <Files className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Pages</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-[280px] p-0">
              <SheetHeader className="border-b border-border p-3">
                <SheetTitle className="text-sm">Pages</SheetTitle>
              </SheetHeader>
              <div className="h-[calc(100%-3.25rem)]">
                <ThumbnailSidebar editor={editor} doc={pdf?.doc ?? null} />
              </div>
            </SheetContent>
          </Sheet>

          {/* Mobile Zoom Controls */}
          <div className="flex items-center gap-1 rounded-md border border-border/60 bg-background/50 px-1 py-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground"
              aria-label="Zoom out"
              onClick={editor.zoomOut}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="min-w-[36px] text-center text-[11px] font-medium tabular-nums text-foreground">
              {editor.zoom}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground"
              aria-label="Zoom in"
              onClick={editor.zoomIn}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <span className="text-[11px] tabular-nums text-muted-foreground">
            {editor.activePage}/{editor.document.pages.length}
          </span>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs text-muted-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Properties</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-[300px] p-0">
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

        {/* Save Document modal (Guest -> Google Sign In -> Save) */}
        <SaveDocumentModal
          open={saveModalOpen}
          onOpenChange={setSaveModalOpen}
          onContinueWithGoogle={handleContinueWithGoogle}
          isSaving={isSaving}
        />

        {/* Plan Selection modal */}
        <PlanSelectionModal
          open={planModalOpen}
          onOpenChange={setPlanModalOpen}
          onSelectFreePlan={handleSelectFreePlan}
          isSaving={isSaving}
        />

        {/* Free Plan 1-Document Limit modal */}
        <PlanLimitModal
          open={limitModalOpen}
          onOpenChange={setLimitModalOpen}
          onUpgradeClick={() => setPlanModalOpen(true)}
        />

        {/* Leave Editor Confirmation modal */}
        <LeaveEditorModal
          open={leaveModalOpen}
          onOpenChange={setLeaveModalOpen}
          onConfirmLeave={handleConfirmLeave}
          onSaveAndExit={handleSaveAndExit}
          isSaving={isSaving}
        />

        {/* Resume & Document Section Builder Modal */}
        <ResumeSectionBuilderModal
          open={editor.modal === "section-builder"}
          onOpenChange={(open) => {
            if (!open) editor.setModal(null);
          }}
          editor={editor}
        />

        {/* Floating Mouse Cursor Handler for placing text / presets */}
        <EditorCursorFollower editor={editor} />
      </div>
    </PdfDocContext.Provider>
  );
}
