import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getPdfJs } from "@/lib/pdf-loader";
import type { PDFPage } from "@/types/pdf";
import { usePdfDoc } from "./usePdfDocument";
import type { EditorState } from "./useEditorState";
import { FloatingTextToolbar } from "./FloatingTextToolbar";
import { getOriginalFontMetric, calculateFontCompensation } from "@/lib/font-metrics";

const RENDER_SCALE = 2;

interface TextItem {
  idx: number;
  str: string;
  left: number;
  top: number;
  baselineY: number;
  originalFontMetric: number;
  fontSize: number;
  width: number;
  /** Clean detected font family name (e.g. "Montserrat", "Helvetica") or null */
  detectedFontFamily: string | null;
  /** CSS-safe font-family string suitable for HTML rendering */
  htmlFontFamily: string;
  fontWeight: React.CSSProperties["fontWeight"];
  fontStyle: React.CSSProperties["fontStyle"];
  angle: number;
  /**
   * True when this item is a bullet/list marker (•, ▪, ▸, etc.).
   * Bullet items are rendered non-editable and always use a stable font
   * so the glyph can never be corrupted by a font-family override.
   */
  isBullet: boolean;
  /**
   * True when this text item starts with a bullet marker glyph / symbol.
   * In this case, the bullet marker is extracted and rendered as a non-editable
   * permanent "•" glyph, while only the subsequent text is editable.
   */
  hasBulletPrefix: boolean;
  bulletChar: string;
  textWithoutBullet: string;
}

interface Colors {
  text: string;
  bg: string;
}

const loadedFonts = new Set<string>();

/**
 * Dynamically load Google Font for the detected font family if available.
 */
function ensureWebFont(family: string) {
  if (!family || loadedFonts.has(family)) return;
  loadedFonts.add(family);
  try {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:ital,wght@0,300..900;1,300..900&display=swap`;
    document.head.appendChild(link);
  } catch {
    // ignore
  }
}

/**
 * Strip PDF subset prefix (e.g. "ABCDEF+Montserrat-Bold" -> "Montserrat")
 * and common style suffixes to isolate the pure family name.
 */
function cleanFontFamily(name: string | undefined): string | null {
  if (!name) return null;
  // 1. Remove PDF subset tag (e.g. "ABCDEF+Arial" -> "Arial")
  let clean = name.replace(/^[A-Z]{6}\+/i, "").trim();

  // 2. Remove style suffixes like -Bold, -Italic, _Bold, ,Bold, PSMT, MT
  clean = clean
    .replace(/[-_, ]*(bold|black|heavy|extrabold|semibold|demibold|demi|medium|regular|light|thin|italic|oblique|roman|mt|psmt)/gi, "")
    .trim();

  // 3. Remove leading/trailing symbols
  clean = clean.replace(/^[-_,]+|[-_,]+$/g, "").trim();

  // 4. If camelCase without spaces (e.g. "TimesNewRoman" or "OpenSans"), add spaces
  if (/^[A-Z][a-z]+([A-Z][a-z]+)+$/.test(clean)) {
    clean = clean.replace(/([a-z])([A-Z])/g, "$1 $2");
  }

  // 5. Replace underscores with spaces
  clean = clean.replace(/_/g, " ").trim();

  // 6. Check if invalid or generic
  if (
    !clean ||
    clean.length < 2 ||
    /^(sans-serif|serif|monospace|cursive|fantasy|system-ui)$/i.test(clean) ||
    /^[a-z]_[a-z0-9]+/i.test(clean) ||
    /^g_d\d+/i.test(clean) ||
    /^f\d+$/i.test(clean) ||
    /cidfont/i.test(clean)
  ) {
    return null;
  }

  return clean;
}

/**
 * Resolve the best CSS font-family for HTML overlay rendering.
 * Uses Arial as the default fallback when original is unavailable.
 * Never uses Times New Roman as the default fallback.
 */
function resolveHtmlFont(
  embeddedName: string | undefined,
  fallbackName: string | undefined,
  styleFamily: string | undefined,
): { family: string; detectedName: string | null } {
  const cleanedEmbedded = cleanFontFamily(embeddedName);
  const cleanedFallback = cleanFontFamily(fallbackName);
  const cleanedStyle = cleanFontFamily(styleFamily);
  const detectedFamily = cleanedEmbedded || cleanedFallback || cleanedStyle;

  if (detectedFamily) {
    ensureWebFont(detectedFamily);
    const hint = `${embeddedName ?? ""} ${fallbackName ?? ""} ${styleFamily ?? ""}`.toLowerCase();
    const isMono = /courier|consolas|monaco|menlo|monospace|typewriter/i.test(hint);
    if (isMono) {
      return { family: `'${detectedFamily}', 'Courier New', Courier, monospace`, detectedName: detectedFamily };
    }
    return { family: `'${detectedFamily}', Arial, sans-serif`, detectedName: detectedFamily };
  }

  const hint = `${fallbackName ?? ""} ${styleFamily ?? ""}`.toLowerCase();
  if (/mono/i.test(hint)) return { family: "'Courier New', Courier, monospace", detectedName: "Courier New" };

  // Explicit user requirement: Use Arial as the fallback. Do NOT use Times New Roman as default fallback!
  return { family: "Arial, sans-serif", detectedName: null };
}


function sampleColors(item: TextItem, canvas: HTMLCanvasElement): Colors {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { text: "#000000", bg: "#ffffff" };

  const pad = Math.max(2, item.fontSize * 0.15);
  const x = Math.max(0, Math.floor((item.left - pad) * RENDER_SCALE));
  const y = Math.max(0, Math.floor((item.top - pad) * RENDER_SCALE));
  const w = Math.min(canvas.width - x, Math.ceil((item.width + pad * 2) * RENDER_SCALE));
  const h = Math.min(canvas.height - y, Math.ceil((item.fontSize * 1.35 + pad * 2) * RENDER_SCALE));
  if (w <= 0 || h <= 0) return { text: "#000000", bg: "#ffffff" };

  const data = ctx.getImageData(x, y, w, h).data;
  const toHex = (r: number, g: number, b: number) =>
    "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");

  // ── Step 1: Quantized histogram to find the dominant (background) color ──
  // Any transparent or unpainted pixel (alpha < 128) represents the page paper (white).
  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 16) {
    const a = data[i + 3]!;
    let r = data[i]!;
    let g = data[i + 1]!;
    let b = data[i + 2]!;
    if (a < 128) {
      r = 255;
      g = 255;
      b = 255;
    }
    // Quantise to 16-step buckets so very similar shades collapse together
    const key = ((r & ~15) << 16) | ((g & ~15) << 8) | (b & ~15);
    const entry = buckets.get(key);
    if (entry) {
      entry.count++;
      entry.r += r;
      entry.g += g;
      entry.b += b;
    } else {
      buckets.set(key, { count: 1, r, g, b });
    }
  }

  let top = { count: 0, r: 255, g: 255, b: 255 };
  for (const entry of buckets.values()) {
    if (entry.count > top.count) top = entry;
  }
  let bgR = Math.round(top.r / (top.count || 1));
  let bgG = Math.round(top.g / (top.count || 1));
  let bgB = Math.round(top.b / (top.count || 1));

  // ── Step 2: Minimal clamping ──
  // If sampled background is nearly white, snap to pure white (#ffffff)
  if (bgR >= 248 && bgG >= 248 && bgB >= 248) {
    bgR = 255; bgG = 255; bgB = 255;
  } else if (bgR <= 8 && bgG <= 8 && bgB <= 8) {
    bgR = 0; bgG = 0; bgB = 0;
  }

  // ── Step 4: Text colour – pixel with maximum distance from background ─────
  let maxDist = 0;
  let textRGB = [0, 0, 0];
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]!;
    if (a < 128) continue;
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const dist = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
    if (dist > maxDist) {
      maxDist = dist;
      textRGB = [r, g, b];
    }
  }

  // Fallback for very low contrast (e.g. blank box)
  if (maxDist < 40) {
    const lum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;
    textRGB = lum > 128 ? [0, 0, 0] : [255, 255, 255];
  }

  return {
    bg: toHex(bgR, bgG, bgB),
    text: toHex(textRGB[0]!, textRGB[1]!, textRGB[2]!),
  };
}

export function PdfCanvasPage({ page, editor }: { page: PDFPage; editor: EditorState }) {
  const doc = usePdfDoc();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const fullCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [items, setItems] = useState<TextItem[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [colors, setColors] = useState<Record<number, Colors>>({});
  const overrides = editor.document.textOverrides;
  const styleOverrides = editor.document.textStyleOverrides;

  // Text layer is interactive ONLY when "edit-text" tool is active,
  // so regular clicking in "select" mode does NOT edit text by default.
  const layerInteractive = editor.tool === "edit-text";

  // Deactivate active text item when user clicks outside both the text item and floating toolbar/menus
  useEffect(() => {
    if (activeIdx === null) return;
    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      // Click is inside the active text element -> keep active
      const activeSpan = layerRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
      if (activeSpan && activeSpan.contains(target)) return;

      // Click is inside toolbar, dropdowns, popovers, or Radix menus -> keep active
      if (
        target.closest?.("[data-floating-toolbar]") ||
        target.closest?.("[role='menu']") ||
        target.closest?.("[role='dialog']") ||
        target.closest?.("[data-radix-popper-content-wrapper]") ||
        target.closest?.("[data-radix-collection-item]") ||
        target.closest?.("[data-radix-menu-content]")
      ) {
        return;
      }

      // User clicked outside → always commit so override is locked in on first click-away.
      // This ensures shown stays true on the very next render.
      if (activeSpan) {
        const key = keyFor(activeIdx);
        const item = items.find((i) => i.idx === activeIdx);
        if (item) {
          const editTarget = activeSpan.querySelector<HTMLElement>("[contenteditable]") || activeSpan;
          const val = editTarget.textContent ?? "";
          const defaultText = item.hasBulletPrefix ? item.textWithoutBullet : item.str;
          const curOverride = overrides[key];
          const curStyle = styleOverrides?.[key];
          // Use already-saved style color, then canvas-sampled color (which is
          // stable — sampled once on items-load, not affected by erasing).
          const c = colors[item.idx];
          const colorToSave = curStyle?.color ?? (c?.text ?? "#000000");
          const bgToSave = curStyle?.bg ?? (c?.bg ?? "#ffffff");
          if (val !== (curOverride ?? defaultText) || curStyle !== undefined || curOverride === undefined) {
            editor.setTextOverride(key, val !== "" ? val : defaultText, colorToSave, bgToSave);
          }
        }
      }
      setActiveIdx(null);
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown, true);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown, true);
  }, [activeIdx, items, overrides, styleOverrides, colors, editor, page.index]);

  // Render the PDF page and extract text items
  useEffect(() => {
    if (!doc || page.type === "blank") return;
    const targetPageNumber = page.originalPageNumber ?? (page.index + 1);
    if (targetPageNumber > doc.numPages) return;

    let cancelled = false;
    (async () => {
      const pdfjs = await getPdfJs();
      const p = await doc.getPage(targetPageNumber);
      const viewport = p.getViewport({ scale: RENDER_SCALE });
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      const width = Math.floor(viewport.width);
      const height = Math.floor(viewport.height);
      canvas.width = width;
      canvas.height = height;

      const fullCanvas = document.createElement("canvas");
      fullCanvas.width = width;
      fullCanvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const fullContext = fullCanvas.getContext("2d", { willReadFrequently: true });
      if (!fullContext || !ctx) return;

      fullContext.fillStyle = "#ffffff";
      fullContext.fillRect(0, 0, width, height);

      await p.render({ canvas: fullCanvas, canvasContext: fullContext, viewport, background: "rgb(255,255,255)" }).promise;
      if (cancelled) return;
      fullCanvasRef.current = fullCanvas;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(fullCanvas, 0, 0);

      const unit = p.getViewport({ scale: 1 });
      const content = await p.getTextContent();
      if (cancelled) return;
      const next: TextItem[] = [];
      const scaleRatio = unit.width > 0 ? page.width / unit.width : 1;
      content.items.forEach((raw, i) => {
        const item = raw as {
          str?: string;
          transform?: number[];
          width?: number;
          height?: number;
          fontName?: string;
        };
        if (!item.str || !item.str.trim() || !item.transform) return;
        const tx = pdfjs.Util.transform(unit.transform, item.transform);
        const rawFontSize = (item.height && item.height > 0)
          ? item.height
          : (Math.hypot(tx[2]!, tx[3]!) || Math.hypot(tx[0]!, tx[1]!) || 16);
        let fontSize = Math.round(rawFontSize * scaleRatio * 10) / 10;
        if (Math.abs(fontSize - Math.round(fontSize)) < 0.15) {
          fontSize = Math.round(fontSize);
        }
        const angle = Math.atan2(tx[1]!, tx[0]!);
        const style = (content.styles as Record<string, { fontFamily?: string }>)[
          item.fontName ?? ""
        ];
        let embeddedFont:
          | { loadedName?: string; name?: string; fallbackName?: string; bold?: boolean; italic?: boolean }
          | undefined;
        if (item.fontName) {
          try {
            embeddedFont = (p.commonObjs.get(item.fontName) || (p.objs ? p.objs.get(item.fontName) : undefined)) as typeof embeddedFont;
          } catch {
            embeddedFont = undefined;
          }
        }
        const fontIdentity = `${embeddedFont?.name ?? ""} ${embeddedFont?.loadedName ?? ""} ${embeddedFont?.fallbackName ?? ""} ${item.fontName ?? ""} ${style?.fontFamily ?? ""}`;
        const bold = !!(embeddedFont?.bold || /bold|black|heavy|semibold|demi/i.test(fontIdentity));
        const italic = !!(embeddedFont?.italic || /italic|oblique/i.test(fontIdentity));

        const resolved = resolveHtmlFont(
          embeddedFont?.name || embeddedFont?.loadedName,
          embeddedFont?.fallbackName,
          style?.fontFamily,
        );

        // ── Bullet / list-marker detection ──────────────────────────────────
        // Symbol, Wingdings, ZapfDingbats encode bullet glyphs as ASCII chars
        // (e.g. 'F' or 'l') that display correctly in their own font but appear
        // as wrong letters in any other CSS font. Normalise them to the standard
        // Unicode bullet (U+2022) so they are font-agnostic.
        const isSymbolLikeFont = /symbol|wingdings|zapfdingbats|webdings/i.test(fontIdentity);
        let resolvedStr = item.str;
        if (isSymbolLikeFont) {
          // Common Symbol/Wingdings bullet glyph code-points → •
          resolvedStr = resolvedStr.replace(/[Fl\xB7\xD7\u00B7\u25A0]/g, "\u2022");
        }

        // Case A: Standalone bullet glyph item
        const BULLET_SOLO_RE = /^[\u2022\u2023\u2043\u25CF\u25AA\u25E6\u2219\u00B7\u25AB\u25B8\u25B9\u2192\u27A4\u2714\u2013\u2014\u2010\u00BB\*\-]+\s*$/;
        const isSoloBullet =
          BULLET_SOLO_RE.test(resolvedStr.trim()) ||
          (isSymbolLikeFont && resolvedStr.trim().length <= 2) ||
          resolvedStr.trim() === "F" ||
          resolvedStr.trim() === "l";

        // Case B: Combined item starting with a bullet marker (e.g. "F Tailored...", "• 24/7...")
        const BULLET_PREFIX_RE = /^([\u2022\u2023\u2043\u25CF\u25AA\u25E6\u2219\u00B7\u25AB\u25B8\u25B9\u2192\u27A4\u2714\u2013\u2014\u2010\u00BB\*\-]|F(?=\s)|l(?=\s))\s+/;
        const prefixMatch = !isSoloBullet ? resolvedStr.match(BULLET_PREFIX_RE) : null;
        const hasBulletPrefix = !!prefixMatch;
        const textWithoutBullet = prefixMatch ? resolvedStr.slice(prefixMatch[0].length) : resolvedStr;
        // ────────────────────────────────────────────────────────────────────

        const origMetric = getOriginalFontMetric(embeddedFont, resolved.detectedName);
        const baselineY = tx[5]! * scaleRatio;

        next.push({
          idx: i,
          str: isSoloBullet ? "\u2022" : resolvedStr,
          left: tx[4]! * scaleRatio,
          top: (tx[5]! - fontSize) * scaleRatio,
          baselineY,
          originalFontMetric: origMetric,
          fontSize,
          width: (item.width ?? 0) * scaleRatio,
          detectedFontFamily: resolved.detectedName,
          htmlFontFamily: resolved.family,
          fontWeight: bold ? 700 : 400,
          fontStyle: italic ? "italic" : "normal",
          angle,
          isBullet: isSoloBullet,
          hasBulletPrefix,
          bulletChar: "\u2022",
          textWithoutBullet,
        });
      });
      setItems(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [doc, page.index, page.width]);

  // Pre-cache all text and background colors from the rendered canvas once items are ready
  useLayoutEffect(() => {
    const full = fullCanvasRef.current;
    if (!full || items.length === 0) return;
    const next: Record<number, Colors> = {};
    items.forEach((item) => {
      next[item.idx] = sampleColors(item, full);
    });
    setColors(next);
  }, [items]);

  // Redraw the canvas and erase original PDF glyphs for items that are "shown"
  // (active, text-overridden, or style-overridden) so the HTML overlay is the only
  // visible text — prevents the duplicate/ghost text when editing.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const fullCanvas = fullCanvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !fullCanvas || !ctx) return;

    // Start from the full original render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(fullCanvas, 0, 0);

    const fullCtx = fullCanvas.getContext("2d", { willReadFrequently: true });

    // Erase the canvas glyph for every item that is rendered via HTML overlay
    items.forEach((item) => {
      const key = `${(page.originalPageNumber ?? (page.index + 1)) - 1}:${item.idx}`;
      const hasOverride = overrides[key] !== undefined;
      const hasStyleOverride =
        styleOverrides?.[key] !== undefined &&
        ["fontFamily", "fontSize", "bold", "italic", "underline", "align"].some(
          (k) => k in (styleOverrides[key] ?? {}),
        );
      const isShown = activeIdx === item.idx || hasOverride || hasStyleOverride;
      if (!isShown) return;

      const padX = Math.max(2, item.fontSize * 0.1);
      const padTop = item.fontSize * 0.12;
      const padBottom = item.fontSize * 0.35; // Fully covers descenders (g, y, p, q, j)

      const ex = Math.max(0, Math.floor((item.left - padX) * RENDER_SCALE));
      const ey = Math.max(0, Math.floor((item.top - padTop) * RENDER_SCALE));
      const ew = Math.min(
        canvas.width - ex,
        Math.ceil((item.width + padX * 2) * RENDER_SCALE),
      );
      const eh = Math.min(
        canvas.height - ey,
        Math.ceil((item.fontSize + padTop + padBottom) * RENDER_SCALE),
      );
      if (ew <= 0 || eh <= 0) return;

      const fillColor = styleOverrides?.[key]?.bg || colors[item.idx]?.bg || "#ffffff";

      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = fillColor;
      ctx.fillRect(ex, ey, ew, eh);
      ctx.restore();
    });
  }, [items, activeIdx, overrides, styleOverrides, colors, page.originalPageNumber, page.index]);


  const keyFor = (idx: number) => `${(page.originalPageNumber ?? (page.index + 1)) - 1}:${idx}`;

  // Find active item for FloatingTextToolbar
  const activeItem = activeIdx !== null ? items.find((i) => i.idx === activeIdx) : null;
  const activeKey = activeItem ? keyFor(activeItem.idx) : null;
  const activeStyle = activeKey ? styleOverrides?.[activeKey] ?? {} : {};
  const activeColor = activeStyle.color ?? (activeItem ? colors[activeItem.idx]?.text : "#000000") ?? "#000000";
  const activeFontFamily = activeStyle.fontFamily ?? (activeItem?.htmlFontFamily ?? "Arial, sans-serif");
  const activeFontSize = activeStyle.fontSize ?? (activeItem?.fontSize ?? 16);
  const activeBold = activeStyle.bold !== undefined ? activeStyle.bold : (activeItem ? activeItem.fontWeight === 700 || activeItem.fontWeight === "bold" : false);
  const activeItalic = activeStyle.italic !== undefined ? activeStyle.italic : (activeItem ? activeItem.fontStyle === "italic" : false);
  const activeUnderline = activeStyle.underline ?? false;
  const activeAlign = activeStyle.align ?? "left";

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div
        ref={layerRef}
        className="absolute inset-0 z-30"
        style={{
          width: page.width,
          height: page.height,
          pointerEvents: layerInteractive ? "auto" : "none",
        }}
      >
        {/* Floating Text Toolbar near active text item */}
        {activeItem && activeKey && (
          <FloatingTextToolbar
            fontFamily={activeFontFamily}
            fontSize={activeFontSize}
            bold={activeBold}
            italic={activeItalic}
            underline={activeUnderline}
            color={activeColor}
            align={activeAlign}
            detectedFont={activeItem.detectedFontFamily}
            onChange={(updates) => {
              const currentStr = overrides[activeKey] ?? (activeItem.hasBulletPrefix ? activeItem.textWithoutBullet : activeItem.str);
              const currentTextEl = layerRef.current?.querySelector<HTMLElement>(`[data-idx="${activeItem.idx}"] [contenteditable], [data-idx="${activeItem.idx}"][contenteditable]`);
              let liveStr = currentTextEl?.textContent || currentStr;
              if (activeItem.hasBulletPrefix) {
                liveStr = liveStr.replace(/^[\u2022\u2023\u2043\u25CF\u25AA\u25E6\u2219\u00B7\u25AB\u25B8\u25B9\u2192\u27A4\u2714\u2013\u2014\u2010\u00BB\*\-]\s*/, "");
              }
              const targetColor = updates.color ?? activeColor;
              const targetBg = updates.bg ?? (styleOverrides?.[activeKey]?.bg ?? colors[activeItem.idx]?.bg ?? "#ffffff");
              editor.setTextOverride(activeKey, liveStr, targetColor, targetBg);
              // Merge ONLY the changed properties.
              editor.setTextStyleOverride(activeKey, updates);
            }}
            position={{
              top: activeItem.top > 48 ? activeItem.top - 44 : activeItem.top + activeFontSize + 8,
              left: Math.max(8, Math.min(page.width - 440, activeItem.left)),
            }}
          />
        )}

        {items.map((item) => {
          const key = keyFor(item.idx);
          const override = overrides[key];
          const style = styleOverrides?.[key] ?? {};
          const c = colors[item.idx] ?? { text: "#000000", bg: "transparent" };
          const isActive = activeIdx === item.idx;
          // Bug 2 fix: also treat items as "shown" when they carry formatting overrides
          // (fontFamily, bold, italic, etc.) even if the text content hasn't changed.
          // This ensures the original PDF glyph is erased and the styled HTML version
          // is rendered without requiring a text edit first.
          const STYLE_KEYS_RENDER = ["fontFamily", "fontSize", "bold", "italic", "underline", "align"];
          const hasFmtOverride = STYLE_KEYS_RENDER.some((k) => k in style);
          const shown = isActive || override !== undefined || hasFmtOverride;

          // Bug 1 fix: bullet items always use their original font so the glyph stays as •.
          // Never apply a user-selected fontFamily override to bullet markers.
          const curFontFamily = item.isBullet ? item.htmlFontFamily : (style.fontFamily ?? item.htmlFontFamily);
          const nominalFontSize = style.fontSize ?? item.fontSize;

          // Check if original font is available and in use
          const isOrigFontActive = Boolean(
            item.detectedFontFamily &&
            curFontFamily.toLowerCase().includes(item.detectedFontFamily.toLowerCase()) &&
            loadedFonts.has(item.detectedFontFamily)
          );

          // Apply visual size compensation for fallback/substitute fonts
          const compensation = calculateFontCompensation(
            item.originalFontMetric ?? 0.718,
            curFontFamily,
            isOrigFontActive
          );
          const renderedFontSize = Math.round(nominalFontSize * compensation * 100) / 100;
          // Use item.top for positioning — it is already correctly anchored to the PDF glyph.
          // The baselineY-renderedFontSize approach shifts text upward when compensation ≠ 1.0,
          // making the overlay appear larger/higher than the original.
          const renderedTop = item.top;

          const curBold = style.bold !== undefined ? style.bold : (item.fontWeight === 700 || item.fontWeight === "bold");
          const curItalic = style.italic !== undefined ? style.italic : (item.fontStyle === "italic");
          const curUnderline = style.underline ?? false;
          const curColor = style.color ?? c.text;
          const curAlign = style.align ?? "left";

          return (
            <span key={item.idx} className="contents">
              {item.isBullet ? (
                // ── Standalone bullet marker span ──────────────────────────────
                <span
                  data-idx={item.idx}
                  contentEditable={false}
                  className="absolute outline-none select-none pointer-events-none font-sans"
                  style={{
                    left: item.left,
                    top: item.top,
                    fontSize: item.fontSize,
                    fontFamily: "Arial, sans-serif",
                    fontWeight: item.fontWeight as number,
                    fontStyle: item.fontStyle as string,
                    display: "inline-block",
                    minWidth: `${Math.max(item.width, 16)}px`,
                    lineHeight: 1,
                    whiteSpace: "pre",
                    transformOrigin: "0 0",
                    transform: `rotate(${item.angle}rad)`,
                    color: shown ? curColor : "transparent",
                    backgroundColor: "transparent",
                    background: "transparent",
                    border: "none",
                    boxShadow: "none",
                    outline: "none",
                    WebkitTextFillColor: shown ? curColor : "transparent",
                    zIndex: shown ? 40 : 10,
                  }}
                >
                  •
                </span>
              ) : item.hasBulletPrefix ? (
                // ── Item starting with a bullet marker (e.g. "F Tailored...", "• 24/7...") ──
                // The bullet marker "•" is rendered as non-editable, and only the text after it is editable.
                <span
                  data-idx={item.idx}
                  className="absolute outline-none select-text inline-flex items-baseline"
                  style={{
                    left: item.left,
                    top: renderedTop,
                    fontSize: renderedFontSize,
                    fontFamily: curFontFamily,
                    fontWeight: curBold ? 700 : 400,
                    fontStyle: curItalic ? "italic" : "normal",
                    textDecoration: curUnderline ? "underline" : "none",
                    textAlign: curAlign,
                    display: "inline-flex",
                    minWidth: `${Math.max(item.width, 16)}px`,
                    lineHeight: 1,
                    whiteSpace: "pre",
                    transformOrigin: "0 0",
                    transform: `rotate(${item.angle}rad)`,
                    color: shown ? curColor : "transparent",
                    backgroundColor: "transparent",
                    background: "transparent",
                    WebkitTapHighlightColor: "transparent",
                    border: "none",
                    boxShadow: "none",
                    outline: "none",
                    zIndex: shown ? 40 : 10,
                  }}
                >
                  <span
                    contentEditable={false}
                    className="select-none pointer-events-none inline-block font-sans mr-2"
                    style={{
                      color: shown ? curColor : "transparent",
                      WebkitTextFillColor: shown ? curColor : "transparent",
                      backgroundColor: "transparent",
                      background: "transparent",
                    }}
                  >
                    •
                  </span>
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    spellCheck={false}
                    onFocus={() => {
                      setActiveIdx(item.idx);
                    }}
                    onBlur={(e) => {
                      setActiveIdx(null);
                      const rawValue = e.currentTarget.textContent ?? "";
                      const value = rawValue.replace(/^[\u2022\u2023\u2043\u25CF\u25AA\u25E6\u2219\u00B7\u25AB\u25B8\u25B9\u2192\u27A4\u2714\u2013\u2014\u2010\u00BB\*\-]\s*/, "");
                      // Always save — even if unchanged — so override is set and
                      // shown stays true after this first click-away.
                      const savedColor = styleOverrides?.[key]?.color ?? colors[item.idx]?.text ?? "#000000";
                      const savedBg = styleOverrides?.[key]?.bg ?? colors[item.idx]?.bg ?? "#ffffff";
                      editor.setTextOverride(key, value !== "" ? value : (override ?? item.textWithoutBullet), savedColor, savedBg);
                    }}
                    onInput={(e) => {
                      const el = e.currentTarget;
                      const hasHtml =
                        el.childNodes.length > 1 ||
                        (el.firstChild != null && el.firstChild.nodeType !== Node.TEXT_NODE);
                      if (hasHtml) {
                        const text = el.textContent ?? "";
                        el.textContent = text;
                        const range = document.createRange();
                        const sel = window.getSelection();
                        if (el.firstChild) {
                          range.setStart(el.firstChild, text.length);
                        } else {
                          range.setStart(el, 0);
                        }
                        range.collapse(true);
                        sel?.removeAllRanges();
                        sel?.addRange(range);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                      e.stopPropagation();
                    }}
                    className="outline-none select-text"
                    style={{
                      color: shown ? curColor : "transparent",
                      backgroundColor: "transparent",
                      background: "transparent",
                      WebkitTapHighlightColor: "transparent",
                      border: "none",
                      boxShadow: "none",
                      outline: "none",
                      caretColor: shown ? curColor : "transparent",
                      cursor: layerInteractive ? "text" : "default",
                      WebkitTextFillColor: shown ? curColor : "transparent",
                    }}
                  >
                    {(override ?? item.textWithoutBullet).replace(/^[\u2022\u2023\u2043\u25CF\u25AA\u25E6\u2219\u00B7\u25AB\u25B8\u25B9\u2192\u27A4\u2714\u2013\u2014\u2010\u00BB\*\-]\s*/, "")}
                  </span>
                </span>
              ) : (
                // ── Regular editable text span ─────────────────────────────────
                <span
                  data-idx={item.idx}
                  contentEditable
                  suppressContentEditableWarning
                  spellCheck={false}
                  onFocus={() => {
                    setActiveIdx(item.idx);
                  }}
                  onBlur={(e) => {
                    setActiveIdx(null);
                    const value = e.currentTarget.textContent ?? "";
                    const defaultText = item.str;
                    // Always save so shown stays true after the very first click-away.
                    const savedColor = styleOverrides?.[key]?.color ?? colors[item.idx]?.text ?? "#000000";
                    const savedBg = styleOverrides?.[key]?.bg ?? colors[item.idx]?.bg ?? "#ffffff";
                    editor.setTextOverride(key, value !== "" ? value : (override ?? defaultText), savedColor, savedBg);
                  }}
                  onInput={(e) => {
                    // Strip any browser-injected rich text formatting.
                    // Keep only plain text so custom toolbar styles apply cleanly.
                    const el = e.currentTarget;
                    const hasHtml =
                      el.childNodes.length > 1 ||
                      (el.firstChild != null && el.firstChild.nodeType !== Node.TEXT_NODE);
                    if (hasHtml) {
                      const text = el.textContent ?? "";
                      el.textContent = text;
                      const range = document.createRange();
                      const sel = window.getSelection();
                      if (el.firstChild) {
                        range.setStart(el.firstChild, text.length);
                      } else {
                        range.setStart(el, 0);
                      }
                      range.collapse(true);
                      sel?.removeAllRanges();
                      sel?.addRange(range);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                    e.stopPropagation();
                  }}
                  className="absolute outline-none select-text"
                  style={{
                    left: item.left,
                    top: renderedTop,
                    fontSize: renderedFontSize,
                    fontFamily: curFontFamily,
                    fontWeight: curBold ? 700 : 400,
                    fontStyle: curItalic ? "italic" : "normal",
                    textDecoration: curUnderline ? "underline" : "none",
                    textAlign: curAlign,
                    display: "inline-block",
                    minWidth: `${Math.max(item.width, 16)}px`,
                    lineHeight: 1,
                    whiteSpace: "pre",
                    transformOrigin: "0 0",
                    transform: `rotate(${item.angle}rad)`,
                    color: shown ? curColor : "transparent",
                    backgroundColor: "transparent",
                    background: "transparent",
                    WebkitTapHighlightColor: "transparent",
                    border: "none",
                    boxShadow: "none",
                    outline: "none",
                    caretColor: shown ? curColor : "transparent",
                    cursor: layerInteractive ? "text" : "default",
                    WebkitTextFillColor: shown ? curColor : "transparent",
                    zIndex: shown ? 40 : 10,
                  }}
                >
                  {override ?? item.str}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
