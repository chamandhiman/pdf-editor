import JSZip from "jszip";
import { loadPdfDocument } from "./pdf-loader";

export interface PptxSlide {
  pageNumber: number;
  imageDataUrl: string;
  width: number;
  height: number;
  textItems: PptxTextItem[];
}

export interface PptxTextItem {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize: number; // OOXML sz value (hundredths of a point, e.g. 2400 = 24pt)
  bold: boolean;
  fontFamily: string;
  colorHex?: string;
}

export interface PptxRun {
  text: string;
  fontSize: number;
  bold: boolean;
  fontFamily: string;
  colorHex: string;
}

export interface PptxLineBox {
  id: number;
  x: number; // EMU
  y: number; // EMU
  w: number; // EMU
  h: number; // EMU
  runs: PptxRun[];
}

export interface PdfPptxConversionResult {
  pptxBlob: Blob;
  totalSlides: number;
  slides: PptxSlide[];
}

const PT_TO_EMU = 12700;
const RENDER_SCALE = 2.5;

// ── Color Extraction from Rendered Canvas ───────────────────────────────────

function extractTextColor(
  ctx: CanvasRenderingContext2D,
  scale: number,
  xPt: number,
  yPt: number,
  wPt: number,
  hPt: number,
  defaultColor = "1E293B"
): string {
  try {
    const x = Math.max(0, Math.floor(xPt * scale));
    const y = Math.max(0, Math.floor(yPt * scale));
    const w = Math.max(2, Math.ceil(wPt * scale));
    const h = Math.max(2, Math.ceil(hPt * scale));

    if (x >= ctx.canvas.width || y >= ctx.canvas.height) return defaultColor;
    const sampleW = Math.min(w, ctx.canvas.width - x);
    const sampleH = Math.min(h, ctx.canvas.height - y);
    if (sampleW <= 0 || sampleH <= 0) return defaultColor;

    const imgData = ctx.getImageData(x, y, sampleW, sampleH).data;

    // Estimate background color from outer border samples
    const bgR = imgData[0] ?? 255;
    const bgG = imgData[1] ?? 255;
    const bgB = imgData[2] ?? 255;

    let maxContrast = 0;
    let bestHex = "";

    // Sample pixels across the text bounding box to find the glyph color
    const step = Math.max(1, Math.floor((sampleW * sampleH) / 150));
    for (let i = 0; i < imgData.length; i += step * 4) {
      const alpha = imgData[i + 3] ?? 0;
      if (alpha < 128) continue;
      const r = imgData[i]!;
      const g = imgData[i + 1]!;
      const b = imgData[i + 2]!;

      const contrast = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
      if (contrast > maxContrast) {
        maxContrast = contrast;
        bestHex = [r, g, b]
          .map((c) => c.toString(16).padStart(2, "0"))
          .join("")
          .toUpperCase();
      }
    }

    if (maxContrast > 35 && bestHex) {
      return bestHex;
    }

    // High luminance background (light) -> dark text
    if (bgR + bgG + bgB > 450) {
      return "0F172A";
    }
    // Low luminance background (dark) -> white text
    return "FFFFFF";
  } catch {
    return defaultColor;
  }
}

// ── Text Eraser for PPTX Background Canvas ──────────────────────────────────

function eraseTextFromCanvas(
  ctx: CanvasRenderingContext2D,
  scale: number,
  lineBoxes: PptxLineBox[],
  rawItems: { xPt: number; yPt: number; wPt: number; hPt: number }[]
) {
  const canvasW = ctx.canvas.width;
  const canvasH = ctx.canvas.height;

  const boxesToErase: { x: number; y: number; w: number; h: number }[] = [];

  for (const item of rawItems) {
    const padX = Math.round(5 * scale);
    const padY = Math.round(4 * scale);
    const x = Math.max(0, Math.floor(item.xPt * scale) - padX);
    const y = Math.max(0, Math.floor(item.yPt * scale) - padY);
    const w = Math.min(canvasW - x, Math.ceil(item.wPt * scale) + padX * 2);
    const h = Math.min(canvasH - y, Math.ceil(item.hPt * scale) + padY * 2);
    if (w > 0 && h > 0) {
      boxesToErase.push({ x, y, w, h });
    }
  }

  for (const box of lineBoxes) {
    const padX = Math.round(5 * scale);
    const padY = Math.round(4 * scale);
    const xPt = box.x / PT_TO_EMU;
    const yPt = box.y / PT_TO_EMU;
    const wPt = box.w / PT_TO_EMU;
    const hPt = box.h / PT_TO_EMU;
    const x = Math.max(0, Math.floor(xPt * scale) - padX);
    const y = Math.max(0, Math.floor(yPt * scale) - padY);
    const w = Math.min(canvasW - x, Math.ceil(wPt * scale) + padX * 2);
    const h = Math.min(canvasH - y, Math.ceil(hPt * scale) + padY * 2);
    if (w > 0 && h > 0) {
      boxesToErase.push({ x, y, w, h });
    }
  }

  for (const box of boxesToErase) {
    const samples = [
      { sx: Math.max(0, box.x - 3), sy: Math.max(0, box.y - 3) },
      { sx: Math.min(canvasW - 1, box.x + box.w + 3), sy: Math.max(0, box.y - 3) },
      { sx: Math.max(0, box.x - 3), sy: Math.min(canvasH - 1, box.y + box.h + 3) },
      { sx: Math.min(canvasW - 1, box.x + box.w + 3), sy: Math.min(canvasH - 1, box.y + box.h + 3) },
      { sx: Math.min(canvasW - 1, Math.floor(box.x + box.w / 2)), sy: Math.max(0, box.y - 4) },
      { sx: Math.min(canvasW - 1, Math.floor(box.x + box.w / 2)), sy: Math.min(canvasH - 1, box.y + box.h + 4) },
      { sx: Math.max(0, box.x - 4), sy: Math.min(canvasH - 1, Math.floor(box.y + box.h / 2)) },
      { sx: Math.min(canvasW - 1, box.x + box.w + 4), sy: Math.min(canvasH - 1, box.y + box.h / 2) },
    ];

    const colorCounts: Record<string, number> = {};
    let dominantColor = "rgb(255, 255, 255)";
    let maxCount = 0;

    for (const s of samples) {
      try {
        const p = ctx.getImageData(s.sx, s.sy, 1, 1).data;
        const alpha = p[3] ?? 0;
        if (alpha > 64) {
          const r = p[0] ?? 255;
          const g = p[1] ?? 255;
          const b = p[2] ?? 255;
          const col = `rgb(${r}, ${g}, ${b})`;
          colorCounts[col] = (colorCounts[col] || 0) + 1;
          if ((colorCounts[col] || 0) > maxCount) {
            maxCount = colorCounts[col] || 0;
            dominantColor = col;
          }
        }
      } catch {
        // ignore
      }
    }

    ctx.fillStyle = dominantColor;
    ctx.fillRect(box.x, box.y, box.w, box.h);
  }
}

// ── Slide Background Rendering (Text Suppressed) ────────────────────────────

interface RenderedSlideData {
  fullDataUrl: string;
  bgDataUrl: string;
  widthPx: number;
  heightPx: number;
  widthPt: number;
  heightPt: number;
  lineBoxes: PptxLineBox[];
  textItems: PptxTextItem[];
}

async function renderSlideData(
  pdfDoc: import("pdfjs-dist").PDFDocumentProxy,
  pageNum: number,
  scale = RENDER_SCALE
): Promise<RenderedSlideData> {
  const page = await pdfDoc.getPage(pageNum);
  const naturalVp = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale });

  // 1. Render FULL page (with text) to sample colors and provide crisp preview
  const canvasFull = document.createElement("canvas");
  canvasFull.width = Math.round(viewport.width);
  canvasFull.height = Math.round(viewport.height);
  const ctxFull = canvasFull.getContext("2d")!;
  ctxFull.fillStyle = "#ffffff";
  ctxFull.fillRect(0, 0, canvasFull.width, canvasFull.height);
  await (page.render as any)({ canvasContext: ctxFull, viewport, canvas: canvasFull }).promise;

  // 2. Extract text items & sample true font colors
  const tc = await page.getTextContent();
  const rawItems: {
    str: string;
    xPt: number;
    yPt: number;
    wPt: number;
    hPt: number;
    fontSize: number;
    bold: boolean;
    fontFamily: string;
    colorHex: string;
  }[] = [];

  for (const raw of tc.items as any[]) {
    const str: string = (raw.str ?? "") as string;
    if (!str.trim()) continue;

    const tx: number = (raw.transform?.[4] as number) ?? 0;
    const ty: number = (raw.transform?.[5] as number) ?? 0;

    const fontHeightPt = Math.max(
      6,
      Math.abs((raw.height as number) || 0) ||
      Math.abs((raw.transform?.[3] as number) || 0) ||
      Math.abs((raw.transform?.[0] as number) || 0) ||
      12
    );

    const textWidthPt = Math.max(12, (raw.width as number) || (str.length * fontHeightPt * 0.52));

    // Flip Y from bottom-origin PDF to top-origin PPTX
    const xPt = tx;
    const yPt = Math.max(0, naturalVp.height - ty - fontHeightPt * 0.88);

    const fontName: string = ((raw.fontName ?? "") as string).toLowerCase();
    const isBold = /bold|black|heavy|demi|semibold/i.test(fontName);

    let fontFamily = "Calibri";
    if (/times|georgia|garamond|palatino/i.test(fontName) && !/sans/i.test(fontName)) {
      fontFamily = "Times New Roman";
    } else if (/courier|mono|consolas|typewriter/i.test(fontName)) {
      fontFamily = "Consolas";
    } else if (/arial|helvetica|inter|roboto/i.test(fontName)) {
      fontFamily = "Arial";
    }

    const szHundredths = Math.max(600, Math.round(fontHeightPt * 100));
    const colorHex = extractTextColor(ctxFull, scale, xPt, yPt, textWidthPt, fontHeightPt);

    rawItems.push({
      str,
      xPt,
      yPt,
      wPt: textWidthPt,
      hPt: fontHeightPt,
      fontSize: szHundredths,
      bold: isBold,
      fontFamily,
      colorHex,
    });
  }

  // Group raw items into cohesive lines/paragraphs
  interface RawLineGroup {
    yPt: number;
    items: typeof rawItems;
  }

  const lineGroups: RawLineGroup[] = [];
  for (const it of rawItems) {
    const existing = lineGroups.find((g) => Math.abs(g.yPt - it.yPt) <= 4.0);
    if (existing) {
      existing.items.push(it);
    } else {
      lineGroups.push({ yPt: it.yPt, items: [it] });
    }
  }

  // Sort top-to-bottom
  lineGroups.sort((a, b) => a.yPt - b.yPt);

  const lineBoxes: PptxLineBox[] = [];
  let boxId = 100;

  for (const group of lineGroups) {
    // Sort items left-to-right
    group.items.sort((a, b) => a.xPt - b.xPt);

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    const runs: PptxRun[] = [];

    for (const it of group.items) {
      if (it.xPt < minX) minX = it.xPt;
      if (it.xPt + it.wPt > maxX) maxX = it.xPt + it.wPt;
      if (it.yPt < minY) minY = it.yPt;
      if (it.yPt + it.hPt > maxY) maxY = it.yPt + it.hPt;

      const lastRun = runs[runs.length - 1];
      if (
        lastRun &&
        lastRun.fontFamily === it.fontFamily &&
        Math.abs(lastRun.fontSize - it.fontSize) < 80 &&
        lastRun.bold === it.bold &&
        lastRun.colorHex === it.colorHex
      ) {
        lastRun.text += (lastRun.text.endsWith(" ") ? "" : " ") + it.str;
      } else {
        runs.push({
          text: it.str,
          fontSize: it.fontSize,
          bold: it.bold,
          fontFamily: it.fontFamily,
          colorHex: it.colorHex,
        });
      }
    }

    const boxWidthPt = Math.max(maxX - minX, 30);
    const boxHeightPt = Math.max(maxY - minY, 14);

    lineBoxes.push({
      id: boxId++,
      x: Math.round(minX * PT_TO_EMU),
      y: Math.round(minY * PT_TO_EMU),
      w: Math.round(boxWidthPt * PT_TO_EMU),
      h: Math.round(boxHeightPt * PT_TO_EMU),
      runs,
    });
  }

  // 3. Render BACKGROUND canvas and cleanly ERASE all text regions
  // This guarantees that the background image in the PPTX has ZERO text baked in,
  // preventing any double-text overlay with the PowerPoint editable text boxes.
  const canvasBg = document.createElement("canvas");
  canvasBg.width = canvasFull.width;
  canvasBg.height = canvasFull.height;
  const ctxBg = canvasBg.getContext("2d")!;
  ctxBg.fillStyle = "#ffffff";
  ctxBg.fillRect(0, 0, canvasBg.width, canvasBg.height);

  try {
    const opList = await page.getOperatorList();
    const textOpSet = new Set([44, 45, 46, 47]);

    await (page.render as any)({
      canvasContext: ctxBg,
      viewport,
      canvas: canvasBg,
      operationsFilter: (opIdx: number) => {
        const fn = opList.fnArray[opIdx];
        if (fn !== undefined && textOpSet.has(fn)) {
          return false;
        }
        return true;
      },
    }).promise;
  } catch (err) {
    console.warn("[pdf-to-pptx] Filtered render notice, copying full canvas:", err);
    ctxBg.drawImage(canvasFull, 0, 0);
  }

  // Guaranteed text erasure: Wipe every text bounding box on the background canvas
  // with its local background color so no duplicate glyphs can ever remain.
  eraseTextFromCanvas(ctxBg, scale, lineBoxes, rawItems);

  const pptxTextItems: PptxTextItem[] = rawItems.map((r) => ({
    text: r.str,
    x: Math.round(r.xPt * PT_TO_EMU),
    y: Math.round(r.yPt * PT_TO_EMU),
    w: Math.round(r.wPt * PT_TO_EMU),
    h: Math.round(r.hPt * PT_TO_EMU),
    fontSize: r.fontSize,
    bold: r.bold,
    fontFamily: r.fontFamily,
    colorHex: r.colorHex,
  }));

  return {
    fullDataUrl: canvasFull.toDataURL("image/png"),
    bgDataUrl: canvasBg.toDataURL("image/png"),
    widthPx: canvasBg.width,
    heightPx: canvasBg.height,
    widthPt: naturalVp.width,
    heightPt: naturalVp.height,
    lineBoxes,
    textItems: pptxTextItems,
  };
}

// ── XML helpers ──────────────────────────────────────────────────────────────

function stripDataUrlPrefix(dataUrl: string): string {
  return dataUrl.split(",")[1] ?? "";
}

function relsXml(id: string, type: string, target: string): string {
  return `<Relationship Id="${id}" Type="${type}" Target="${target}"/>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

// ── Slide XML builder ────────────────────────────────────────────────────────

function buildSlideXml(
  slideWidthEmu: number,
  slideHeightEmu: number,
  lineBoxes: PptxLineBox[]
): string {
  // Build native PowerPoint text boxes with true visible colors and formatting
  const txBodies = lineBoxes
    .map((box) => {
      const runsXml = box.runs
        .map(
          (r) => `
          <a:r>
            <a:rPr lang="en-US" sz="${r.fontSize}" ${r.bold ? 'b="1"' : 'b="0"'} dirty="0" smtClean="0">
              <a:solidFill><a:srgbClr val="${r.colorHex || "000000"}"/></a:solidFill>
              <a:latin typeface="${r.fontFamily}" pitchFamily="34" charset="0"/>
            </a:rPr>
            <a:t>${escapeXml(r.text)}</a:t>
          </a:r>`
        )
        .join("");

      return `
    <p:sp>
      <p:nvSpPr>
        <p:cNvPr id="${box.id}" name="TextBox${box.id}"/>
        <p:cNvSpPr txBox="1"><a:spLocks noGrp="1"/></p:cNvSpPr>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm>
          <a:off x="${box.x}" y="${box.y}"/>
          <a:ext cx="${Math.max(box.w, 457200)}" cy="${Math.max(box.h, 182880)}"/>
        </a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:noFill/>
        <a:ln><a:noFill/></a:ln>
      </p:spPr>
      <p:txBody>
        <a:bodyPr wrap="none" lIns="0" rIns="0" tIns="0" bIns="0" anchor="t">
          <a:spAutoFit/>
        </a:bodyPr>
        <a:lstStyle/>
        <a:p>
          <a:pPr marL="0" marR="0" indent="0"/>
          ${runsXml}
        </a:p>
      </p:txBody>
    </p:sp>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:blipFill dpi="0" rotWithShape="1">
          <a:blip r:embed="rId1"/>
          <a:stretch><a:fillRect/></a:stretch>
        </a:blipFill>
        <a:effectLst/>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr><a:grpSpLocks noGrp="1"/></p:cNvGrpSpPr>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="${slideWidthEmu}" cy="${slideHeightEmu}"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="${slideWidthEmu}" cy="${slideHeightEmu}"/>
        </a:xfrm>
      </p:grpSpPr>
      ${txBodies}
    </p:spTree>
  </p:cSld>
</p:sld>`;
}

// ── Main conversion ──────────────────────────────────────────────────────────

export async function convertPdfToPptx(
  buffer: ArrayBuffer,
  onProgress?: (current: number, total: number) => void
): Promise<PdfPptxConversionResult> {
  const pdfDoc = await loadPdfDocument(buffer.slice(0));
  const totalPages = pdfDoc.numPages;
  const slides: PptxSlide[] = [];
  const zip = new JSZip();

  const firstPage = await pdfDoc.getPage(1);
  const firstVp = firstPage.getViewport({ scale: 1 });
  const presWidthEmu = Math.round(firstVp.width * PT_TO_EMU);
  const presHeightEmu = Math.round(firstVp.height * PT_TO_EMU);
  const slideEntries: { id: number; rId: string }[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onProgress?.(pageNum, totalPages);

    const rendered = await renderSlideData(pdfDoc, pageNum);
    const slideWidthEmu = Math.round(rendered.widthPt * PT_TO_EMU);
    const slideHeightEmu = Math.round(rendered.heightPt * PT_TO_EMU);

    slides.push({
      pageNumber: pageNum,
      imageDataUrl: rendered.fullDataUrl,
      width: rendered.widthPt,
      height: rendered.heightPt,
      textItems: rendered.textItems,
    });

    // Save clean background image (no text baked in) into PPTX media
    zip.file(`ppt/media/slide${pageNum}.png`, stripDataUrlPrefix(rendered.bgDataUrl), { base64: true });
    // Build slide XML with real editable, visible text boxes
    zip.file(`ppt/slides/slide${pageNum}.xml`, buildSlideXml(slideWidthEmu, slideHeightEmu, rendered.lineBoxes));
    zip.file(
      `ppt/slides/_rels/slide${pageNum}.xml.rels`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${relsXml("rId1", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image", `../media/slide${pageNum}.png`)}
  ${relsXml("rId2", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout", "../slideLayouts/slideLayout1.xml")}
</Relationships>`
    );
    slideEntries.push({ id: pageNum, rId: `rId${pageNum + 2}` });
  }

  // ── [Content_Types].xml ────────────────────────────────────────────────────
  const slideOverrides = slides
    .map(
      (s) =>
        `<Override PartName="/ppt/slides/slide${s.pageNumber}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
    )
    .join("\n  ");

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  ${slideOverrides}
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/package/2006/metadata/core-properties+xml"/>
</Types>`
  );

  // ── _rels/.rels ────────────────────────────────────────────────────────────
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`
  );

  // ── docProps ───────────────────────────────────────────────────────────────
  zip.file(
    "docProps/app.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>WebToolOcean PDF Studio</Application>
  <Slides>${totalPages}</Slides>
</Properties>`
  );

  zip.file(
    "docProps/core.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>WebToolOcean PDF Studio</dc:creator>
  <cp:lastModifiedBy>WebToolOcean PDF Studio</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:modified>
</cp:coreProperties>`
  );

  // ── ppt/presentation.xml ───────────────────────────────────────────────────
  const sldIds = slides
    .map((s) => `<p:sldId id="${256 + s.pageNumber}" r:id="${slideEntries[s.pageNumber - 1]!.rId}"/>`)
    .join("\n    ");

  zip.file(
    "ppt/presentation.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" saveSubsetFonts="1">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>
    ${sldIds}
  </p:sldIdLst>
  <p:sldSz cx="${presWidthEmu}" cy="${presHeightEmu}" type="custom"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`
  );

  // ── ppt/_rels/presentation.xml.rels ───────────────────────────────────────
  const presSlideRels = slides
    .map((s) =>
      relsXml(
        slideEntries[s.pageNumber - 1]!.rId,
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide",
        `slides/slide${s.pageNumber}.xml`
      )
    )
    .join("\n  ");

  zip.file(
    "ppt/_rels/presentation.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${relsXml("rId1", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster", "slideMasters/slideMaster1.xml")}
  ${presSlideRels}
</Relationships>`
  );

  // ── Slide Master ───────────────────────────────────────────────────────────
  zip.file(
    "ppt/slideMasters/slideMaster1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg>
  <p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr><a:grpSpLocks noGrp="1"/></p:cNvGrpSpPr><p:nvPr/></p:nvGrpSpPr>
  <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`
  );

  zip.file(
    "ppt/slideMasters/_rels/slideMaster1.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${relsXml("rId1", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout", "../slideLayouts/slideLayout1.xml")}
</Relationships>`
  );

  // ── Slide Layout ───────────────────────────────────────────────────────────
  zip.file(
    "ppt/slideLayouts/slideLayout1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr><a:grpSpLocks noGrp="1"/></p:cNvGrpSpPr><p:nvPr/></p:nvGrpSpPr>
  <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
</p:sldLayout>`
  );

  zip.file(
    "ppt/slideLayouts/_rels/slideLayout1.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${relsXml("rId1", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster", "../slideMasters/slideMaster1.xml")}
</Relationships>`
  );

  // ── Generate final PPTX blob ───────────────────────────────────────────────
  const pptxBlob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return { pptxBlob, totalSlides: totalPages, slides };
}

// ── Image conversion (for PDF → JPG/PNG pages) ──────────────────────────────

export async function convertPdfToImages(
  buffer: ArrayBuffer,
  format: "jpeg" | "png",
  quality = 0.95,
  scale = RENDER_SCALE,
  onProgress?: (current: number, total: number) => void
): Promise<{ pageNumber: number; dataUrl: string; widthPx: number; heightPx: number }[]> {
  const pdfDoc = await loadPdfDocument(buffer.slice(0));
  const totalPages = pdfDoc.numPages;
  const results: { pageNumber: number; dataUrl: string; widthPx: number; heightPx: number }[] = [];
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onProgress?.(pageNum, totalPages);
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise;
    const dataUrl =
      format === "png"
        ? canvas.toDataURL("image/png")
        : canvas.toDataURL("image/jpeg", quality);
    results.push({ pageNumber: pageNum, dataUrl, widthPx: canvas.width, heightPx: canvas.height });
  }
  return results;
}
