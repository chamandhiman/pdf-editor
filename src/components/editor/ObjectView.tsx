import { useEffect, useRef, useState } from "react";
import { Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PDFObject } from "@/types/pdf";
import type { EditorState } from "./useEditorState";

interface Props {
  object: PDFObject;
  editor: EditorState;
  scale: number;
  interactive: boolean;
}

type DragMode = "move" | "nw" | "ne" | "sw" | "se" | null;

export function ObjectView({ object, editor, scale, interactive }: Props) {
  const selected = editor.selectedId === object.id;
  const editing = editor.editingId === object.id;
  const drag = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    box: { x: number; y: number; width: number; height: number };
  } | null>(null);

  const start = (mode: DragMode) => (e: React.PointerEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    editor.setSelectedId(object.id);
    drag.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      box: { x: object.x, y: object.y, width: object.width, height: object.height },
    };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.startX) / scale;
    const dy = (e.clientY - d.startY) / scale;
    const b = d.box;
    let next = { x: b.x, y: b.y, width: b.width, height: b.height };
    if (d.mode === "move") next = { ...next, x: b.x + dx, y: b.y + dy };
    if (d.mode === "se") next = { ...next, width: b.width + dx, height: b.height + dy };
    if (d.mode === "sw")
      next = { ...next, x: b.x + dx, width: b.width - dx, height: b.height + dy };
    if (d.mode === "ne")
      next = { ...next, y: b.y + dy, width: b.width + dx, height: b.height - dy };
    if (d.mode === "nw")
      next = { x: b.x + dx, y: b.y + dy, width: b.width - dx, height: b.height - dy };
    next.width = Math.max(24, next.width);
    next.height = Math.max(20, next.height);
    editor.updateObject(object.id, next, false);
  };

  const end = () => {
    if (!drag.current) return;
    const b = drag.current.box;
    drag.current = null;
    if (b.x !== object.x || b.y !== object.y || b.width !== object.width || b.height !== object.height) {
      // re-commit final position so it lands in history
      editor.updateObject(object.id, {
        x: object.x,
        y: object.y,
        width: object.width,
        height: object.height,
      });
    }
  };

  return (
    <div
      role="button"
      tabIndex={-1}
      onPointerDown={start("move")}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onDoubleClick={() => {
        if (object.type === "text" || object.type === "note") editor.setEditingId(object.id);
      }}
      className={cn(
        "group absolute",
        interactive ? "cursor-move" : "pointer-events-none",
        selected && "outline outline-2 outline-offset-1 outline-brand",
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
      <ObjectContent object={object} editor={editor} editing={editing} />

      {selected && interactive && (
        <>
          {(["nw", "ne", "sw", "se"] as const).map((corner) => (
            <span
              key={corner}
              onPointerDown={start(corner)}
              onPointerMove={move}
              onPointerUp={end}
              className={cn(
                "absolute h-2.5 w-2.5 rounded-[2px] border border-brand bg-background",
                corner === "nw" && "-left-1.5 -top-1.5 cursor-nwse-resize",
                corner === "ne" && "-right-1.5 -top-1.5 cursor-nesw-resize",
                corner === "sw" && "-bottom-1.5 -left-1.5 cursor-nesw-resize",
                corner === "se" && "-bottom-1.5 -right-1.5 cursor-nwse-resize",
              )}
            />
          ))}
          <button
            type="button"
            aria-label="Delete object"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => editor.deleteObject(object.id)}
            className="absolute -top-8 right-0 flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background text-destructive shadow-sm"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
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
          className="h-full w-full select-none object-contain"
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
  const common = {
    stroke: s.stroke,
    strokeWidth: s.thickness,
    fill: s.fill === "transparent" ? "none" : s.fill,
    strokeLinecap: "round" as const,
  };
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full overflow-visible">
      {s.kind === "line" && <line x1={2} y1={h - 2} x2={w - 2} y2={2} {...common} />}
      {s.kind === "arrow" && (
        <>
          <defs>
            <marker id={`ah-${object.id}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 z" fill={s.stroke} />
            </marker>
          </defs>
          <line
            x1={2}
            y1={h - 2}
            x2={w - 8}
            y2={6}
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
  const ref = useRef<HTMLDivElement>(null);
  const t = object.text!;

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
      onPointerDown={(e) => editing && e.stopPropagation()}
      onBlur={(e) => {
        editor.setEditingId(null);
        const value = e.currentTarget.textContent ?? "";
        if (value !== t.value) editor.updateObjectText(object.id, { value });
      }}
      className={cn(
        "h-full w-full whitespace-pre-wrap break-words px-1 outline-none",
        editing && "cursor-text bg-brand/5 ring-1 ring-brand",
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
