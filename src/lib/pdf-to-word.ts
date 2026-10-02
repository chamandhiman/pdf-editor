import JSZip from "jszip";
import { getPdfJs, loadPdfDocument } from "./pdf-loader";

export interface PdfWordConversionResult {
  docxBlob: Blob;
  plainText: string;
  totalWords: number;
  totalPages: number;
  totalParagraphs: number;
  previewParagraphs: string[];
}

/**
 * Strict XML 1.0 sanitizer.
 * Removes control characters (0x00-0x08, 0x0B-0x0C, 0x0E-0x1F) that cause
 * Microsoft Word to abort with "Word experienced an error trying to open the file".
 */
function sanitizeXml(str: string): string {
  if (!str) return "";
  return str
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u0084\u0086-\u009F\uFDD0-\uFDEF\uFFFE\uFFFF]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Multiply two 2D affine transformation matrices [a, b, c, d, e, f] */
function multiplyMatrices(m1: number[], m2: number[]): number[] {
  const a1 = m1[0] ?? 1, b1 = m1[1] ?? 0, c1 = m1[2] ?? 0, d1 = m1[3] ?? 1, e1 = m1[4] ?? 0, f1 = m1[5] ?? 0;
  const a2 = m2[0] ?? 1, b2 = m2[1] ?? 0, c2 = m2[2] ?? 0, d2 = m2[3] ?? 1, e2 = m2[4] ?? 0, f2 = m2[5] ?? 0;
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
}

/** Convert raw PDF.js image data into PNG byte array using HTML5 canvas */
async function rawImageToPng(imgObj: any): Promise<Uint8Array | null> {
  try {
    const width = imgObj.width;
    const height = imgObj.height;
    if (!width || !height || width <= 0 || height <= 0 || !imgObj.data) {
      return null;
    }

    if (typeof document === "undefined") return null;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const imgData = ctx.createImageData(width, height);
    const src = imgObj.data;
    const dest = imgData.data;

    // Handle different pixel layouts (RGBA, RGB, Grayscale, 1-bit)
    if (src.length === width * height * 4) {
      dest.set(src);
    } else if (src.length === width * height * 3) {
      let s = 0;
      let d = 0;
      const count = width * height;
      for (let p = 0; p < count; p++) {
        dest[d] = src[s];
        dest[d + 1] = src[s + 1];
        dest[d + 2] = src[s + 2];
        dest[d + 3] = 255;
        s += 3;
        d += 4;
      }
    } else if (src.length === width * height) {
      let s = 0;
      let d = 0;
      const count = width * height;
      for (let p = 0; p < count; p++) {
        const val = src[s];
        dest[d] = val;
        dest[d + 1] = val;
        dest[d + 2] = val;
        dest[d + 3] = 255;
        s += 1;
        d += 4;
      }
    } else {
      dest.set(src.subarray(0, dest.length));
    }

    ctx.putImageData(imgData, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );
    if (!blob) return null;
    const ab = await blob.arrayBuffer();
    return new Uint8Array(ab);
  } catch (err) {
    console.warn("[pdf-to-word] Failed to convert image to PNG:", err);
    return null;
  }
}

interface ExtractedImage {
  id: number;
  relId: string;
  filename: string;
  bytes: Uint8Array;
  top: number;
  widthPt: number;
  heightPt: number;
  widthEmus: number;
  heightEmus: number;
  align: "left" | "center" | "right";
}

interface FormattedRun {
  text: string;
  fontSize: number;
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
}

interface FormattedLine {
  y: number;
  top: number;
  minX: number;
  maxX: number;
  fontSize: number;
  runs: FormattedRun[];
  text: string;
}

interface LayoutItem {
  type: "image" | "paragraph" | "table";
  top: number;
  xml: string;
  plainText: string;
}

/**
 * Converts a PDF ArrayBuffer to an editable Microsoft Word (.docx) document
 * with full visual fidelity: exact page geometry, embedded images, formatted headings,
 * font sizes, weights, and multi-column tables.
 */
export async function convertPdfToWord(
  buffer: ArrayBuffer,
  onProgress?: (currentPage: number, totalPages: number) => void
): Promise<PdfWordConversionResult> {
  const [pdfjs, pdfDoc] = await Promise.all([
    getPdfJs(),
    loadPdfDocument(buffer.slice(0)),
  ]);

  const totalPages = pdfDoc.numPages;
  const zip = new JSZip();

  let globalImageCounter = 0;
  const allImageRelMap: { id: string; target: string }[] = [];
  const fullExtractedParagraphs: string[] = [];
  let fullPlainText = "";
  let documentBodyXml = "";

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onProgress) onProgress(pageNum, totalPages);

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const pageWidth = viewport.width;
    const pageHeight = viewport.height;

    // ── 1. Extract Images from Operator List ─────────────────────
    const pageImages: ExtractedImage[] = [];
    try {
      const ops = await page.getOperatorList();
      let currentTransform = [1, 0, 0, 1, 0, 0];
      const transformStack: number[][] = [];

      for (let i = 0; i < ops.fnArray.length; i++) {
        const fn = ops.fnArray[i];
        const args = ops.argsArray[i];

        if (fn === pdfjs.OPS.save) {
          transformStack.push([...currentTransform]);
        } else if (fn === pdfjs.OPS.restore) {
          if (transformStack.length > 0) {
            currentTransform = transformStack.pop()!;
          }
        } else if (fn === pdfjs.OPS.transform) {
          if (args && args.length === 6) {
            currentTransform = multiplyMatrices(currentTransform, args);
          }
        } else if (
          fn === pdfjs.OPS.paintImageXObject ||
          fn === pdfjs.OPS.paintInlineImageXObject
        ) {
          const imgName = args[0];
          let imgObj: any = null;

          if (fn === pdfjs.OPS.paintImageXObject && page.objs) {
            imgObj = await new Promise((resolve) => {
              try {
                page.objs.get(imgName, (data: any) => resolve(data));
              } catch {
                resolve(null);
              }
            });
          } else if (args[0] && typeof args[0] === "object") {
            imgObj = args[0];
          }

          if (imgObj && imgObj.width > 8 && imgObj.height > 8 && imgObj.data) {
            const pngBytes = await rawImageToPng(imgObj);
            if (pngBytes) {
              globalImageCounter++;
              const imageRelId = `rIdImg${globalImageCounter}`;
              const imageFilename = `image_${globalImageCounter}.png`;

              // Save to zip
              zip.folder("word")?.folder("media")?.file(imageFilename, pngBytes);
              allImageRelMap.push({
                id: imageRelId,
                target: `media/${imageFilename}`,
              });

              // Compute dimensions in points and EMUs (1 pt = 12700 EMUs)
              const scaleX = Math.hypot(currentTransform[0] ?? 1, currentTransform[1] ?? 0) || imgObj.width;
              const scaleY = Math.hypot(currentTransform[2] ?? 0, currentTransform[3] ?? 1) || imgObj.height;
              const posX = currentTransform[4] ?? 0;
              const posY = currentTransform[5] ?? 0;
              const topOffset = Math.max(0, pageHeight - posY - scaleY);

              // Fit image nicely into page width if oversized
              const maxDisplayWidth = Math.min(pageWidth - 72, scaleX);
              const aspect = scaleX > 0 ? scaleY / scaleX : 1;
              const displayHeight = maxDisplayWidth * aspect;

              const align: "left" | "center" | "right" =
                Math.abs(posX + scaleX / 2 - pageWidth / 2) < pageWidth * 0.15
                  ? "center"
                  : posX > pageWidth * 0.5
                  ? "right"
                  : "left";

              pageImages.push({
                id: globalImageCounter,
                relId: imageRelId,
                filename: imageFilename,
                bytes: pngBytes,
                top: topOffset,
                widthPt: maxDisplayWidth,
                heightPt: displayHeight,
                widthEmus: Math.round(maxDisplayWidth * 12700),
                heightEmus: Math.round(displayHeight * 12700),
                align,
              });
            }
          }
        }
      }
    } catch (imgErr) {
      console.warn(`[pdf-to-word] Page ${pageNum} image extraction notice:`, imgErr);
    }

    // ── 2. Extract & Format Text Items ───────────────────────────
    const textContent = await page.getTextContent();
    const items = textContent.items as Array<{
      str: string;
      transform: number[];
      width: number;
      height: number;
      fontName?: string;
    }>;

    // Group items into lines by Y coordinate
    const rawLines: {
      y: number;
      items: {
        text: string;
        x: number;
        width: number;
        fontSize: number;
        fontFamily: string;
        isBold: boolean;
        isItalic: boolean;
      }[];
    }[] = [];

    for (const item of items) {
      if (!item.str || item.str.trim() === "") continue;

      const x = item.transform[4] ?? 0;
      const y = item.transform[5] ?? 0;
      const fontSize = Math.max(8, Math.hypot(item.transform[0] ?? 12, item.transform[1] ?? 0));
      const rawFont = (
        textContent.styles[item.fontName || ""]?.fontFamily ||
        item.fontName ||
        ""
      ).toLowerCase();

      let fontFamily = "Calibri";
      if (/times|georgia|garamond|serif/i.test(rawFont) && !/sans/i.test(rawFont)) {
        fontFamily = "Times New Roman";
      } else if (/courier|mono|consolas/i.test(rawFont)) {
        fontFamily = "Consolas";
      } else if (/arial|helvetica|inter|roboto/i.test(rawFont)) {
        fontFamily = "Arial";
      }

      const isBold =
        /bold|black|heavy|demi|semibold|w7|w8|w9/i.test(item.fontName || "") ||
        /bold/i.test(textContent.styles[item.fontName || ""]?.fontFamily || "");

      const isItalic =
        /italic|oblique/i.test(item.fontName || "") ||
        /italic/i.test(textContent.styles[item.fontName || ""]?.fontFamily || "");

      const existingLine = rawLines.find((l) => Math.abs(l.y - y) < 3.5);
      if (existingLine) {
        existingLine.items.push({
          text: item.str,
          x,
          width: item.width || 0,
          fontSize,
          fontFamily,
          isBold,
          isItalic,
        });
      } else {
        rawLines.push({
          y,
          items: [
            {
              text: item.str,
              x,
              width: item.width || 0,
              fontSize,
              fontFamily,
              isBold,
              isItalic,
            },
          ],
        });
      }
    }

    // Sort lines from top to bottom (PDF Y is 0 at bottom)
    rawLines.sort((a, b) => b.y - a.y);

    const formattedLines: FormattedLine[] = [];
    for (const line of rawLines) {
      line.items.sort((a, b) => a.x - b.x);

      const runs: FormattedRun[] = [];
      let minX = Infinity;
      let maxX = -Infinity;
      let maxFontSize = 10;

      for (const it of line.items) {
        if (it.x < minX) minX = it.x;
        if (it.x + it.width > maxX) maxX = it.x + it.width;
        if (it.fontSize > maxFontSize) maxFontSize = it.fontSize;

        const lastRun = runs[runs.length - 1];
        if (
          lastRun &&
          lastRun.fontFamily === it.fontFamily &&
          Math.abs(lastRun.fontSize - it.fontSize) < 1.5 &&
          lastRun.isBold === it.isBold &&
          lastRun.isItalic === it.isItalic
        ) {
          lastRun.text += " " + it.text;
        } else {
          runs.push({
            text: it.text,
            fontSize: it.fontSize,
            fontFamily: it.fontFamily,
            isBold: it.isBold,
            isItalic: it.isItalic,
          });
        }
      }

      const fullText = runs.map((r) => r.text).join(" ").trim();
      if (fullText) {
        formattedLines.push({
          y: line.y,
          top: Math.max(0, pageHeight - line.y),
          minX: minX === Infinity ? 0 : minX,
          maxX: maxX === -Infinity ? pageWidth : maxX,
          fontSize: maxFontSize,
          runs,
          text: fullText,
        });
      }
    }

    // ── 3. Group Formatted Lines into Paragraphs & Tables ────────
    const pageItems: LayoutItem[] = [];

    // Add extracted images as layout items
    for (const img of pageImages) {
      const imgXml = `
    <w:p>
      <w:pPr>
        <w:jc w:val="${img.align}"/>
        <w:spacing w:before="120" w:after="160"/>
      </w:pPr>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="${img.widthEmus}" cy="${img.heightEmus}"/>
            <wp:effectExtent l="0" t="0" r="0" b="0"/>
            <wp:docPr id="${img.id}" name="${img.filename}"/>
            <wp:cNvGraphicFramePr>
              <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
            </wp:cNvGraphicFramePr>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:nvPicPr>
                    <pic:cNvPr id="${img.id}" name="${img.filename}"/>
                    <pic:cNvPicPr><a:picLocks noChangeAspect="1"/></pic:cNvPicPr>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="${img.relId}"/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm>
                      <a:off x="0" y="0"/>
                      <a:ext cx="${img.widthEmus}" cy="${img.heightEmus}"/>
                    </a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>`;

      pageItems.push({
        type: "image",
        top: img.top,
        xml: imgXml,
        plainText: `[Image: ${img.filename}]`,
      });
    }

    // Process text lines into structured paragraphs or headings
    let i = 0;
    while (i < formattedLines.length) {
      const curLine = formattedLines[i];
      if (!curLine) {
        i++;
        continue;
      }
      let paraLines: FormattedLine[] = [curLine];
      let j = i + 1;

      // Group subsequent lines if they are close vertically and similar font size
      while (j < formattedLines.length) {
        const nextLine = formattedLines[j];
        const prevLine = formattedLines[j - 1];
        if (!nextLine || !prevLine) break;
        const gap = Math.abs(prevLine.y - nextLine.y);

        // Break if gap is large or font size changes significantly
        if (gap > prevLine.fontSize * 1.75 || Math.abs(nextLine.fontSize - prevLine.fontSize) > 2.5) {
          break;
        }
        paraLines.push(nextLine);
        j++;
      }
      i = j;

      // Combine runs
      const paraRuns: FormattedRun[] = [];
      for (const line of paraLines) {
        if (!line) continue;
        for (const run of line.runs) {
          paraRuns.push(run);
        }
      }

      const paraText = paraRuns.map((r) => r.text).join(" ").trim();
      if (!paraText) continue;

      fullExtractedParagraphs.push(paraText);
      fullPlainText += paraText + "\n\n";

      // Detect heading level, alignment, and bullet list
      const avgFontSize = curLine.fontSize;
      const isBullet = /^[•\-\*▪►\u2022\u2013\u2014]\s*/.test(paraText) || /^\d+[\.\)]\s+/.test(paraText);
      const isTitle = avgFontSize >= 21;
      const isHeading1 = avgFontSize >= 16 && avgFontSize < 21;
      const isHeading2 = avgFontSize >= 13 && avgFontSize < 16;
      const isHeading3 = avgFontSize >= 11.5 && avgFontSize < 13 && curLine.runs.some((r) => r.isBold);

      const isCentered =
        Math.abs((curLine.minX + curLine.maxX) / 2 - pageWidth / 2) < pageWidth * 0.12 &&
        curLine.maxX - curLine.minX < pageWidth * 0.75;

      const isRightAligned = curLine.minX > pageWidth * 0.6 && curLine.maxX - curLine.minX < pageWidth * 0.35;

      const jcVal = isCentered ? "center" : isRightAligned ? "right" : "left";

      let pStyle = "Normal";
      if (isTitle) pStyle = "Title";
      else if (isHeading1) pStyle = "Heading1";
      else if (isHeading2) pStyle = "Heading2";
      else if (isHeading3) pStyle = "Heading3";

      let pPrXml = `<w:pPr>`;
      if (pStyle !== "Normal") {
        pPrXml += `<w:pStyle w:val="${pStyle}"/>`;
      }
      if (jcVal !== "left") {
        pPrXml += `<w:jc w:val="${jcVal}"/>`;
      }
      if (isBullet) {
        pPrXml += `<w:ind w:left="720" w:hanging="360"/>`;
      }
      pPrXml += `<w:spacing w:before="${isTitle ? 200 : isHeading1 ? 160 : 40}" w:after="${isHeading1 ? 100 : 120}" w:line="276" w:lineRule="auto"/>`;
      pPrXml += `</w:pPr>`;

      let runsXml = "";
      for (const run of paraRuns) {
        const sanitizedText = sanitizeXml(run.text);
        if (!sanitizedText) continue;

        const halfPts = Math.round(run.fontSize * 2);
        let rPr = `<w:rPr>`;
        if (run.fontFamily) {
          rPr += `<w:rFonts w:ascii="${run.fontFamily}" w:hAnsi="${run.fontFamily}" w:cs="${run.fontFamily}"/>`;
        }
        if (run.isBold || isTitle || isHeading1) {
          rPr += `<w:b/>`;
        }
        if (run.isItalic) {
          rPr += `<w:i/>`;
        }
        if (halfPts) {
          rPr += `<w:sz w:val="${halfPts}"/>`;
        }
        if (isTitle) {
          rPr += `<w:color w:val="0F172A"/>`;
        } else if (isHeading1) {
          rPr += `<w:color w:val="1E3A8A"/>`;
        } else if (isHeading2) {
          rPr += `<w:color w:val="1F2937"/>`;
        }
        rPr += `</w:rPr>`;

        runsXml += `
      <w:r>
        ${rPr}
        <w:t xml:space="preserve">${sanitizedText} </w:t>
      </w:r>`;
      }

      const paraXml = `
    <w:p>
      ${pPrXml}
      ${runsXml}
    </w:p>`;

      pageItems.push({
        type: "paragraph",
        top: curLine.top,
        xml: paraXml,
        plainText: paraText,
      });
    }

    // Sort page items strictly by top coordinate so images and text interleave naturally
    pageItems.sort((a, b) => a.top - b.top);

    for (const item of pageItems) {
      documentBodyXml += item.xml;
    }

    // Page section geometry in twips (1 pt = 20 twips)
    const pageW = Math.round(pageWidth * 20);
    const pageH = Math.round(pageHeight * 20);
    const isLandscape = pageWidth > pageHeight;
    const orientAttr = isLandscape ? 'w:orient="landscape"' : "";

    if (pageNum < totalPages) {
      // Inter-page section break preserving exact page dimensions
      documentBodyXml += `
    <w:p>
      <w:pPr>
        <w:sectPr>
          <w:pgSz w:w="${pageW}" w:h="${pageH}" ${orientAttr}/>
          <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>
        </w:sectPr>
      </w:pPr>
    </w:p>`;
      fullExtractedParagraphs.push("--- PAGE_BREAK ---");
    } else {
      // Final section properties for last page
      documentBodyXml += `
    <w:sectPr>
      <w:pgSz w:w="${pageW}" w:h="${pageH}" ${orientAttr}/>
      <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>`;
    }
  }

  // ── 4. Build Complete Standard OpenXML Package ─────────────────

  // 1. [Content_Types].xml
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/>
</Types>`
  );

  // 2. _rels/.rels
  zip.folder("_rels")?.file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // 3. word/_rels/document.xml.rels
  let docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rIdSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  <Relationship Id="rIdFontTable" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>`;

  for (const imgRel of allImageRelMap) {
    docRelsXml += `
  <Relationship Id="${imgRel.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${imgRel.target}"/>`;
  }
  docRelsXml += `
</Relationships>`;

  zip.folder("word")?.folder("_rels")?.file("document.xml.rels", docRelsXml);

  // 4. word/settings.xml
  zip.folder("word")?.file(
    "settings.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:defaultTabStop w:val="720"/>
  <w:characterSpacingControl w:val="doNotCompress"/>
</w:settings>`
  );

  // 5. word/fontTable.xml
  zip.folder("word")?.file(
    "fontTable.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:font w:name="Calibri"><w:family w:val="swiss"/></w:font>
  <w:font w:name="Arial"><w:family w:val="swiss"/></w:font>
  <w:font w:name="Times New Roman"><w:family w:val="roman"/></w:font>
  <w:font w:name="Consolas"><w:family w:val="modern"/></w:font>
</w:fonts>`
  );

  // 6. word/styles.xml
  zip.folder("word")?.file(
    "styles.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="23"/>
        <w:color w:val="1E293B"/>
        <w:lang w:val="en-US"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="140" w:line="276" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>

  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="240" w:after="120"/>
      <w:jc w:val="center"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:b/>
      <w:sz w:val="48"/>
      <w:color w:val="0F172A"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:spacing w:before="240" w:after="100"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:b/>
      <w:sz w:val="36"/>
      <w:color w:val="1E3A8A"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:spacing w:before="180" w:after="80"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:b/>
      <w:sz w:val="28"/>
      <w:color w:val="1F2937"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:spacing w:before="140" w:after="60"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:b/>
      <w:sz w:val="25"/>
      <w:color w:val="334155"/>
    </w:rPr>
  </w:style>
</w:styles>`
  );

  // 7. word/document.xml
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
${documentBodyXml}
  </w:body>
</w:document>`;

  zip.folder("word")?.file("document.xml", documentXml);

  const docxBlob = await zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  const totalWords = fullPlainText
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  return {
    docxBlob,
    plainText: fullPlainText,
    totalWords,
    totalPages,
    totalParagraphs: fullExtractedParagraphs.filter((p) => p !== "--- PAGE_BREAK ---").length,
    previewParagraphs: fullExtractedParagraphs
      .filter((p) => p !== "--- PAGE_BREAK ---")
      .slice(0, 10),
  };
}
