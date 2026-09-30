import JSZip from "jszip";
import { loadPdfDocument } from "./pdf-loader";

export interface PdfWordConversionResult {
  docxBlob: Blob;
  plainText: string;
  totalWords: number;
  totalPages: number;
  totalParagraphs: number;
  previewParagraphs: string[];
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Converts a PDF ArrayBuffer to an editable Microsoft Word (.docx) document
 */
export async function convertPdfToWord(
  buffer: ArrayBuffer,
  onProgress?: (currentPage: number, totalPages: number) => void
): Promise<PdfWordConversionResult> {
  const pdfDoc = await loadPdfDocument(buffer.slice(0));
  const totalPages = pdfDoc.numPages;

  let allExtractedParagraphs: string[] = [];
  let fullPlainText = "";

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onProgress) onProgress(pageNum, totalPages);

    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group text items by line (similar Y coordinate within 4 points)
    const items = textContent.items as Array<{
      str: string;
      transform: number[];
      width: number;
      height: number;
      fontName?: string;
    }>;

    interface TextLine {
      y: number;
      fontSize: number;
      items: { text: string; x: number; fontSize: number }[];
    }

    const lines: TextLine[] = [];

    for (const item of items) {
      if (!item.str || item.str.trim() === "") continue;

      const x = item.transform[4] ?? 0;
      const y = item.transform[5] ?? 0;
      const fontSize = Math.hypot(item.transform[0] ?? 12, item.transform[1] ?? 0);

      // Find an existing line with close Y coordinate
      const existingLine = lines.find((l) => Math.abs(l.y - y) < 4);
      if (existingLine) {
        existingLine.items.push({ text: item.str, x, fontSize });
      } else {
        lines.push({
          y,
          fontSize,
          items: [{ text: item.str, x, fontSize }],
        });
      }
    }

    // Sort lines from top to bottom (PDF Y is 0 at bottom, so higher Y is higher on page)
    lines.sort((a, b) => b.y - a.y);

    // Sort items within each line from left to right (increasing X)
    for (const line of lines) {
      line.items.sort((a, b) => a.x - b.x);
    }

    // Group adjacent lines into paragraphs based on vertical spacing
    const pageParagraphs: string[] = [];
    let currentPara = "";
    let lastY: number | null = null;
    let lastFontSize = 12;

    for (const line of lines) {
      const lineText = line.items.map((it) => it.text).join(" ").trim();
      if (!lineText) continue;

      if (lastY === null) {
        currentPara = lineText;
      } else {
        const gap = Math.abs(lastY - line.y);
        // If vertical gap is significantly larger than line height, start new paragraph
        if (gap > line.fontSize * 1.6 || Math.abs(line.fontSize - lastFontSize) > 3) {
          if (currentPara) pageParagraphs.push(currentPara);
          currentPara = lineText;
        } else {
          // Continue same paragraph with space
          currentPara += " " + lineText;
        }
      }
      lastY = line.y;
      lastFontSize = line.fontSize;
    }

    if (currentPara) {
      pageParagraphs.push(currentPara);
    }

    // If page had no recognized lines, fallback to joined string
    if (pageParagraphs.length === 0) {
      const fallback = items.map((i) => i.str).join(" ").trim();
      if (fallback) pageParagraphs.push(fallback);
    }

    allExtractedParagraphs = allExtractedParagraphs.concat(pageParagraphs);
    fullPlainText += pageParagraphs.join("\n\n") + "\n\n";

    // Add page break marker between pages if not last page
    if (pageNum < totalPages) {
      allExtractedParagraphs.push("--- PAGE_BREAK ---");
    }
  }

  // Count words
  const totalWords = fullPlainText
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  // Build standard Office OpenXML (.docx) ZIP package
  const zip = new JSZip();

  // 1. [Content_Types].xml
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
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
  zip.folder("word")?.folder("_rels")?.file(
    "document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );

  // 4. word/styles.xml
  zip.folder("word")?.file(
    "styles.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="24"/>
        <w:color w:val="222222"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`
  );

  // 5. word/document.xml
  let documentBodyXml = "";

  for (const para of allExtractedParagraphs) {
    if (para === "--- PAGE_BREAK ---") {
      documentBodyXml += `
    <w:p>
      <w:r>
        <w:br w:type="page"/>
      </w:r>
    </w:p>`;
    } else {
      const escaped = escapeXml(para);
      documentBodyXml += `
    <w:p>
      <w:pPr>
        <w:spacing w:after="160" w:line="276" w:lineRule="auto"/>
      </w:pPr>
      <w:r>
        <w:t xml:space="preserve">${escaped}</w:t>
      </w:r>
    </w:p>`;
    }
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
${documentBodyXml}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.folder("word")?.file("document.xml", documentXml);

  const docxBlob = await zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  return {
    docxBlob,
    plainText: fullPlainText,
    totalWords,
    totalPages,
    totalParagraphs: allExtractedParagraphs.filter((p) => p !== "--- PAGE_BREAK ---").length,
    previewParagraphs: allExtractedParagraphs
      .filter((p) => p !== "--- PAGE_BREAK ---")
      .slice(0, 8),
  };
}
