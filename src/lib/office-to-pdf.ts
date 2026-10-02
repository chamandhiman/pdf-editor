import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import JSZip from "jszip";

export interface WordToPdfResult {
  bytes: Uint8Array;
  pageCount: number;
  fileName: string;
  paragraphCount: number;
}

export interface ExcelToPdfResult {
  bytes: Uint8Array;
  pageCount: number;
  sheetCount: number;
  rowCount: number;
  fileName: string;
}

export interface PptToPdfResult {
  bytes: Uint8Array;
  pageCount: number;
  slideCount: number;
  fileName: string;
}

/**
 * Wraps text into lines that do not exceed maxWidth points
 */
function wrapText(text: string, maxWidth: number, fontSize: number, font: any): string[] {
  if (!text) return [""];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (!word) continue;
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    let width = 0;
    try {
      width = font.widthOfTextAtSize(testLine, fontSize);
    } catch {
      // Fallback approximation for characters font might lack
      width = testLine.length * fontSize * 0.55;
    }

    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [text];
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. WORD TO PDF CONVERSION
// ─────────────────────────────────────────────────────────────────────────────

interface ParsedWordElement {
  type: "heading" | "paragraph" | "bullet" | "table";
  text?: string;
  level?: number;
  bold?: boolean;
  italic?: boolean;
  tableData?: string[][];
}

export async function convertWordToPdf(
  buffer: ArrayBuffer,
  fileName = "Document.docx",
  onProgress?: (progress: number, message: string) => void
): Promise<WordToPdfResult> {
  onProgress?.(10, "Extracting DOCX structure...");
  const zip = await JSZip.loadAsync(buffer);

  const docXmlFile = zip.file("word/document.xml");
  if (!docXmlFile) {
    throw new Error("Invalid Word document: word/document.xml not found inside DOCX package.");
  }

  onProgress?.(30, "Parsing document paragraphs and styles...");
  const docXmlText = await docXmlFile.async("text");
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(docXmlText, "application/xml");

  const elements: ParsedWordElement[] = [];

  // Traverse body children (paragraphs and tables)
  const body = xmlDoc.getElementsByTagName("w:body")[0];
  if (!body) {
    throw new Error("Invalid Word document structure: no body element found.");
  }

  const childNodes = Array.from(body.childNodes);
  for (const node of childNodes) {
    const nodeName = node.nodeName;

    if (nodeName === "w:p") {
      // Paragraph
      const p = node as Element;
      const pStyle = p.getElementsByTagName("w:pStyle")[0]?.getAttribute("w:val") || "";
      const isBullet = !!p.getElementsByTagName("w:numPr")[0];

      // Extract text runs
      let pText = "";
      let isBold = false;
      let isItalic = false;

      const runs = Array.from(p.getElementsByTagName("w:r"));
      for (const r of runs) {
        const textElements = Array.from(r.getElementsByTagName("w:t"));
        for (const t of textElements) {
          pText += t.textContent || "";
        }
        if (r.getElementsByTagName("w:b").length > 0) isBold = true;
        if (r.getElementsByTagName("w:i").length > 0) isItalic = true;
      }

      pText = pText.trim();
      if (!pText) continue;

      if (pStyle.toLowerCase().includes("heading1") || pStyle.toLowerCase().includes("title")) {
        elements.push({ type: "heading", text: pText, level: 1, bold: true });
      } else if (pStyle.toLowerCase().includes("heading2")) {
        elements.push({ type: "heading", text: pText, level: 2, bold: true });
      } else if (pStyle.toLowerCase().includes("heading3")) {
        elements.push({ type: "heading", text: pText, level: 3, bold: true });
      } else if (isBullet) {
        elements.push({ type: "bullet", text: pText, bold: isBold, italic: isItalic });
      } else {
        elements.push({ type: "paragraph", text: pText, bold: isBold, italic: isItalic });
      }
    } else if (nodeName === "w:tbl") {
      // Table
      const tbl = node as Element;
      const rows = Array.from(tbl.getElementsByTagName("w:tr"));
      const tableData: string[][] = [];

      for (const tr of rows) {
        const rowCells: string[] = [];
        const cells = Array.from(tr.getElementsByTagName("w:tc"));
        for (const tc of cells) {
          let cellText = "";
          const pList = Array.from(tc.getElementsByTagName("w:p"));
          for (const cp of pList) {
            const texts = Array.from(cp.getElementsByTagName("w:t"));
            const str = texts.map((t) => t.textContent || "").join(" ").trim();
            if (str) cellText += (cellText ? " " : "") + str;
          }
          rowCells.push(cellText);
        }
        if (rowCells.some((c) => c.length > 0)) {
          tableData.push(rowCells);
        }
      }

      if (tableData.length > 0) {
        elements.push({ type: "table", tableData });
      }
    }
  }

  onProgress?.(60, "Building PDF layout and typography...");
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const PAGE_WIDTH = 595.28; // A4
  const PAGE_HEIGHT = 841.89;
  const MARGIN_LEFT = 50;
  const MARGIN_RIGHT = 50;
  const MARGIN_TOP = 55;
  const MARGIN_BOTTOM = 55;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

  let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let cursorY = PAGE_HEIGHT - MARGIN_TOP;

  const addNewPage = () => {
    currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    cursorY = PAGE_HEIGHT - MARGIN_TOP;
  };

  const sanitizeForFont = (str: string) => {
    // Standard 14 PDF fonts only support WinAnsiEncoding / ASCII
    return str.replace(/[^\x20-\x7E\xA0-\xFF]/g, " ");
  };

  for (const elem of elements) {
    if (elem.type === "heading") {
      const fontSize = elem.level === 1 ? 20 : elem.level === 2 ? 15 : 13;
      const lineHeight = fontSize + 6;
      const spaceBefore = elem.level === 1 ? 16 : 12;
      const spaceAfter = 8;

      if (cursorY - spaceBefore - lineHeight < MARGIN_BOTTOM) {
        addNewPage();
      } else {
        cursorY -= spaceBefore;
      }

      const cleanText = sanitizeForFont(elem.text || "");
      const lines = wrapText(cleanText, CONTENT_WIDTH, fontSize, fontBold);

      for (const line of lines) {
        if (cursorY - lineHeight < MARGIN_BOTTOM) addNewPage();
        currentPage.drawText(line, {
          x: MARGIN_LEFT,
          y: cursorY - fontSize,
          size: fontSize,
          font: fontBold,
          color: elem.level === 1 ? rgb(0.12, 0.16, 0.24) : rgb(0.2, 0.25, 0.35),
        });
        cursorY -= lineHeight;
      }
      cursorY -= spaceAfter;
    } else if (elem.type === "bullet") {
      const fontSize = 10.5;
      const lineHeight = 15;
      const bulletIndent = 16;
      const textWidth = CONTENT_WIDTH - bulletIndent;

      const cleanText = sanitizeForFont(elem.text || "");
      const font = elem.bold ? fontBold : elem.italic ? fontItalic : fontRegular;
      const lines = wrapText(cleanText, textWidth, fontSize, font);

      if (cursorY - lineHeight < MARGIN_BOTTOM) addNewPage();

      // Draw bullet point dot
      currentPage.drawCircle({
        x: MARGIN_LEFT + 5,
        y: cursorY - fontSize * 0.65,
        size: 2,
        color: rgb(0.85, 0.2, 0.18),
      });

      for (let i = 0; i < lines.length; i++) {
        if (cursorY - lineHeight < MARGIN_BOTTOM) addNewPage();
        currentPage.drawText(lines[i] || "", {
          x: MARGIN_LEFT + bulletIndent,
          y: cursorY - fontSize,
          size: fontSize,
          font,
          color: rgb(0.15, 0.18, 0.22),
        });
        cursorY -= lineHeight;
      }
      cursorY -= 4;
    } else if (elem.type === "paragraph") {
      const fontSize = 10.5;
      const lineHeight = 15;
      const cleanText = sanitizeForFont(elem.text || "");
      const font = elem.bold ? fontBold : elem.italic ? fontItalic : fontRegular;
      const lines = wrapText(cleanText, CONTENT_WIDTH, fontSize, font);

      for (const line of lines) {
        if (cursorY - lineHeight < MARGIN_BOTTOM) addNewPage();
        currentPage.drawText(line, {
          x: MARGIN_LEFT,
          y: cursorY - fontSize,
          size: fontSize,
          font,
          color: rgb(0.15, 0.18, 0.22),
        });
        cursorY -= lineHeight;
      }
      cursorY -= 6; // paragraph spacing
    } else if (elem.type === "table" && elem.tableData && elem.tableData.length > 0) {
      const rows = elem.tableData;
      const maxCols = Math.max(...rows.map((r) => r.length), 1);
      const colWidth = CONTENT_WIDTH / maxCols;
      const cellPadding = 6;
      const rowHeight = 22;

      cursorY -= 8;

      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const row = rows[rIdx] || [];
        if (cursorY - rowHeight < MARGIN_BOTTOM) addNewPage();

        const isHeader = rIdx === 0;

        // Background fill for header or alternating rows
        if (isHeader) {
          currentPage.drawRectangle({
            x: MARGIN_LEFT,
            y: cursorY - rowHeight,
            width: CONTENT_WIDTH,
            height: rowHeight,
            color: rgb(0.94, 0.96, 0.98),
          });
        } else if (rIdx % 2 === 1) {
          currentPage.drawRectangle({
            x: MARGIN_LEFT,
            y: cursorY - rowHeight,
            width: CONTENT_WIDTH,
            height: rowHeight,
            color: rgb(0.98, 0.99, 1.0),
          });
        }

        // Draw row bottom border
        currentPage.drawLine({
          start: { x: MARGIN_LEFT, y: cursorY - rowHeight },
          end: { x: MARGIN_LEFT + CONTENT_WIDTH, y: cursorY - rowHeight },
          thickness: 0.5,
          color: rgb(0.85, 0.88, 0.92),
        });

        for (let cIdx = 0; cIdx < maxCols; cIdx++) {
          const rawCell = row[cIdx] || "";
          const cleanCell = sanitizeForFont(rawCell);
          const cellFont = isHeader ? fontBold : fontRegular;
          const fontSize = isHeader ? 9.5 : 9;

          // Clip cell text if too long
          let displayText = cleanCell;
          try {
            while (displayText.length > 0 && cellFont.widthOfTextAtSize(displayText, fontSize) > colWidth - cellPadding * 2) {
              displayText = displayText.slice(0, -1);
            }
            if (displayText !== cleanCell && displayText.length > 3) {
              displayText = displayText.slice(0, -3) + "...";
            }
          } catch {
            displayText = cleanCell.slice(0, Math.floor(colWidth / 7));
          }

          currentPage.drawText(displayText, {
            x: MARGIN_LEFT + cIdx * colWidth + cellPadding,
            y: cursorY - rowHeight + 6,
            size: fontSize,
            font: cellFont,
            color: isHeader ? rgb(0.1, 0.15, 0.25) : rgb(0.2, 0.24, 0.3),
          });
        }

        cursorY -= rowHeight;
      }
      cursorY -= 10;
    }
  }

  onProgress?.(90, "Finalizing PDF output...");
  const pdfBytes = await pdfDoc.save();

  return {
    bytes: pdfBytes,
    pageCount: pdfDoc.getPageCount(),
    fileName: fileName.replace(/\.docx?$/i, "") + ".pdf",
    paragraphCount: elements.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. EXCEL TO PDF CONVERSION
// ─────────────────────────────────────────────────────────────────────────────

export async function convertExcelToPdf(
  buffer: ArrayBuffer,
  fileName = "Spreadsheet.xlsx",
  onProgress?: (progress: number, message: string) => void
): Promise<ExcelToPdfResult> {
  onProgress?.(15, "Opening Excel workbook package...");
  const zip = await JSZip.loadAsync(buffer);

  // 1. Read shared strings
  onProgress?.(30, "Reading shared strings...");
  const sharedStrings: string[] = [];
  const sstFile = zip.file("xl/sharedStrings.xml");
  if (sstFile) {
    const sstXml = await sstFile.async("text");
    const parser = new DOMParser();
    const doc = parser.parseFromString(sstXml, "application/xml");
    const siList = Array.from(doc.getElementsByTagName("si"));
    for (const si of siList) {
      const texts = Array.from(si.getElementsByTagName("t"));
      sharedStrings.push(texts.map((t) => t.textContent || "").join(""));
    }
  }

  // 2. Read sheet1
  onProgress?.(50, "Extracting rows and cells...");
  const sheetFile = zip.file("xl/worksheets/sheet1.xml") || zip.file("xl/worksheets/sheet.xml");
  if (!sheetFile) {
    throw new Error("Invalid Excel file: No worksheet xml found inside XLSX package.");
  }

  const sheetXml = await sheetFile.async("text");
  const parser = new DOMParser();
  const sheetDoc = parser.parseFromString(sheetXml, "application/xml");

  const rowElements = Array.from(sheetDoc.getElementsByTagName("row"));
  const grid: string[][] = [];

  for (const rowElem of rowElements) {
    const rIdxAttr = rowElem.getAttribute("r");
    const rIdx = rIdxAttr ? parseInt(rIdxAttr, 10) - 1 : grid.length;

    while (grid.length <= rIdx) {
      grid.push([]);
    }

    const row = grid[rIdx] || [];
    const cellElements = Array.from(rowElem.getElementsByTagName("c"));

    for (const c of cellElements) {
      const rRef = c.getAttribute("r") || "";
      const colLetter = rRef.replace(/[0-9]/g, "");
      let colIdx = 0;
      for (let i = 0; i < colLetter.length; i++) {
        colIdx = colIdx * 26 + (colLetter.charCodeAt(i) - 64);
      }
      colIdx = Math.max(0, colIdx - 1);

      while (row.length <= colIdx) {
        row.push("");
      }

      const cellType = c.getAttribute("t");
      const valElem = c.getElementsByTagName("v")[0];
      const inlineElem = c.getElementsByTagName("t")[0];

      let cellValue = "";
      if (inlineElem) {
        cellValue = inlineElem.textContent || "";
      } else if (valElem) {
        const rawVal = valElem.textContent || "";
        if (cellType === "s") {
          const sIdx = parseInt(rawVal, 10);
          cellValue = sharedStrings[sIdx] || "";
        } else if (cellType === "b") {
          cellValue = rawVal === "1" ? "TRUE" : "FALSE";
        } else {
          cellValue = rawVal;
        }
      }

      row[colIdx] = cellValue.trim();
    }
  }

  // Filter empty rows
  const cleanRows = grid.filter((r) => r.some((c) => c && c.length > 0));
  if (cleanRows.length === 0) {
    throw new Error("The Excel worksheet contains no readable data.");
  }

  onProgress?.(70, "Compiling PDF landscape spreadsheet table...");
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Landscape A4 for wide table visibility
  const PAGE_WIDTH = 841.89;
  const PAGE_HEIGHT = 595.28;
  const MARGIN_LEFT = 40;
  const MARGIN_RIGHT = 40;
  const MARGIN_TOP = 50;
  const MARGIN_BOTTOM = 45;
  const TABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

  const maxColumns = Math.min(Math.max(...cleanRows.map((r) => r.length), 1), 12);
  const colWidth = TABLE_WIDTH / maxColumns;
  const rowHeight = 20;

  let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let cursorY = PAGE_HEIGHT - MARGIN_TOP;

  const drawHeaderBanner = (page: any) => {
    // Sheet header title
    page.drawText(fileName.replace(/\.xlsx?$/i, ""), {
      x: MARGIN_LEFT,
      y: PAGE_HEIGHT - 32,
      size: 14,
      font: fontBold,
      color: rgb(0.1, 0.45, 0.25), // Emerald Excel green
    });

    page.drawText("WebToolOcean PDF Studio — Excel to PDF Export", {
      x: PAGE_WIDTH - MARGIN_RIGHT - 240,
      y: PAGE_HEIGHT - 32,
      size: 9,
      font: fontRegular,
      color: rgb(0.5, 0.55, 0.6),
    });
  };

  drawHeaderBanner(currentPage);

  for (let rIdx = 0; rIdx < cleanRows.length; rIdx++) {
    const row = cleanRows[rIdx] || [];

    if (cursorY - rowHeight < MARGIN_BOTTOM) {
      currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      drawHeaderBanner(currentPage);
      cursorY = PAGE_HEIGHT - MARGIN_TOP;
    }

    const isHeaderRow = rIdx === 0;

    // Row Background fill
    if (isHeaderRow) {
      currentPage.drawRectangle({
        x: MARGIN_LEFT,
        y: cursorY - rowHeight,
        width: TABLE_WIDTH,
        height: rowHeight,
        color: rgb(0.12, 0.45, 0.25), // Deep Excel Green
      });
    } else if (rIdx % 2 === 1) {
      currentPage.drawRectangle({
        x: MARGIN_LEFT,
        y: cursorY - rowHeight,
        width: TABLE_WIDTH,
        height: rowHeight,
        color: rgb(0.97, 0.98, 0.99),
      });
    }

    // Border
    currentPage.drawLine({
      start: { x: MARGIN_LEFT, y: cursorY - rowHeight },
      end: { x: MARGIN_LEFT + TABLE_WIDTH, y: cursorY - rowHeight },
      thickness: 0.5,
      color: rgb(0.85, 0.88, 0.92),
    });

    for (let cIdx = 0; cIdx < maxColumns; cIdx++) {
      const rawText = row[cIdx] || "";
      const font = isHeaderRow ? fontBold : fontRegular;
      const fontSize = isHeaderRow ? 9 : 8.5;
      const clean = rawText.replace(/[^\x20-\x7E\xA0-\xFF]/g, " ");

      let displayText = clean;
      try {
        while (displayText.length > 0 && font.widthOfTextAtSize(displayText, fontSize) > colWidth - 8) {
          displayText = displayText.slice(0, -1);
        }
        if (displayText !== clean && displayText.length > 3) {
          displayText = displayText.slice(0, -3) + "..";
        }
      } catch {
        displayText = clean.slice(0, Math.floor(colWidth / 8));
      }

      currentPage.drawText(displayText, {
        x: MARGIN_LEFT + cIdx * colWidth + 5,
        y: cursorY - rowHeight + 5.5,
        size: fontSize,
        font,
        color: isHeaderRow ? rgb(1, 1, 1) : rgb(0.15, 0.2, 0.25),
      });

      // Vertical column divider
      if (cIdx > 0) {
        currentPage.drawLine({
          start: { x: MARGIN_LEFT + cIdx * colWidth, y: cursorY },
          end: { x: MARGIN_LEFT + cIdx * colWidth, y: cursorY - rowHeight },
          thickness: 0.5,
          color: isHeaderRow ? rgb(0.2, 0.55, 0.35) : rgb(0.9, 0.92, 0.95),
        });
      }
    }

    cursorY -= rowHeight;
  }

  onProgress?.(95, "Generating final PDF file...");
  const pdfBytes = await pdfDoc.save();

  return {
    bytes: pdfBytes,
    pageCount: pdfDoc.getPageCount(),
    sheetCount: 1,
    rowCount: cleanRows.length,
    fileName: fileName.replace(/\.xlsx?$/i, "") + ".pdf",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. POWERPOINT TO PDF CONVERSION
// ─────────────────────────────────────────────────────────────────────────────

interface ParsedSlideData {
  title: string;
  bulletItems: string[];
}

export async function convertPptToPdf(
  buffer: ArrayBuffer,
  fileName = "Presentation.pptx",
  onProgress?: (progress: number, message: string) => void
): Promise<PptToPdfResult> {
  onProgress?.(15, "Opening PowerPoint slide deck...");
  const zip = await JSZip.loadAsync(buffer);

  // Find all slide files
  const slideFiles = Object.keys(zip.files).filter((f) =>
    /^ppt\/slides\/slide[0-9]+\.xml$/i.test(f)
  );

  // Sort slides numerically: slide1.xml, slide2.xml, slide10.xml
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.replace(/[^0-9]/g, ""), 10) || 0;
    const numB = parseInt(b.replace(/[^0-9]/g, ""), 10) || 0;
    return numA - numB;
  });

  if (slideFiles.length === 0) {
    throw new Error("Invalid PowerPoint presentation: No slide xml files found inside PPTX package.");
  }

  onProgress?.(40, `Found ${slideFiles.length} slides. Extracting content...`);
  const slides: ParsedSlideData[] = [];

  for (const sf of slideFiles) {
    const file = zip.file(sf);
    if (!file) continue;
    const xmlText = await file.async("text");
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "application/xml");

    let title = "";
    const bulletItems: string[] = [];

    // Find title shape (<p:sp> with placeholder type "title" or "ctrTitle")
    const shapes = Array.from(doc.getElementsByTagName("p:sp"));
    for (const sp of shapes) {
      const ph = sp.getElementsByTagName("p:ph")[0];
      const phType = ph?.getAttribute("type") || "";
      const isTitleShape = phType === "title" || phType === "ctrTitle";

      // Extract all text inside this shape
      const paragraphs = Array.from(sp.getElementsByTagName("a:p"));
      let shapeText = "";
      for (const p of paragraphs) {
        const textRuns = Array.from(p.getElementsByTagName("a:t"));
        const pStr = textRuns.map((t) => t.textContent || "").join("").trim();
        if (!pStr) continue;

        if (isTitleShape && !title) {
          title = pStr;
        } else {
          bulletItems.push(pStr);
        }
      }
    }

    if (!title && bulletItems.length > 0) {
      title = bulletItems.shift() || "Slide " + (slides.length + 1);
    }

    slides.push({
      title: title || `Slide ${slides.length + 1}`,
      bulletItems,
    });
  }

  onProgress?.(70, "Rendering widescreen slides into PDF...");
  const pdfDoc = await PDFDocument.create();
  const fontTitle = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontBody = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Standard 16:9 widescreen slide geometry: 960 x 540 points
  const SLIDE_WIDTH = 960;
  const SLIDE_HEIGHT = 540;

  for (let sIdx = 0; sIdx < slides.length; sIdx++) {
    const slide = slides[sIdx]!;
    const page = pdfDoc.addPage([SLIDE_WIDTH, SLIDE_HEIGHT]);

    // Modern slide gradient background (soft clean slate)
    page.drawRectangle({
      x: 0,
      y: 0,
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
      color: rgb(0.98, 0.98, 0.99),
    });

    // Top accent bar (amber presentation brand)
    page.drawRectangle({
      x: 0,
      y: SLIDE_HEIGHT - 6,
      width: SLIDE_WIDTH,
      height: 6,
      color: rgb(0.9, 0.4, 0.1),
    });

    // Slide Number Badge (top right)
    const badgeText = `${sIdx + 1} / ${slides.length}`;
    page.drawText(badgeText, {
      x: SLIDE_WIDTH - 90,
      y: SLIDE_HEIGHT - 38,
      size: 11,
      font: fontTitle,
      color: rgb(0.55, 0.6, 0.65),
    });

    // Slide Title
    const cleanTitle = slide.title.replace(/[^\x20-\x7E\xA0-\xFF]/g, " ");
    page.drawText(cleanTitle, {
      x: 65,
      y: SLIDE_HEIGHT - 80,
      size: 26,
      font: fontTitle,
      color: rgb(0.12, 0.16, 0.24),
    });

    // Title separator line
    page.drawLine({
      start: { x: 65, y: SLIDE_HEIGHT - 95 },
      end: { x: SLIDE_WIDTH - 65, y: SLIDE_HEIGHT - 95 },
      thickness: 1,
      color: rgb(0.88, 0.9, 0.93),
    });

    // Bullet Items / Body
    let bodyY = SLIDE_HEIGHT - 135;
    const itemFontSize = 14;
    const lineHeight = 22;

    for (const item of slide.bulletItems) {
      if (bodyY < 70) break; // Don't overflow bottom

      const cleanItem = item.replace(/[^\x20-\x7E\xA0-\xFF]/g, " ");
      const lines = wrapText(cleanItem, SLIDE_WIDTH - 180, itemFontSize, fontBody);

      // Bullet dot
      page.drawCircle({
        x: 75,
        y: bodyY - itemFontSize * 0.6,
        size: 3,
        color: rgb(0.9, 0.4, 0.1),
      });

      for (const line of lines) {
        if (bodyY < 60) break;
        page.drawText(line, {
          x: 92,
          y: bodyY - itemFontSize,
          size: itemFontSize,
          font: fontBody,
          color: rgb(0.2, 0.25, 0.32),
        });
        bodyY -= lineHeight;
      }
      bodyY -= 8; // spacing between bullets
    }

    // Slide Footer
    page.drawText("WebToolOcean PDF Studio — PowerPoint Presentation", {
      x: 65,
      y: 28,
      size: 9,
      font: fontBody,
      color: rgb(0.6, 0.65, 0.7),
    });
  }

  onProgress?.(95, "Finalizing presentation PDF...");
  const pdfBytes = await pdfDoc.save();

  return {
    bytes: pdfBytes,
    pageCount: slides.length,
    slideCount: slides.length,
    fileName: fileName.replace(/\.pptx?$/i, "") + ".pdf",
  };
}
