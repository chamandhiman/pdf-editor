import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getPdfJs } from "@/lib/pdf-loader";
import type { PDFPage } from "@/types/pdf";
import { usePdfDoc } from "./usePdfDocument";
import type { EditorState } from "./useEditorState";

const RENDER_SCALE = 2;

interface TextItem {
  idx: number;
  str: string;
  left: number;
  top: number;
  fontSize: number;
  width: number;
  fontFamily: string;
  fontWeight: React.CSSProperties["fontWeight"];
  fontStyle: React.CSSProperties["fontStyle"];
}

interface Colors {
  text: string;
}

export function PdfCanvasPage({ page, editor }: { page: PDFPage; editor: EditorState }) {
  const doc = usePdfDoc();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<TextItem[]>([]);
  const [scales, setScales] = useState<Record<number, number>>({});
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [colors, setColors] = useState<Record<number, Colors>>({});
  const editable = editor.tool === "edit-text";

  useEffect(() => {
    if (activeIdx === null) return;
    const blurActiveText = (event: PointerEvent) => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || active.dataset["idx"] !== String(activeIdx)) return;
      if (event.target instanceof Node && active.contains(event.target)) return;
      active.blur();
    };
    document.addEventListener("pointerdown", blurActiveText, true);
    return () => document.removeEventListener("pointerdown", blurActiveText, true);
  }, [activeIdx]);

  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    (async () => {
      const pdfjs = await getPdfJs();
      const p = await doc.getPage(page.index + 1);
      const viewport = p.getViewport({ scale: RENDER_SCALE });
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      await p.render({ canvas, canvasContext: ctx, viewport }).promise;
      if (cancelled) return;

      const unit = p.getViewport({ scale: 1 });
      const content = await p.getTextContent();
      if (cancelled) return;
      const next: TextItem[] = [];
      content.items.forEach((raw, i) => {
        const item = raw as {
          str?: string;
          transform?: number[];
          width?: number;
          fontName?: string;
        };
        if (!item.str || !item.str.trim() || !item.transform) return;
        const tx = pdfjs.Util.transform(unit.transform, item.transform);
        const fontSize = Math.hypot(tx[2]!, tx[3]!);
        const style = (content.styles as Record<string, { fontFamily?: string }>)[
          item.fontName ?? ""
        ];
        let embeddedFont:
          | { loadedName?: string; name?: string; fallbackName?: string; bold?: boolean; italic?: boolean }
          | undefined;
        if (item.fontName) {
          try {
            embeddedFont = p.commonObjs.get(item.fontName) as typeof embeddedFont;
          } catch {
            embeddedFont = undefined;
          }
        }
        const fontIdentity = `${embeddedFont?.name ?? ""} ${item.fontName ?? ""} ${style?.fontFamily ?? ""}`;
        next.push({
          idx: i,
          str: item.str,
          left: tx[4]!,
          top: tx[5]! - fontSize,
          fontSize,
          width: item.width ?? 0,
          fontFamily:
            embeddedFont?.loadedName ?? embeddedFont?.fallbackName ?? style?.fontFamily ?? "serif",
          fontWeight:
            embeddedFont?.bold || /bold|black|heavy|semibold|demi/i.test(fontIdentity) ? 700 : 400,
          fontStyle:
            embeddedFont?.italic || /italic|oblique/i.test(fontIdentity) ? "italic" : "normal",
        });
      });
      setItems(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [doc, page.index]);

  // match each span's rendered width to the original glyph run
  useLayoutEffect(() => {
    const layer = layerRef.current;
    if (!layer || items.length === 0) return;
    const next: Record<number, number> = {};
    items.forEach((item) => {
      const el = layer.querySelector<HTMLElement>(`[data-idx="${item.idx}"]`);
      if (!el || !item.width) return;
      const natural = el.getBoundingClientRect().width / (scales[item.idx] ?? 1);
      if (natural > 0) next[item.idx] = item.width / natural;
    });
    setScales((prev) => {
      const changed = items.some((i) => Math.abs((prev[i.idx] ?? 1) - (next[i.idx] ?? 1)) > 0.01);
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const sample = (item: TextItem): Colors => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !ctx) return { text: "#000000" };
    const x = Math.max(0, Math.floor(item.left * RENDER_SCALE));
    const y = Math.max(0, Math.floor((item.top - item.fontSize * 0.2) * RENDER_SCALE));
    const w = Math.min(canvas.width - x, Math.ceil((item.width || item.fontSize) * RENDER_SCALE));
    const h = Math.min(canvas.height - y, Math.ceil(item.fontSize * 1.4 * RENDER_SCALE));
    if (w <= 0 || h <= 0) return { text: "#000000" };
    const data = ctx.getImageData(x, y, w, h).data;
    let dark = [0, 0, 0];
    let dl = 1e9;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < dl) {
        dl = lum;
        dark = [r, g, b];
      }
    }
    const hex = (c: number[]) =>
      "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
    return { text: hex(dark) };
  };

  const keyFor = (idx: number) => `${page.index}:${idx}`;
  const overrides = editor.document.textOverrides;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div
        ref={layerRef}
        className="absolute inset-0 z-30"
        style={{
          width: page.width,
          height: page.height,
          pointerEvents: editable ? "auto" : "none",
        }}
      >
        {items.map((item) => {
          const key = keyFor(item.idx);
          const override = overrides[key];
          const active = activeIdx === item.idx;
          const dirty = override !== undefined && override !== item.str;
          const shown = active || dirty;
          const c = colors[item.idx] ?? { text: "#000000" };
          return (
            <span key={item.idx} className="contents">
              <span
                data-idx={item.idx}
                contentEditable={editable}
                suppressContentEditableWarning
                spellCheck={false}
                onFocus={() => {
                  setColors((prev) => (prev[item.idx] ? prev : { ...prev, [item.idx]: sample(item) }));
                  setActiveIdx(item.idx);
                }}
                onBlur={(e) => {
                  setActiveIdx(null);
                  const value = e.currentTarget.textContent ?? "";
                  if (value !== (override ?? item.str)) editor.setTextOverride(key, value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                  e.stopPropagation();
                }}
                className="absolute cursor-text outline-none"
                style={{
                  left: item.left,
                  top: item.top,
                  fontSize: item.fontSize,
                  fontFamily: item.fontFamily,
                  fontWeight: item.fontWeight,
                  fontStyle: item.fontStyle,
                  lineHeight: 1.18,
                  whiteSpace: "pre",
                  transformOrigin: "0 0",
                  transform: `scaleX(${scales[item.idx] ?? 1})`,
                  color: shown ? c.text : "transparent",
                  background: "transparent",
                  caretColor: c.text,
                }}
              >
                {override ?? item.str}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
