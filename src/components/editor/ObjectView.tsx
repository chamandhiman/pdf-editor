import { useEffect, useRef, useState } from "react";
import {
  Copy,
  Crop,
  ImagePlus,
  Maximize2,
  Move,
  PenLine,
  RotateCw,
  Trash2,
  X,
  Layers,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { PDFObject } from "@/types/pdf";
import type { EditorState } from "./useEditorState";

interface Props {
  object: PDFObject;
  editor: EditorState;
  scale: number;
  interactive: boolean;
}

type DragMode = "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w" | null;

export function ObjectView({ object, editor, scale, interactive }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = editor.selectedId === object.id;
  const editing = editor.editingId === object.id;
  const [isDragging, setIsDragging] = useState(false);
  const [rotatingAngle, setRotatingAngle] = useState<number | null>(null);
  const isLineLike = object.type === "shape" && (object.shape?.kind === "line" || object.shape?.kind === "arrow");

  const startRotate = (e: React.PointerEvent) => {
    if (!interactive || e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    if (editor.tool !== "select") {
      editor.setTool("select");
    }
    if (editor.selectedId !== object.id) {
      editor.setSelectedId(object.id);
    }

    const hostEl = containerRef.current;
    if (!hostEl) return;
    const rect = hostEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const initialRotation = object.rotation || 0;
    setRotatingAngle(initialRotation);
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);

    let hasRotated = false;
    let finalRotation = initialRotation;

    const onPointerMove = (ev: PointerEvent) => {
      ev.preventDefault();
      hasRotated = true;
      const currentAngle = Math.atan2(ev.clientY - centerY, ev.clientX - centerX) * (180 / Math.PI);
      let diff = currentAngle - startAngle;
      let newAngle = Math.round((initialRotation + diff) % 360);
      if (newAngle < 0) newAngle += 360;

      const snapThreshold = ev.shiftKey ? 12 : 5;
      const snapPoints = [0, 45, 90, 135, 180, 225, 270, 315, 360];
      for (const sp of snapPoints) {
        if (Math.abs(newAngle - sp) <= snapThreshold) {
          newAngle = sp === 360 ? 0 : sp;
          break;
        }
      }

      finalRotation = newAngle;
      setRotatingAngle(newAngle);
      editor.updateObject(object.id, { rotation: newAngle }, false);
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      setRotatingAngle(null);
      if (hasRotated) {
        editor.updateObject(object.id, { rotation: finalRotation }, true);
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  const startDrag = (mode: DragMode) => (e: React.PointerEvent) => {
    if (!interactive || e.button !== 0) return;
    e.stopPropagation();

    if (editor.tool !== "select") {
      editor.setTool("select");
    }

    const wasSelected = editor.selectedId === object.id;
    if (!wasSelected) {
      editor.setSelectedId(object.id);
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const origBox = { x: object.x, y: object.y, width: object.width, height: object.height };
    let hasMoved = false;
    let currentX = object.x;
    let currentY = object.y;
    let currentW = object.width;
    let currentH = object.height;

    const currentScale = scale > 0 ? scale : 1;

    const onPointerMove = (ev: PointerEvent) => {
      ev.preventDefault();
      const dx = (ev.clientX - startX) / currentScale;
      const dy = (ev.clientY - startY) / currentScale;

      if (!hasMoved && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
        hasMoved = true;
        setIsDragging(true);
        if (editor.editingId === object.id) {
          editor.setEditingId(null);
        }
      }

      if (!hasMoved) return;

      if (mode === "move") {
        currentX = Math.round(origBox.x + dx);
        currentY = Math.round(origBox.y + dy);
        editor.updateObject(
          object.id,
          { x: currentX, y: currentY, width: origBox.width, height: origBox.height },
          false,
        );
      } else if (mode === "se" || mode === "ne" || mode === "e") {
        currentW = Math.max(20, Math.round(origBox.width + dx));
        if (isLineLike) {
          editor.updateObject(object.id, { width: currentW }, false);
        } else if (mode === "ne") {
          currentY = Math.round(origBox.y + dy);
          currentH = Math.max(20, Math.round(origBox.height - dy));
          editor.updateObject(object.id, { y: currentY, width: currentW, height: currentH }, false);
        } else if (mode === "se") {
          currentH = Math.max(20, Math.round(origBox.height + dy));
          editor.updateObject(object.id, { width: currentW, height: currentH }, false);
        } else {
          editor.updateObject(object.id, { width: currentW }, false);
        }
      } else if (mode === "sw" || mode === "nw" || mode === "w") {
        currentX = Math.round(origBox.x + dx);
        currentW = Math.max(20, Math.round(origBox.width - dx));
        if (isLineLike) {
          editor.updateObject(object.id, { x: currentX, width: currentW }, false);
        } else if (mode === "nw") {
          currentY = Math.round(origBox.y + dy);
          currentH = Math.max(20, Math.round(origBox.height - dy));
          editor.updateObject(
            object.id,
            { x: currentX, y: currentY, width: currentW, height: currentH },
            false,
          );
        } else if (mode === "sw") {
          currentH = Math.max(20, Math.round(origBox.height + dy));
          editor.updateObject(object.id, { x: currentX, width: currentW, height: currentH }, false);
        } else {
          editor.updateObject(object.id, { x: currentX, width: currentW }, false);
        }
      } else if (mode === "s") {
        if (!isLineLike) {
          currentH = Math.max(20, Math.round(origBox.height + dy));
          editor.updateObject(object.id, { height: currentH }, false);
        }
      } else if (mode === "n") {
        if (!isLineLike) {
          currentY = Math.round(origBox.y + dy);
          currentH = Math.max(20, Math.round(origBox.height - dy));
          editor.updateObject(object.id, { y: currentY, height: currentH }, false);
        }
      }
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      setIsDragging(false);

      if (hasMoved) {
        editor.updateObject(
          object.id,
          { x: currentX, y: currentY, width: currentW, height: currentH },
          true,
        );
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  return (
    <div
      ref={containerRef}
      role="button"
      tabIndex={-1}
      onPointerDown={startDrag("move")}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (object.type === "text" || object.type === "note") {
          editor.setEditingId(object.id);
        }
      }}
      className={cn(
        "group absolute touch-none select-none",
        interactive
          ? (isDragging ? "cursor-grabbing" : selected ? "cursor-move" : "cursor-pointer")
          : "pointer-events-none",
        selected && "z-20",
      )}
      style={{
        left: object.x,
        top: object.y,
        width: object.width,
        height: object.height,
        opacity: object.opacity / 100,
        transform: object.rotation ? `rotate(${object.rotation}deg)` : undefined,
      }}
    >
      {/* Visual Bounding Box when selected */}
      {selected && (
        <div
          className="pointer-events-none absolute -inset-[2px] rounded-[3px] border-2 border-brand/90 ring-1 ring-background/60 shadow-sm"
          style={{ zIndex: 10 }}
        />
      )}

      {/* Object content */}
      <ObjectContent object={object} editor={editor} editing={editing} />

      {/* Resize handles & contextual action toolbar */}
      {selected && interactive && (
        <>
          {/* Live Rotation Angle Badge */}
          {rotatingAngle !== null && (
            <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 rounded-full bg-foreground px-2.5 py-1 text-xs font-semibold text-background shadow-xl animate-in fade-in zoom-in-95 duration-100">
              <RotateCw className="h-3 w-3" />
              <span>{rotatingAngle}°</span>
            </div>
          )}

          {/* Top Rotation Handle */}
          <div
            onPointerDown={startRotate}
            title="Drag to rotate (Hold Shift to snap to 45°/90°)"
            className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center cursor-grab active:cursor-grabbing group/rot select-none"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-brand bg-background shadow-md transition-all group-hover/rot:scale-125 group-hover/rot:bg-brand group-hover/rot:text-brand-foreground">
              <RotateCw className="h-2.5 w-2.5 text-brand group-hover/rot:text-brand-foreground transition-colors" />
            </div>
            <div className="h-2 w-[1.5px] bg-brand/80" />
          </div>

          {/* Custom Rotate Handles on all 4 corners */}
          {(
            [
              { id: "nw-rot", pos: "-top-6 -left-6", title: "Rotate top-left (Hold Shift to snap)" },
              { id: "ne-rot", pos: "-top-6 -right-6", title: "Rotate top-right (Hold Shift to snap)" },
              { id: "sw-rot", pos: "-bottom-6 -left-6", title: "Rotate bottom-left (Hold Shift to snap)" },
              { id: "se-rot", pos: "-bottom-6 -right-6", title: "Rotate bottom-right (Hold Shift to snap)" },
            ] as const
          ).map((rot) => (
            <div
              key={rot.id}
              onPointerDown={startRotate}
              title={rot.title}
              className={cn(
                "group/rotcorner absolute z-30 flex h-8 w-8 items-center justify-center select-none cursor-grab active:cursor-grabbing",
                rot.pos,
              )}
              style={{
                cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%232f5bd1' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8'/%3E%3Cpolyline points='21 3 21 8 16 8'/%3E%3C/svg%3E") 12 12, grab`,
              }}
            >
              {/* Custom Rotate Icon badge visible when moving near corner */}
              <div className="flex h-5 w-5 items-center justify-center rounded-full border border-brand/90 bg-background text-brand shadow-md transition-all duration-150 opacity-0 group-hover/rotcorner:opacity-100 group-hover/rotcorner:scale-125 hover:bg-brand hover:text-white">
                <RotateCw className="h-2.5 w-2.5 transition-transform" />
              </div>
            </div>
          ))}

          {/* Corner Resize Handles on all 4 corners */}
          {(
            [
              { id: "nw", cursor: "cursor-nwse-resize", pos: "-left-2 -top-2" },
              { id: "ne", cursor: "cursor-nesw-resize", pos: "-right-2 -top-2" },
              { id: "sw", cursor: "cursor-nesw-resize", pos: "-left-2 -bottom-2" },
              { id: "se", cursor: "cursor-nwse-resize", pos: "-right-2 -bottom-2" },
            ] as const
          ).map((c) => (
            <div
              key={c.id}
              onPointerDown={startDrag(c.id)}
              title="Drag to resize"
              className={cn(
                "group/corner absolute z-40 flex items-center justify-center select-none p-1",
                c.cursor,
                c.pos,
              )}
            >
              <span className="flex h-3 w-3 items-center justify-center rounded-[3px] border-2 border-brand bg-background shadow-md transition-all duration-150 group-hover/corner:scale-125 group-hover/corner:bg-brand group-hover/corner:ring-2 group-hover/corner:ring-brand/30" />
            </div>
          ))}

          {/* Edge Resize Handles */}
          {(
            [
              { id: "n", cursor: "cursor-ns-resize", pos: "left-1/2 -top-1.5 -translate-x-1/2 w-4 h-2" },
              { id: "s", cursor: "cursor-ns-resize", pos: "left-1/2 -bottom-1.5 -translate-x-1/2 w-4 h-2" },
              { id: "w", cursor: "cursor-ew-resize", pos: "top-1/2 -left-1.5 -translate-y-1/2 w-2 h-4" },
              { id: "e", cursor: "cursor-ew-resize", pos: "top-1/2 -right-1.5 -translate-y-1/2 w-2 h-4" },
            ] as const
          ).map((edge) => (
            <div
              key={edge.id}
              onPointerDown={startDrag(edge.id)}
              title="Drag to resize"
              className={cn(
                "absolute z-30 flex items-center justify-center select-none",
                edge.cursor,
                edge.pos,
              )}
            >
              <span className="h-full w-full rounded-full border border-brand/80 bg-background shadow-sm hover:bg-brand transition-colors" />
            </div>
          ))}

          {/* Contextual Action Toolbar */}
          <div
            className="absolute -top-8 right-0 z-30 flex items-center gap-0.5 rounded-md border border-border bg-background/95 p-0.5 shadow-md backdrop-blur-sm select-none"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Line-specific quick actions: 100% Width & Rotate */}
            {object.shape?.kind === "line" && (
              <>
                <button
                  type="button"
                  aria-label="100% full width"
                  title="Make line 100% full width"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    const page = editor.document.pages.find((p) => p.id === object.pageId);
                    const pw = page?.width ?? 794;
                    editor.updateObject(object.id, { x: 0, width: pw });
                  }}
                  className="flex h-6 items-center gap-1 rounded px-1.5 text-[11px] font-semibold text-brand bg-brand/10 hover:bg-brand/20 transition-colors"
                >
                  <Maximize2 className="h-3 w-3" />
                  <span>100% Width</span>
                </button>
                <button
                  type="button"
                  aria-label="Rotate 90 degrees"
                  title="Rotate 90°"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    editor.updateObject(object.id, {
                      rotation: ((object.rotation || 0) + 90) % 360,
                    });
                  }}
                  className="flex h-6 items-center gap-1 rounded px-1.5 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <RotateCw className="h-3 w-3" />
                  <span>Rotate</span>
                </button>
              </>
            )}
            {(object.type === "text" || object.type === "note") && !editing && (
              <button
                type="button"
                aria-label="Edit text"
                title="Edit text"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  editor.setEditingId(object.id);
                }}
                className="flex h-6 items-center gap-1 rounded px-1.5 text-[11px] font-medium text-foreground bg-accent/70 hover:bg-accent transition-colors"
              >
                <PenLine className="h-3 w-3 text-brand" />
                <span>Edit</span>
              </button>
            )}

            {/* Image-specific quick actions: Crop & Replace */}
            {object.type === "image" && (
              <>
                <button
                  type="button"
                  aria-label="Crop image"
                  title="Crop image"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    editor.setSelectedId(object.id);
                    editor.setModal("crop");
                  }}
                  className="flex h-6 items-center gap-1 rounded px-2 text-[11px] font-semibold text-brand bg-brand/10 hover:bg-brand/20 transition-colors"
                >
                  <Crop className="h-3 w-3" />
                  <span>Crop</span>
                </button>
                <button
                  type="button"
                  aria-label="Replace image"
                  title="Replace image"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    editor.setSelectedId(object.id);
                    editor.setModal("image");
                  }}
                  className="flex h-6 items-center gap-1 rounded px-1.5 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <ImagePlus className="h-3 w-3" />
                  <span>Replace</span>
                </button>
              </>
            )}

            <button
              type="button"
              aria-label="Move object"
              title="Drag to move anywhere"
              onPointerDown={startDrag("move")}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-move"
            >
              <Move className="h-3.5 w-3.5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Layer order"
                  title="Layer order"
                  onPointerDown={(e) => e.stopPropagation()}
                  className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Layers className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 z-50" onPointerDown={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    editor.bringToFront(object.id);
                  }}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <ChevronsUp className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Bring to Front ↑</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    editor.bringForward(object.id);
                  }}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Bring Forward ↑</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    editor.sendBackward(object.id);
                  }}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Send Backward ↓</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    editor.sendToBack(object.id);
                  }}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <ChevronsDown className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Send to Back ↓</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              type="button"
              aria-label="Duplicate object"
              title="Duplicate"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                editor.duplicateObject(object.id);
              }}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Delete object"
              title="Delete"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                editor.deleteObject(object.id);
              }}
              className="flex h-6 w-6 items-center justify-center rounded text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ObjectContent({
  object,
  editor,
  editing,
}: {
  object: PDFObject;
  editor: EditorState;
  editing: boolean;
}) {
  switch (object.type) {
    case "text":
      return <TextContent object={object} editor={editor} editing={editing} />;
    case "highlight":
      return (
        <div
          className="h-full w-full rounded-[2px]"
          style={{ background: object.highlight?.color ?? "#ffd84d" }}
        />
      );
    case "image":
      return (
        <img
          src={object.image?.src}
          alt={object.image?.alt ?? "Placed image"}
          draggable={false}
          className="h-full w-full select-none object-contain pointer-events-none"
        />
      );
    case "signature":
      return object.signature?.src ? (
        <img
          src={object.signature.src}
          alt="Signature"
          draggable={false}
          className="h-full w-full select-none object-contain"
        />
      ) : (
        <div
          className="flex h-full w-full items-end justify-center pb-1 text-[34px] leading-none text-[#14213d]"
          style={{ fontFamily: object.signature?.font }}
        >
          {object.signature?.name}
        </div>
      );
    case "drawing":
      return (
        <svg viewBox={`0 0 ${object.width} ${object.height}`} className="h-full w-full">
          {object.drawing?.paths.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={object.drawing?.stroke}
              strokeWidth={object.drawing?.thickness}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>
      );
    case "shape":
      return <ShapeContent object={object} />;
    case "stamp":
      return (
        <div
          className="flex h-full w-full items-center justify-center rounded-[4px] border-[3px] font-sans text-[22px] font-black uppercase tracking-[0.14em]"
          style={{ borderColor: object.stamp?.color, color: object.stamp?.color }}
        >
          {object.stamp?.label}
        </div>
      );
    case "link":
      return (
        <div className="flex h-full w-full items-center rounded-[3px] border border-dashed border-brand bg-brand/5 px-2 text-[12px] text-brand">
          <span className="truncate underline">{object.link?.url}</span>
        </div>
      );
    case "note":
      return <NoteContent object={object} editor={editor} editing={editing} />;
    default:
      return null;
  }
}

function ShapeContent({ object }: { object: PDFObject }) {
  const s = object.shape!;
  const w = object.width;
  const h = object.height;
  const midY = Math.round(h / 2);
  const common = {
    stroke: s.stroke,
    strokeWidth: s.thickness,
    fill: s.fill === "transparent" ? "none" : s.fill,
    strokeLinecap: "round" as const,
  };
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full overflow-visible">
      {s.kind === "line" && <line x1={0} y1={midY} x2={w} y2={midY} {...common} />}
      {s.kind === "arrow" && (
        <>
          <defs>
            <marker
              id={`ah-${object.id}`}
              markerWidth={Math.max(6, s.thickness * 2)}
              markerHeight={Math.max(6, s.thickness * 2)}
              refX={Math.max(5, s.thickness * 1.8)}
              refY={Math.max(3, s.thickness)}
              orient="auto"
            >
              <path
                d={`M0,0 L${Math.max(6, s.thickness * 2)},${Math.max(3, s.thickness)} L0,${Math.max(6, s.thickness * 2)} z`}
                fill={s.stroke}
              />
            </marker>
          </defs>
          <line
            x1={0}
            y1={midY}
            x2={Math.max(0, w - Math.max(6, s.thickness * 2))}
            y2={midY}
            {...common}
            markerEnd={`url(#ah-${object.id})`}
          />
        </>
      )}
      {s.kind === "rectangle" && (
        <rect x={2} y={2} width={Math.max(1, w - 4)} height={Math.max(1, h - 4)} rx={3} {...common} />
      )}
      {s.kind === "circle" && (
        <ellipse cx={w / 2} cy={h / 2} rx={Math.max(1, w / 2 - 2)} ry={Math.max(1, h / 2 - 2)} {...common} />
      )}
      {s.kind === "polygon" && (
        <polygon
          points={`${w / 2},2 ${w - 2},${h * 0.38} ${w * 0.8},${h - 2} ${w * 0.2},${h - 2} 2,${h * 0.38}`}
          {...common}
        />
      )}
    </svg>
  );
}

function TextContent({
  object,
  editor,
  editing,
}: {
  object: PDFObject;
  editor: EditorState;
  editing: boolean;
}) {
  const t = object.text!;

  if (t.listType && t.listType !== "none") {
    return <ListTextContent object={object} editor={editor} editing={editing} />;
  }

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editing]);

  return (
    <div
      ref={ref}
      contentEditable={editing}
      suppressContentEditableWarning
      onPointerDown={(e) => {
        if (editing) {
          e.stopPropagation();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          editor.setEditingId(null);
        }
      }}
      onBlur={(e) => {
        editor.setEditingId(null);
        const value = e.currentTarget.textContent ?? "";
        if (value !== t.value) editor.updateObjectText(object.id, { value });
      }}
      className={cn(
        "h-full w-full whitespace-pre-wrap break-words px-1 outline-none",
        editing ? "cursor-text select-text pointer-events-auto" : "select-none pointer-events-none",
      )}
      style={{
        fontFamily: t.fontFamily,
        fontSize: t.fontSize,
        fontWeight: t.bold ? 700 : 400,
        fontStyle: t.italic ? "italic" : "normal",
        textDecoration: t.underline ? "underline" : "none",
        color: t.color,
        textAlign: t.align,
        lineHeight: 1.35,
      }}
    >
      {t.value}
    </div>
  );
}

function ListTextContent({
  object,
  editor,
  editing,
}: {
  object: PDFObject;
  editor: EditorState;
  editing: boolean;
}) {
  const t = object.text!;
  const listType = t.listType ?? "bullet";

  // Sanitize any existing bullet/number glyphs from user text so markers are purely visual and decoupled
  const cleanLines = (t.value || "").split("\n").map((line) =>
    line
      .replace(/^[\u2022\u2023\u2043\u25CF\u25AA\u25E6\u2219\u00B7\u25AB\u25B8\u25B9\u2192\u27A4\u2714\u2013\u2014\u2010\u00BB\*\-]\s*/, "")
      .replace(/^\d+[\.\)]\s*/, "")
  );

  const getMarker = (index: number) => {
    if (listType === "bullet") return "•";
    if (listType === "numbered") return `${index + 1}.`;
    if (listType === "check") return "☐";
    return "";
  };

  const handleLineBlur = (lineIndex: number, newText: string) => {
    const updated = [...cleanLines];
    updated[lineIndex] = newText
      .replace(/^[\u2022\u2023\u2043\u25CF\u25AA\u25E6\u2219\u00B7\u25AB\u25B8\u25B9\u2192\u27A4\u2714\u2013\u2014\u2010\u00BB\*\-]\s*/, "")
      .replace(/^\d+[\.\)]\s*/, "");
    const newValue = updated.join("\n");
    if (newValue !== t.value) {
      editor.updateObjectText(object.id, { value: newValue });
    }
  };

  return (
    <div
      className={cn(
        "h-full w-full px-1 outline-none flex flex-col justify-start gap-1 select-none",
        editing ? "cursor-text select-text pointer-events-auto" : "pointer-events-none"
      )}
      style={{
        fontFamily: t.fontFamily,
        fontSize: t.fontSize,
        fontWeight: t.bold ? 700 : 400,
        fontStyle: t.italic ? "italic" : "normal",
        textDecoration: t.underline ? "underline" : "none",
        color: t.color,
        textAlign: t.align,
        lineHeight: 1.35,
      }}
    >
      {cleanLines.map((line, idx) => (
        <div key={idx} className="flex items-start gap-2">
          {/* List marker: 100% separate from text content, never editable, never replaces user text */}
          <span
            contentEditable={false}
            className="select-none pointer-events-none shrink-0 font-sans"
            style={{
              userSelect: "none",
              minWidth: listType === "numbered" ? "1.4em" : "1em",
              textAlign: listType === "numbered" ? "right" : "center",
              display: "inline-block",
            }}
          >
            {getMarker(idx)}
          </span>
          {/* User text: editing updates only this line's text */}
          <span
            contentEditable={editing}
            suppressContentEditableWarning
            onPointerDown={(e) => {
              if (editing) e.stopPropagation();
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                editor.setEditingId(null);
              } else if (e.key === "Enter") {
                e.preventDefault();
                const updated = [...cleanLines];
                updated.splice(idx + 1, 0, "New item");
                editor.updateObjectText(object.id, { value: updated.join("\n") });
              }
            }}
            onBlur={(e) => {
              handleLineBlur(idx, e.currentTarget.textContent ?? "");
            }}
            className={cn(
              "outline-none flex-1 whitespace-pre-wrap break-words",
              editing ? "cursor-text select-text pointer-events-auto" : "select-none"
            )}
          >
            {line}
          </span>
        </div>
      ))}
    </div>
  );
}

function NoteContent({
  object,
  editor,
  editing,
}: {
  object: PDFObject;
  editor: EditorState;
  editing: boolean;
}) {
  const [draft, setDraft] = useState(object.note?.body ?? "");
  return (
    <div className="relative h-full w-full">
      <div className="flex h-full w-full items-center justify-center rounded-md bg-[#ffcd4d] text-[13px] font-semibold text-[#5a4300] shadow-sm">
        ●
      </div>
      {(editing || (editor.selectedId === object.id && object.note?.body)) && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute left-[34px] top-0 w-56 rounded-md border border-border bg-background p-2 shadow-panel"
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Note
            </span>
            <button
              type="button"
              aria-label="Close note"
              onClick={() => editor.setEditingId(null)}
              className="text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <textarea
            autoFocus={editing}
            value={draft}
            placeholder="Add a comment..."
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              editor.updateObject(object.id, {
                note: { body: draft, author: object.note?.author ?? "You" },
              });
              editor.setEditingId(null);
            }}
            className="h-20 w-full resize-none rounded-sm border border-input bg-background p-1.5 text-[12px] outline-none focus:border-brand"
          />
        </div>
      )}
    </div>
  );
}
