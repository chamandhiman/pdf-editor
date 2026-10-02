import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { PDFPage, ShapeKind } from "@/types/pdf";
import { FloatingTextToolbar } from "./FloatingTextToolbar";
import { ObjectView } from "./ObjectView";
import type { EditorState } from "./useEditorState";

const SHAPE_TOOLS: ShapeKind[] = ["line", "arrow", "rectangle", "circle", "polygon"];

interface Draft {
  kind: "rect" | "draw";
  x: number;
  y: number;
  w: number;
  h: number;
  points: { x: number; y: number }[];
}

export function PageLayer({
  page,
  editor,
  pageNumber,
}: {
  page: PDFPage;
  editor: EditorState;
  pageNumber: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const tool = editor.tool;
  const selectMode = tool === "select" || tool === "edit-text" || tool === "hand";

  // Support Delete and Backspace keyboard shortcuts for deleting selected object
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editor.tool === "add-text") {
        e.preventDefault();
        editor.setTool("select");
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && editor.selectedId && !editor.editingId) {
        const active = document.activeElement;
        const isEditingField =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          active?.getAttribute("contenteditable") === "true";
        if (!isEditingField) {
          e.preventDefault();
          editor.deleteObject(editor.selectedId);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor]);

  const scale = () => {
    const rect = ref.current?.getBoundingClientRect();
    return rect ? rect.width / page.width : 1;
  };

  const point = (e: React.PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    const s = rect.width / page.width;
    return { x: (e.clientX - rect.left) / s, y: (e.clientY - rect.top) / s };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    editor.setActivePage(pageNumber);
    const p = point(e);

    if (tool === "select") {
      if (e.target === e.currentTarget) editor.setSelectedId(null);
      return;
    }
    if (tool === "add-text") {
      const id = editor.addTextObject(pageNumber, Math.round(p.x), Math.round(p.y), editor.textPreset);
      editor.setTool("select");
      editor.setSelectedId(id);
      return;
    }
    if (tool === "image" && editor.pendingImage) {
      const id = editor.addImage(pageNumber, editor.pendingImage.src, editor.pendingImage.alt, {
        x: Math.max(0, Math.round(p.x - 130)),
        y: Math.max(0, Math.round(p.y - 85)),
      });
      editor.setPendingImage(null);
      editor.setTool("select");
      editor.setSelectedId(id);
      return;
    }
    if (tool === "note") {
      editor.addNote(pageNumber, p.x, p.y);
      editor.setTool("select");
      return;
    }
    if (tool === "draw") {
      (e.target as Element).setPointerCapture?.(e.pointerId);
      setDraft({ kind: "draw", x: 0, y: 0, w: 0, h: 0, points: [p] });
      return;
    }
    if (tool === "highlight" || SHAPE_TOOLS.includes(tool as ShapeKind)) {
      (e.target as Element).setPointerCapture?.(e.pointerId);
      setDraft({ kind: "rect", x: p.x, y: p.y, w: 0, h: 0, points: [] });
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draft) return;
    const p = point(e);
    if (draft.kind === "draw") setDraft({ ...draft, points: [...draft.points, p] });
    else setDraft({ ...draft, w: p.x - draft.x, h: p.y - draft.y });
  };

  const onPointerUp = () => {
    if (!draft) return;
    if (draft.kind === "draw") {
      const pts = draft.points;
      if (pts.length > 2) {
        const xs = pts.map((p) => p.x);
        const ys = pts.map((p) => p.y);
        const pad = editor.defaults.thickness + 4;
        const minX = Math.min(...xs) - pad;
        const minY = Math.min(...ys) - pad;
        const width = Math.max(...xs) - minX + pad;
        const height = Math.max(...ys) - minY + pad;
        const d = pts
          .map((p, i) => `${i === 0 ? "M" : "L"}${(p.x - minX).toFixed(1)},${(p.y - minY).toFixed(1)}`)
          .join(" ");
        editor.addDrawing(pageNumber, { x: minX, y: minY, width, height }, [d]);
      }
    } else {
      const rect = {
        x: draft.w < 0 ? draft.x + draft.w : draft.x,
        y: draft.h < 0 ? draft.y + draft.h : draft.y,
        width: Math.abs(draft.w),
        height: Math.abs(draft.h),
      };
      if (tool === "line") {
        const isDrag = Math.abs(draft.w) > 15;
        const shapeRect = isDrag
          ? {
              x: draft.w < 0 ? draft.x + draft.w : draft.x,
              y: Math.max(0, Math.round(draft.y - 10)),
              width: Math.max(30, Math.abs(draft.w)),
              height: 20,
            }
          : {
              x: 0,
              y: Math.max(0, Math.round(draft.y - 10)),
              width: page.width,
              height: 20,
            };
        const id = editor.addShape(pageNumber, "line", shapeRect);
        editor.setSelectedId(id);
      } else if (tool === "arrow") {
        const isDrag = Math.abs(draft.w) > 15;
        const shapeRect = isDrag
          ? {
              x: draft.w < 0 ? draft.x + draft.w : draft.x,
              y: Math.max(0, Math.round(draft.y - 10)),
              width: Math.max(40, Math.abs(draft.w)),
              height: 20,
            }
          : {
              x: Math.max(20, Math.round(draft.x - 120)),
              y: Math.max(0, Math.round(draft.y - 10)),
              width: 240,
              height: 20,
            };
        const id = editor.addShape(pageNumber, "arrow", shapeRect);
        editor.setSelectedId(id);
      } else if (rect.width > 8 && rect.height > 6) {
        if (tool === "highlight") editor.addHighlight(pageNumber, rect);
        else {
          const id = editor.addShape(pageNumber, tool as ShapeKind, rect);
          editor.setSelectedId(id);
        }
      } else if (SHAPE_TOOLS.includes(tool as ShapeKind)) {
        // Single click without drag: create shape at that exact click position
        const defaultW = 120;
        const defaultH = 80;
        const shapeRect = {
          x: Math.max(0, Math.round(draft.x - defaultW / 2)),
          y: Math.max(0, Math.round(draft.y - defaultH / 2)),
          width: defaultW,
          height: defaultH,
        };
        const id = editor.addShape(pageNumber, tool as ShapeKind, shapeRect);
        editor.setSelectedId(id);
      }
    }
    setDraft(null);
    if (tool !== "draw" && tool !== "highlight") editor.setTool("select");
  };

  const selectedOnPage =
    editor.selected && page.objects.some((o) => o.id === editor.selected!.id)
      ? editor.selected
      : null;

  const onFileDrop = (e: React.DragEvent) => {
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    e.preventDefault();
    e.stopPropagation();
    editor.setActivePage(pageNumber);

    const rect = ref.current?.getBoundingClientRect();
    const s = rect ? rect.width / page.width : 1;
    const dropX = rect ? (e.clientX - rect.left) / s : 150;
    const dropY = rect ? (e.clientY - rect.top) / s : 250;

    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result);
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth || 400;
        let h = img.naturalHeight || 300;
        const maxW = 320;
        const maxH = 260;
        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const id = editor.addImage(
          pageNumber,
          src,
          file.name,
          {
            x: Math.max(0, Math.round(dropX - w / 2)),
            y: Math.max(0, Math.round(dropY - h / 2)),
          },
          { width: w, height: h },
        );
        editor.setSelectedId(id);
        editor.setTool("select");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setDraft(null)}
      className={cn(
        "absolute inset-0 z-20",
        selectMode ? "pointer-events-none" : "pointer-events-auto",
        tool === "draw" && "cursor-crosshair",
        tool === "highlight" && "cursor-cell",
        tool === "add-text" && "cursor-text",
        tool === "image" && editor.pendingImage && "cursor-crosshair",
        tool === "hand" && "cursor-grab",
      )}
    >
      <div
        className={cn(
          "absolute inset-0",
          (tool === "select" || tool === "edit-text") ? "pointer-events-auto" : "pointer-events-none",
        )}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
          }
        }}
        onDrop={onFileDrop}
        onPointerDown={(e) => {
          if ((tool === "select" || tool === "edit-text") && e.target === e.currentTarget) {
            editor.setSelectedId(null);
            editor.setEditingId(null);
          }
        }}
      >
        {page.objects.map((object) => (
          <ObjectView
            key={object.id}
            object={object}
            editor={editor}
            scale={scale()}
            interactive={tool === "select" || tool === "edit-text"}
          />
        ))}
        {selectedOnPage?.type === "text" && (
          <FloatingTextToolbar object={selectedOnPage} editor={editor} />
        )}
      </div>

      {draft && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${page.width} ${page.height}`}>
          {draft.kind === "rect" ? (
            tool === "line" || tool === "arrow" ? (
              <line
                x1={draft.x}
                y1={draft.y}
                x2={draft.x + draft.w}
                y2={draft.y}
                stroke={editor.defaults.stroke}
                strokeWidth={editor.defaults.thickness}
                strokeLinecap="round"
              />
            ) : (
              <rect
                x={draft.w < 0 ? draft.x + draft.w : draft.x}
                y={draft.h < 0 ? draft.y + draft.h : draft.y}
                width={Math.abs(draft.w)}
                height={Math.abs(draft.h)}
                fill={tool === "highlight" ? editor.defaults.highlightColor : "none"}
                fillOpacity={tool === "highlight" ? editor.defaults.highlightOpacity / 100 : 1}
                stroke={editor.defaults.stroke}
                strokeWidth={tool === "highlight" ? 1 : editor.defaults.thickness}
                strokeDasharray={tool === "highlight" ? "4 3" : undefined}
              />
            )
          ) : (
            <path
              d={draft.points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={editor.defaults.stroke}
              strokeWidth={editor.defaults.thickness}
              strokeLinecap="round"
            />
          )}
        </svg>
      )}
    </div>
  );
}
