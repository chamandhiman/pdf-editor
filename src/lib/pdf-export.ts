/**
 * pdf-export.ts
 *
 * Flattens all editor changes (text overrides + overlay objects) into the
 * original PDF bytes and returns the modified Uint8Array for download.
 *
 * Strategy for text overrides:
 *   1. Re-extract every text item's PDF-space coordinates via PDF.js.
 *   2. For each overridden item, paint a white rectangle over the original
 *      glyph (using the artwork-layer colour as background if available).
 *   3. Draw the new text with the closest standard font (Helvetica/Times).
 *
 * Strategy for overlay objects:
 *   Convert the CSS-space positions stored in PDFPage.objects back to
 *   PDF coordinate space (origin bottom-left) and draw them with pdf-lib.
 */

import { PDFDocument, rgb, StandardFonts, type PDFFont } from "pdf-lib";
import { getUploadedPdf } from "@/lib/pdf-store";
import { loadPdfDocument, getPdfJs } from "@/lib/pdf-loader";
import type { PDFDocument as AppDocument, PDFObject } from "@/types/pdf";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}

function classifyFont(
  embeddedName: string,
  fallbackName: string,
  styleFam: string,
  bold: boolean,
  italic: boolean,
): StandardFonts {
  const hint = `${embeddedName} ${fallbackName} ${styleFam}`.toLowerCase();
  const isSerif = /times|georgia|garamond|palatino|caslon|baskerville|bookman|charter|cambria|minion/i.test(hint);
  const isMono = /courier|consolas|monaco|menlo|typewriter/i.test(hint);

  if (isMono) return bold ? StandardFonts.CourierBold : (italic ? StandardFonts.CourierOblique : StandardFonts.Courier);
  if (isSerif) return bold ? StandardFonts.TimesRomanBold : (italic ? StandardFonts.TimesRomanItalic : StandardFonts.TimesRoman);
  // default → Helvetica (most modern PDFs are sans-serif)
  return bold ? StandardFonts.HelveticaBold : (italic ? StandardFonts.HelveticaOblique : StandardFonts.Helvetica);
}

/** Lazy font cache so the same font isn't embedded multiple times per export. */
async function getFont(doc: PDFDocument, name: StandardFonts, cache: Map<StandardFonts, PDFFont>): Promise<PDFFont> {
  let f = cache.get(name);
  if (!f) {
    f = await doc.embedFont(name);
    cache.set(name, f);
  }
  return f;
}

// ---------------------------------------------------------------------------
// Main export function
// ---------------------------------------------------------------------------

export async function exportEditedPdf(appDoc: AppDocument): Promise<Uint8Array | null> {
  const upload = getUploadedPdf();

  let pdfLib: PDFDocument;
  let pdfJsDoc: any = null;
  const fontCache = new Map<StandardFonts, PDFFont>();

  if (upload) {
    const sourcePdf = await PDFDocument.load(upload.bytes.slice(0));
    try {
      pdfJsDoc = await loadPdfDocument(upload.bytes.slice(0));
    } catch (e) {
      console.warn("[pdf-export] Failed to load with pdf.js", e);
    }

    pdfLib = await PDFDocument.create();
    for (const page of appDoc.pages) {
      if (page.type === "blank" || !page.originalPageNumber) {
        pdfLib.addPage([page.width || 595, page.height || 842]);
      } else {
        const [copied] = await pdfLib.copyPages(sourcePdf, [page.originalPageNumber - 1]);
        pdfLib.addPage(copied);
      }
    }
  } else {
    pdfLib = await PDFDocument.create();
    for (const page of appDoc.pages) {
      pdfLib.addPage([page.width || 612, page.height || 792]);
    }
  }

  const libPages = pdfLib.getPages();

  for (let pageIdx = 0; pageIdx < libPages.length; pageIdx++) {
    const libPage = libPages[pageIdx]!;
    const appPage = appDoc.pages[pageIdx];
    const { height: pdfPageHeight } = libPage.getSize();

    // -----------------------------------------------------------------------
    // 1. Apply text overrides (in-place PDF text replacement)
    // -----------------------------------------------------------------------
    const origPageIdx = (appPage?.originalPageNumber ?? (pageIdx + 1)) - 1;

    // Collect items from BOTH textOverrides (text edits) AND textStyleOverrides
    // (style-only changes like fontFamily / bold without text edits).
    // Previously, style-only items were silently skipped which caused the
    // downloaded PDF to look identical to the original upload.
    const styleOverridesOnPage = appPage?.type === "blank" ? [] : Object.entries(appDoc.textStyleOverrides ?? {})
      .filter(([k]) => k.startsWith(`${origPageIdx}:`))
      .map(([k]) => parseInt(k.split(":")[1]!));

    const textOverridesOnPage = appPage?.type === "blank" ? [] : Object.entries(appDoc.textOverrides)
      .filter(([k]) => k.startsWith(`${origPageIdx}:`))
      .map(([k, v]) => ({ itemIdx: parseInt(k.split(":")[1]!), newText: v }));

    // Union of all item indices that need writing
    const allOverriddenIdxs = new Set<number>([
      ...textOverridesOnPage.map((o) => o.itemIdx),
      ...styleOverridesOnPage,
    ]);

    if (allOverriddenIdxs.size > 0 && pdfJsDoc && appPage?.type !== "blank") {
      const jsPage = await pdfJsDoc.getPage(origPageIdx + 1);
      const content = await jsPage.getTextContent();

      // Build a map idx → raw PDF-space text data
      type RawItem = {
        idx: number;
        str: string;
        /** x in PDF points from left */
        pdfX: number;
        /** y baseline in PDF points from bottom */
        pdfY: number;
        /** font size in PDF points */
        pdfFontSize: number;
        /** approximate run width in PDF points */
        pdfWidth: number;
        fontEnum: StandardFonts;
        /** True if this is a bullet/list-marker item — skip export, leave glyph intact */
        isBullet: boolean;
        hasBulletPrefix: boolean;
        textWithoutBullet: string;
      };

      const rawItems: RawItem[] = [];
      let i = 0;
      for (const raw of content.items) {
        const item = raw as {
          str?: string;
          transform?: number[];
          width?: number;
          fontName?: string;
        };
        if (item.str?.trim() && item.transform) {
          // item.transform is the text matrix in raw PDF user-space coordinates
          // [a, b, c, d, e, f]  where (e,f) = position baseline
          const [a, b, c, d, e, f] = item.transform as number[];
          const pdfFontSize = Math.hypot(c ?? 0, d ?? 0) || Math.hypot(a ?? 0, b ?? 0);

          const styleMap = content.styles as Record<string, { fontFamily?: string }>;
          const style = styleMap[item.fontName ?? ""] ?? {};

          let embeddedFont: { loadedName?: string; name?: string; fallbackName?: string; bold?: boolean; italic?: boolean } | undefined;
          if (item.fontName) {
            try { embeddedFont = jsPage.commonObjs.get(item.fontName) as typeof embeddedFont; } catch { /* ignore */ }
          }
          const fontId = `${embeddedFont?.name ?? ""} ${item.fontName ?? ""} ${style.fontFamily ?? ""}`;
          const bold = !!(embeddedFont?.bold || /bold|black|heavy|semibold|demi/i.test(fontId));
          const italic = !!(embeddedFont?.italic || /italic|oblique/i.test(fontId));
          const fontEnum = classifyFont(
            embeddedFont?.loadedName ?? "",
            embeddedFont?.fallbackName ?? embeddedFont?.name ?? "",
            style.fontFamily ?? "",
            bold,
            italic,
          );

          // Detect bullet markers — same logic as PdfCanvasPage so they match.
          const isSymbolLike = /symbol|wingdings|zapfdingbats|webdings/i.test(fontId);
          let rawStr = item.str ?? "";
          if (isSymbolLike) {
            rawStr = rawStr.replace(/[Fl\xB7\xD7\u00B7\u25A0]/g, "\u2022");
          }
          const BULLET_SOLO_RE = /^[\u2022\u2023\u2043\u25CF\u25AA\u25E6\u2219\u00B7\u25AB\u25B8\u25B9\u2192\u27A4\u2714\u2013\u2014\u2010\u00BB\*\-]+\s*$/;
          const isBullet = BULLET_SOLO_RE.test(rawStr.trim()) || (isSymbolLike && rawStr.trim().length <= 2) || rawStr.trim() === "F" || rawStr.trim() === "l";

          const BULLET_PREFIX_RE = /^([\u2022\u2023\u2043\u25CF\u25AA\u25E6\u2219\u00B7\u25AB\u25B8\u25B9\u2192\u27A4\u2714\u2013\u2014\u2010\u00BB\*\-]|F(?=\s)|l(?=\s))\s+/;
          const pMatch = !isBullet ? rawStr.match(BULLET_PREFIX_RE) : null;
          const hasBulletPrefix = !!pMatch;
          const textWithoutBullet = pMatch ? rawStr.slice(pMatch[0].length) : rawStr;

          rawItems.push({
            idx: i,
            str: isBullet ? "\u2022" : rawStr,
            pdfX: e ?? 0,
            pdfY: f ?? 0,
            pdfFontSize: pdfFontSize || 12,
            pdfWidth: (item.width ?? 0),
            fontEnum,
            isBullet,
            hasBulletPrefix,
            textWithoutBullet,
          });
        }
        i++;
      }

      for (const itemIdx of allOverriddenIdxs) {
        const ri = rawItems.find((r) => r.idx === itemIdx);
        if (!ri) continue;

        // Bullet markers are non-editable in the editor; never touch them in the export.
        if (ri.isBullet) continue;

        const overrideKey = `${pageIdx}:${itemIdx}`;
        // Use the edited text if available, otherwise keep the original PDF text.
        let newText = appDoc.textOverrides[overrideKey] ?? (ri.hasBulletPrefix ? ri.textWithoutBullet : ri.str);
        if (ri.hasBulletPrefix && !newText.startsWith("•") && !newText.startsWith("-")) {
          newText = `• ${newText}`;
        }
        const style = appDoc.textStyleOverrides?.[overrideKey];

        // Classify font with style overrides if present
        let fontEnum = ri.fontEnum;
        if (style?.fontFamily) {
          const fLow = style.fontFamily.toLowerCase();
          const isMono = /courier|mono|consolas/i.test(fLow);
          const isSerif = /serif|merriweather|georgia|times/i.test(fLow);
          const isBold = style.bold !== undefined ? style.bold : ri.fontEnum.toString().includes("Bold");
          const isItalic = style.italic !== undefined ? style.italic : (ri.fontEnum.toString().includes("Italic") || ri.fontEnum.toString().includes("Oblique"));

          if (isMono) {
            fontEnum = isBold ? StandardFonts.CourierBold : (isItalic ? StandardFonts.CourierOblique : StandardFonts.Courier);
          } else if (isSerif) {
            fontEnum = isBold ? StandardFonts.TimesRomanBold : (isItalic ? StandardFonts.TimesRomanItalic : StandardFonts.TimesRoman);
          } else {
            fontEnum = isBold ? StandardFonts.HelveticaBold : (isItalic ? StandardFonts.HelveticaOblique : StandardFonts.Helvetica);
          }
        } else if (style?.bold !== undefined || style?.italic !== undefined) {
          const isBold = style.bold !== undefined ? style.bold : false;
          const isItalic = style.italic !== undefined ? style.italic : false;
          fontEnum = isBold ? StandardFonts.HelveticaBold : (isItalic ? StandardFonts.HelveticaOblique : StandardFonts.Helvetica);
        }

        const font = await getFont(pdfLib, fontEnum, fontCache);
        // Bug 2 fix: NEVER recalculate font size from the style override unless the
        // user explicitly changed it. Use the original PDF font size as the baseline.
        const fs = style?.fontSize ?? ri.pdfFontSize;
        const originalWidth = ri.pdfWidth > 0 ? ri.pdfWidth : font.widthOfTextAtSize(ri.str, fs);
        const newWidth = font.widthOfTextAtSize(newText, fs);
        const eraseWidth = Math.max(originalWidth, newWidth) + fs * 0.5;
        const pad = fs * 0.3;

        const hexColor = style?.color ?? appDoc.textColorOverrides?.[overrideKey] ?? "#000000";
        let hexBg = style?.bg ?? appDoc.textBgOverrides?.[overrideKey] ?? "#ffffff";
        if (hexBg === "#d1d5db" || hexBg === "#e5e7eb" || hexBg === "#cccccc") {
          hexBg = "#ffffff";
        }
        const [tr, tg, tb] = hexToRgb(hexColor);
        const [br, bg, bb] = hexToRgb(hexBg);

        const hasDescenders = /[gjpqyQ,;]/.test(ri.str);
        const bottomPad = hasDescenders ? fs * 0.15 : 1;
        const padX = Math.max(2, fs * 0.05);

        // Erase the original glyph region with the background color
        libPage.drawRectangle({
          x: ri.pdfX - padX,
          y: ri.pdfY - bottomPad,
          width: eraseWidth + padX * 2,
          height: fs * 1.05 + bottomPad,
          color: rgb(br, bg, bb),
          borderWidth: 0,
        });

        // Suppress unused var warning
        void pad;

        // Alignment adjustment
        let drawX = ri.pdfX;
        if (style?.align === "center") {
          drawX = ri.pdfX + Math.max(0, (originalWidth - newWidth) / 2);
        } else if (style?.align === "right") {
          drawX = ri.pdfX + Math.max(0, originalWidth - newWidth);
        }

        // Draw the replacement text in the preserved color
        libPage.drawText(newText, {
          x: drawX,
          y: ri.pdfY,
          size: fs,
          font,
          color: rgb(tr, tg, tb),
        });

        // Underline if active
        if (style?.underline) {
          libPage.drawLine({
            start: { x: drawX, y: ri.pdfY - 2 },
            end: { x: drawX + newWidth, y: ri.pdfY - 2 },
            thickness: Math.max(1, fs * 0.06),
            color: rgb(tr, tg, tb),
          });
        }
      }
    }

    // -----------------------------------------------------------------------
    // 2. Paint overlay objects from the editor state
    // -----------------------------------------------------------------------
    if (!appPage) continue;

    // Helper: CSS top-left → PDF bottom-left
    const pdfY = (cssTop: number, cssHeight: number) =>
      pdfPageHeight - cssTop - cssHeight;

    for (const obj of appPage.objects) {
      const opacity = obj.opacity / 100;
      const ox = obj.x;
      const oy = pdfY(obj.y, obj.height);

      switch (obj.type) {
        case "text": {
          if (!obj.text?.value) break;
          const t = obj.text;
          const isSerif = /times|georgia|garamond|palatino|serif/i.test(t.fontFamily);
          const isMono = /courier|consolas|mono/i.test(t.fontFamily);
          let fn: StandardFonts;
          if (isMono) fn = t.bold ? StandardFonts.CourierBold : StandardFonts.Courier;
          else if (isSerif) fn = t.bold ? StandardFonts.TimesRomanBold : (t.italic ? StandardFonts.TimesRomanItalic : StandardFonts.TimesRoman);
          else fn = t.bold ? StandardFonts.HelveticaBold : (t.italic ? StandardFonts.HelveticaOblique : StandardFonts.Helvetica);

          const font = await getFont(pdfLib, fn, fontCache);
          const [cr, cg, cb] = hexToRgb(t.color);

          const rawLines = t.value.split("\n");
          const lineHeight = t.fontSize * 1.35;
          // In CSS/HTML, text is aligned to the top of the bounding box at obj.y with px-1 (4px) padding.
          // The first line baseline is at obj.y + fontSize * 0.85 from page top.
          // In PDF coordinates (origin at bottom-left), that corresponds to:
          let curY = pdfPageHeight - obj.y - t.fontSize * 0.85;

          for (let li = 0; li < rawLines.length; li++) {
            const rawLine = rawLines[li] ?? "";
            const isChecklist =
              t.listType === "check" ||
              /^(\[ ?\]|☐|\u2610|\u25A1|\u25A2)/.test(rawLine.trim());
            const isBullet =
              t.listType === "bullet" ||
              /^([\u2022\u2023\u2043\u25CF\u25AA\u25E6\u2219\u00B7\u25AB\u25B8\u25B9\u2192\u27A4\u2714\u2013\u2014\u2010\u00BB\*\-])\s+/.test(rawLine);
            const isNumbered =
              t.listType === "numbered" ||
              /^\d+[\.\)]\s+/.test(rawLine);

            const cleanLine = rawLine
              .replace(/^(\[ ?\]|☐|\u2610|\u25A1|\u25A2|\u2705|\u2611|\[x\]|\[X\])\s*/, "")
              .replace(/^[\u2022\u2023\u2043\u25CF\u25AA\u25E6\u2219\u00B7\u25AB\u25B8\u25B9\u2192\u27A4\u2714\u2013\u2014\u2010\u00BB\*\-]\s*/, "")
              .replace(/^\d+[\.\)]\s*/, "")
              .replace(/[\u2610\u25A1\u25A2]/g, "");

            if (isChecklist) {
              const boxSize = Math.round(t.fontSize * 0.72);
              const markerWidth = t.fontSize;
              const boxX = ox + 4 + (markerWidth - boxSize) / 2;
              const boxY = curY + t.fontSize * 0.08;
              const textX = ox + 4 + markerWidth + 8;
              const borderWidth = Math.max(1, t.fontSize * 0.075);

              // Draw real square vector checkbox matching the editor UI
              libPage.drawRectangle({
                x: boxX,
                y: boxY,
                width: boxSize,
                height: boxSize,
                borderColor: rgb(cr, cg, cb),
                borderWidth,
                opacity,
              });

              // If line was marked checked ([x]), draw checkmark
              const wasChecked = /^(\[x\]|\[X\]|\u2611|\u2705)/i.test(rawLine.trim());
              if (wasChecked) {
                libPage.drawLine({
                  start: { x: boxX + boxSize * 0.2, y: boxY + boxSize * 0.5 },
                  end: { x: boxX + boxSize * 0.45, y: boxY + boxSize * 0.2 },
                  thickness: borderWidth * 1.2,
                  color: rgb(cr, cg, cb),
                  opacity,
                });
                libPage.drawLine({
                  start: { x: boxX + boxSize * 0.45, y: boxY + boxSize * 0.2 },
                  end: { x: boxX + boxSize * 0.85, y: boxY + boxSize * 0.8 },
                  thickness: borderWidth * 1.2,
                  color: rgb(cr, cg, cb),
                  opacity,
                });
              }

              if (cleanLine) {
                libPage.drawText(cleanLine, {
                  x: textX,
                  y: curY,
                  size: t.fontSize,
                  font,
                  color: rgb(cr, cg, cb),
                  opacity,
                  maxWidth: Math.max(10, obj.width - (textX - ox) - 4),
                });
              }
            } else if (isBullet) {
              const markerWidth = t.fontSize;
              const bulletRadius = Math.max(1.8, t.fontSize * 0.16);
              const bulletX = ox + 4 + markerWidth / 2;
              const bulletY = curY + t.fontSize * 0.28;
              const textX = ox + 4 + markerWidth + 8;

              libPage.drawCircle({
                x: bulletX,
                y: bulletY,
                size: bulletRadius,
                color: rgb(cr, cg, cb),
                opacity,
              });

              if (cleanLine) {
                libPage.drawText(cleanLine, {
                  x: textX,
                  y: curY,
                  size: t.fontSize,
                  font,
                  color: rgb(cr, cg, cb),
                  opacity,
                  maxWidth: Math.max(10, obj.width - (textX - ox) - 4),
                });
              }
            } else if (isNumbered) {
              const numStr = `${li + 1}.`;
              const markerWidth = t.fontSize * 1.4;
              let numWidth = t.fontSize * 0.8;
              try {
                numWidth = font.widthOfTextAtSize(numStr, t.fontSize);
              } catch {
                // fallback
              }
              const numX = ox + 4 + Math.max(0, markerWidth - numWidth);
              const textX = ox + 4 + markerWidth + 8;

              libPage.drawText(numStr, {
                x: numX,
                y: curY,
                size: t.fontSize,
                font,
                color: rgb(cr, cg, cb),
                opacity,
              });

              if (cleanLine) {
                libPage.drawText(cleanLine, {
                  x: textX,
                  y: curY,
                  size: t.fontSize,
                  font,
                  color: rgb(cr, cg, cb),
                  opacity,
                  maxWidth: Math.max(10, obj.width - (textX - ox) - 4),
                });
              }
            } else {
              // Standard text line
              const safeLine = cleanLine.replace(/[\u2610\u25A1\u25A2]/g, "");
              if (safeLine) {
                libPage.drawText(safeLine, {
                  x: ox + 4,
                  y: curY,
                  size: t.fontSize,
                  font,
                  color: rgb(cr, cg, cb),
                  opacity,
                  maxWidth: Math.max(10, obj.width - 8),
                });
              }
            }

            curY -= lineHeight;
          }
          break;
        }

        case "highlight": {
          if (!obj.highlight) break;
          const [hr, hg, hb] = hexToRgb(obj.highlight.color);
          libPage.drawRectangle({
            x: ox,
            y: oy,
            width: obj.width,
            height: obj.height,
            color: rgb(hr, hg, hb),
            opacity,
            borderWidth: 0,
          });
          break;
        }

        case "image": {
          if (!obj.image?.src) break;
          try {
            const [, base64] = obj.image.src.split(",");
            if (!base64) break;
            const imgBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
            const embImg = obj.image.src.includes("image/png")
              ? await pdfLib.embedPng(imgBytes)
              : await pdfLib.embedJpg(imgBytes);
            libPage.drawImage(embImg, { x: ox, y: oy, width: obj.width, height: obj.height, opacity });
          } catch { /* skip non-embeddable images */ }
          break;
        }

        case "signature": {
          if (obj.signature?.src) {
            try {
              const [, base64] = obj.signature.src.split(",");
              if (!base64) break;
              const imgBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
              const embImg = obj.signature.src.includes("image/png")
                ? await pdfLib.embedPng(imgBytes)
                : await pdfLib.embedJpg(imgBytes);
              libPage.drawImage(embImg, { x: ox, y: oy, width: obj.width, height: obj.height, opacity });
            } catch { /* skip */ }
          } else if (obj.signature?.name) {
            const font = await getFont(pdfLib, StandardFonts.TimesRomanItalic, fontCache);
            const fs = Math.min(obj.height * 0.55, 36);
            libPage.drawText(obj.signature.name, {
              x: ox,
              y: oy + obj.height * 0.25,
              size: fs,
              font,
              color: rgb(0.08, 0.13, 0.24),
              opacity,
            });
          }
          break;
        }

        case "shape": {
          if (!obj.shape) break;
          const s = obj.shape;
          const [sr, sg, sb] = hexToRgb(s.stroke);
          const strokeColor = rgb(sr, sg, sb);
          const fillColor = s.fill === "transparent"
            ? undefined
            : (([fr, fg, fb]) => rgb(fr, fg, fb))(hexToRgb(s.fill));

          if (s.kind === "rectangle") {
            libPage.drawRectangle({
              x: ox,
              y: oy,
              width: obj.width,
              height: obj.height,
              borderColor: strokeColor,
              borderWidth: s.thickness,
              ...(fillColor ? { color: fillColor } : {}),
              opacity,
            });
          } else if (s.kind === "circle") {
            libPage.drawEllipse({
              x: ox + obj.width / 2,
              y: oy + obj.height / 2,
              xScale: obj.width / 2,
              yScale: obj.height / 2,
              borderColor: strokeColor,
              borderWidth: s.thickness,
              ...(fillColor ? { color: fillColor } : {}),
              opacity,
            });
          } else if (s.kind === "line" || s.kind === "arrow") {
            const cx = ox + obj.width / 2;
            const cy = oy + obj.height / 2;
            const rot = obj.rotation || 0;
            // In PDF Cartesian coordinates, Y points up while CSS Y points down.
            // Clockwise rotation theta in CSS corresponds to -theta in PDF.
            const rad = (-rot * Math.PI) / 180;
            const halfW = obj.width / 2;
            const dx = halfW * Math.cos(rad);
            const dy = halfW * Math.sin(rad);

            const startX = cx - dx;
            const startY = cy - dy;
            const endX = cx + dx;
            const endY = cy + dy;

            libPage.drawLine({
              start: { x: startX, y: startY },
              end: { x: endX, y: endY },
              color: strokeColor,
              thickness: s.thickness,
              opacity,
            });

            if (s.kind === "arrow") {
              const arrowLen = Math.max(6, s.thickness * 2.5);
              const leftAngle = rad + Math.PI - 0.45;
              const rightAngle = rad + Math.PI + 0.45;
              libPage.drawLine({
                start: { x: endX, y: endY },
                end: {
                  x: endX + arrowLen * Math.cos(leftAngle),
                  y: endY + arrowLen * Math.sin(leftAngle),
                },
                color: strokeColor,
                thickness: s.thickness,
                opacity,
              });
              libPage.drawLine({
                start: { x: endX, y: endY },
                end: {
                  x: endX + arrowLen * Math.cos(rightAngle),
                  y: endY + arrowLen * Math.sin(rightAngle),
                },
                color: strokeColor,
                thickness: s.thickness,
                opacity,
              });
            }
          }
          break;
        }

        case "stamp": {
          if (!obj.stamp) break;
          const [sr, sg, sb] = hexToRgb(obj.stamp.color);
          const sc = rgb(sr, sg, sb);
          libPage.drawRectangle({
            x: ox + 2, y: oy + 2,
            width: obj.width - 4, height: obj.height - 4,
            borderColor: sc, borderWidth: 3,
            opacity,
          });
          const font = await getFont(pdfLib, StandardFonts.HelveticaBold, fontCache);
          const fs = Math.min(obj.height * 0.42, 22);
          libPage.drawText(obj.stamp.label.toUpperCase(), {
            x: ox + 8,
            y: oy + (obj.height - fs) / 2,
            size: fs,
            font,
            color: sc,
            opacity,
          });
          break;
        }

        // "drawing" (freehand SVG paths) and "note"/"link" cannot be easily
        // represented in PDF spec without complex path conversion — skip for now.
        default:
          break;
      }
    }
  }

  return pdfLib.save();
}
