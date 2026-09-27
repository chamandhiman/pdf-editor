import { useEffect, useRef, useState } from "react";
import { Copy, MoreVertical, RotateCcw, RotateCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { PDFPage } from "@/types/pdf";
import type { PdfDocumentProxy } from "@/lib/pdf-loader";
import { usePdfDoc } from "./usePdfDocument";

// In-memory cache for rendered thumbnails to enable instant re-display on tab switch
const thumbnailCache = new Map<string, string>();
let activeDocId: string | null = null;

export function clearThumbnailCache() {
  thumbnailCache.clear();
  activeDocId = null;
}

export function ThumbnailItem({
  page,
  doc: propDoc,
  active,
  isDragging,
  dropPosition,
  onSelect,
  onRotate,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: {
  page: PDFPage;
  doc?: PdfDocumentProxy | null;
  active: boolean;
  isDragging?: boolean;
  dropPosition?: "before" | "after" | null;
  onSelect: () => void;
  onRotate: (delta: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}) {
  const contextDoc = usePdfDoc();
  const doc = propDoc !== undefined ? propDoc : contextDoc;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Check document identity to clean up old canvases/cache if PDF was replaced
  const docFingerprint = doc ? (doc.fingerprint || (doc as unknown as { _fingerprint?: string })._fingerprint || "doc") : null;
  if (docFingerprint && activeDocId && docFingerprint !== activeDocId) {
    thumbnailCache.clear();
  }
  if (docFingerprint) {
    activeDocId = docFingerprint;
  }

  // Preserve page aspect ratio (accounting for rotation)
  const isRotated = (page.rotation || 0) % 180 !== 0;
  const rawW = isRotated ? (page.height || 595) : (page.width || 595);
  const rawH = isRotated ? (page.width || 842) : (page.height || 842);
  const aspectRatio = `${rawW} / ${rawH}`;

  const isBlank = page.type === "blank";
  const targetPageNumber = page.originalPageNumber ?? (page.index + 1);

  const cacheKey = doc && docFingerprint && !isBlank
    ? `${docFingerprint}_${page.id}_${targetPageNumber}_${page.rotation || 0}`
    : null;

  const cachedUrl = cacheKey ? thumbnailCache.get(cacheKey) : null;
  const [previewUrl, setPreviewUrl] = useState<string | null>(cachedUrl ?? null);
  const [rendering, setRendering] = useState<boolean>(!cachedUrl && !isBlank);

  useEffect(() => {
    // 1. If blank page, no PDF.js render needed
    if (isBlank) {
      setPreviewUrl(null);
      setRendering(false);
      return;
    }

    // 2. If already cached for this page & rotation, use immediately
    if (cacheKey && thumbnailCache.has(cacheKey)) {
      setPreviewUrl(thumbnailCache.get(cacheKey)!);
      setRendering(false);
      return;
    }

    // 3. If no document or target page is beyond the PDF
    if (!doc || targetPageNumber > doc.numPages) {
      setPreviewUrl(null);
      setRendering(false);
      return;
    }

    let cancelled = false;
    let renderTask: { promise: Promise<unknown>; cancel?: () => void } | null = null;
    setRendering(true);

    const renderThumbnail = async () => {
      try {
        const pdfPage = await doc.getPage(targetPageNumber);
        if (cancelled) return;

        // Proportional scale to fit thumbnail box crisply (approx 180-200px width)
        const unscaledVp = pdfPage.getViewport({ scale: 1, rotation: page.rotation || 0 });
        const targetWidth = Math.max(160, Math.round(96 * (typeof window !== "undefined" ? window.devicePixelRatio || 2 : 2)));
        const scale = targetWidth / unscaledVp.width;
        const viewport = pdfPage.getViewport({ scale, rotation: page.rotation || 0 });

        const canvas = canvasRef.current || document.createElement("canvas");
        const w = Math.floor(viewport.width);
        const h = Math.floor(viewport.height);
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx || cancelled) return;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);

        renderTask = pdfPage.render({
          canvasContext: ctx,
          viewport,
          background: "rgb(255,255,255)",
        });

        // Wait for PDF.js page rendering to complete before marking as loaded
        await renderTask.promise;
        if (cancelled) return;

        let url = "";
        try {
          url = canvas.toDataURL("image/webp", 0.85);
          if (!url.startsWith("data:image/webp")) {
            url = canvas.toDataURL("image/jpeg", 0.85);
          }
        } catch {
          url = canvas.toDataURL("image/jpeg", 0.85);
        }

        if (!cancelled && url) {
          if (cacheKey) {
            thumbnailCache.set(cacheKey, url);
          }
          setPreviewUrl(url);
          setRendering(false);
        }
      } catch (err: unknown) {
        const error = err as { name?: string };
        if (error?.name === "RenderingCancelledException" || cancelled) {
          return;
        }
        console.error(`[Thumbnail] Page ${page.index + 1} render failed:`, err);
        if (!cancelled) {
          setRendering(false);
        }
      }
    };

    renderThumbnail();

    return () => {
      cancelled = true;
      if (renderTask && typeof renderTask.cancel === "function") {
        try {
          renderTask.cancel();
        } catch {
          // ignore cancellation errors
        }
      }
    };
  }, [doc, page.id, page.index, page.rotation, targetPageNumber, isBlank, cacheKey]);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative select-none cursor-grab active:cursor-grabbing transition-all duration-150",
        isDragging && "opacity-35 scale-95"
      )}
    >
      {/* Drop position indicator */}
      {dropPosition === "before" && (
        <div className="pointer-events-none absolute -left-2 top-0 bottom-0 z-50 flex items-center justify-center">
          <div className="h-full w-1 rounded-full bg-brand shadow-md" />
          <div className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-brand border-2 border-background shadow-md" />
        </div>
      )}
      {dropPosition === "after" && (
        <div className="pointer-events-none absolute -right-2 top-0 bottom-0 z-50 flex items-center justify-center">
          <div className="h-full w-1 rounded-full bg-brand shadow-md" />
          <div className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-brand border-2 border-background shadow-md" />
        </div>
      )}

      <button
        type="button"
        onClick={onSelect}
        aria-current={active}
        aria-label={`Go to page ${page.index + 1}`}
        className={cn(
          "block w-full rounded-md border bg-page p-0 text-left shadow-panel transition-all",
          "border-border hover:border-brand/50 hover:shadow-md",
          active && "border-brand ring-2 ring-brand/25",
        )}
      >
        <div className="w-full p-2 flex items-center justify-center bg-muted/20 rounded-[5px]">
          <div
            className="relative w-full overflow-hidden rounded-[3px] bg-white shadow-xs border border-border/40 flex items-center justify-center"
            style={{ aspectRatio }}
          >
            {/* Actual rendered PDF page preview */}
            {previewUrl && (
              <img
                src={previewUrl}
                alt={`Page ${page.index + 1}`}
                className={cn(
                  "h-full w-full object-contain block select-none pointer-events-none transition-opacity duration-150",
                  rendering ? "opacity-0" : "opacity-100",
                )}
                draggable={false}
              />
            )}

            {/* Offscreen / internal canvas for rendering */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Skeleton shown ONLY while this specific thumbnail is actually rendering */}
            {rendering && (
              <div className="absolute inset-0 flex flex-col justify-between p-2.5 bg-white animate-pulse">
                <div className="h-1.5 w-3/5 rounded-xs bg-muted-foreground/20" />
                <div className="flex flex-col gap-1.5 my-auto">
                  <div className="h-1 w-full rounded-xs bg-muted-foreground/15" />
                  <div className="h-1 w-5/6 rounded-xs bg-muted-foreground/15" />
                  <div className="h-1 w-4/5 rounded-xs bg-muted-foreground/15" />
                  <div className="h-1 w-full rounded-xs bg-muted-foreground/15" />
                  <div className="h-1 w-3/4 rounded-xs bg-muted-foreground/15" />
                </div>
                <div className="h-1 w-2/5 rounded-xs bg-muted-foreground/15" />
              </div>
            )}

            {/* Clean empty surface for newly added blank pages */}
            {isBlank && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-2">
                <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider select-none">
                  Blank
                </span>
                {page.objects.length > 0 && (
                  <span className="text-[9px] font-medium text-brand/80 mt-1 select-none bg-brand/10 px-1.5 py-0.5 rounded">
                    {page.objects.length} item{page.objects.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </button>

      <div
        className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 z-10"
        onPointerDown={(e) => e.stopPropagation()}
        draggable={false}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              aria-label={`Page ${page.index + 1} options`}
              className="h-6 w-6 border border-border bg-background/95 shadow-sm"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={() => onRotate(90)}>
              <RotateCw className="mr-2 h-4 w-4" /> Rotate Clockwise
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onRotate(-90)}>
              <RotateCcw className="mr-2 h-4 w-4" /> Rotate Counter-clockwise
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onDuplicate}>
              <Copy className="mr-2 h-4 w-4" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p
        className={cn(
          "mt-1.5 text-center text-[11px] tabular-nums text-muted-foreground",
          active && "font-medium text-foreground",
        )}
      >
        {page.index + 1}
      </p>
    </div>
  );
}
