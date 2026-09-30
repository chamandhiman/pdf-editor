import JSZip from "jszip";
import { loadPdfDocument } from "./pdf-loader";

export interface PdfExcelConversionResult {
  xlsxBlob: Blob;
  csvBlob: Blob;
  csvText: string;
  totalRows: number;
  totalCols: number;
  totalPages: number;
  previewRows: string[][];
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getColumnName(colIndex: number): string {
  let name = "";
  let temp = colIndex;
  while (temp >= 0) {
    name = String.fromCharCode((temp % 26) + 65) + name;
    temp = Math.floor(temp / 26) - 1;
  }
  return name;
}

/**
 * Converts a PDF ArrayBuffer to an editable Microsoft Excel (.xlsx) workbook and CSV
 */
export async function convertPdfToExcel(
  buffer: ArrayBuffer,
  onProgress?: (currentPage: number, totalPages: number) => void
): Promise<PdfExcelConversionResult> {
  const pdfDoc = await loadPdfDocument(buffer.slice(0));
  const totalPages = pdfDoc.numPages;

  const allRows: string[][] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onProgress) onProgress(pageNum, totalPages);

    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    const items = textContent.items as Array<{
      str: string;
      transform: number[];
      width: number;
      height: number;
    }>;

    interface TextItemPos {
      text: string;
      x: number;
      y: number;
      width: number;
    }

    const validItems: TextItemPos[] = [];
    for (const it of items) {
      if (!it.str || it.str.trim() === "") continue;
      validItems.push({
        text: it.str.trim(),
        x: it.transform[4] ?? 0,
        y: it.transform[5] ?? 0,
        width: it.width ?? 10,
      });
    }

    if (validItems.length === 0) continue;

    // Group items into rows by Y coordinate tolerance (typically ~4-6pt)
    interface RowGroup {
      y: number;
      items: TextItemPos[];
    }

    const rowGroups: RowGroup[] = [];
    for (const item of validItems) {
      const existing = rowGroups.find((r) => Math.abs(r.y - item.y) <= 5);
      if (existing) {
        existing.items.push(item);
      } else {
        rowGroups.push({ y: item.y, items: [item] });
      }
    }

    // Sort rows from top of page to bottom (higher Y in PDF coordinate space is higher)
    rowGroups.sort((a, b) => b.y - a.y);

    // Collect all unique X positions across the page to estimate columns
    const allX = validItems.map((i) => i.x).sort((a, b) => a - b);
    const colStarts: number[] = [];
    for (const x of allX) {
      const lastX = colStarts[colStarts.length - 1];
      if (colStarts.length === 0 || (lastX !== undefined && x - lastX > 28)) {
        colStarts.push(x);
      }
    }

    // For each row, sort items by X and assign to best matching column
    for (const row of rowGroups) {
      row.items.sort((a, b) => a.x - b.x);

      const rowCells: string[] = new Array(colStarts.length).fill("");
      for (const item of row.items) {
        // Find closest column start that is <= item.x + tolerance
        let bestCol = 0;
        let minDiff = Infinity;
        for (let c = 0; c < colStarts.length; c++) {
          const colX = colStarts[c];
          if (colX !== undefined) {
            const diff = Math.abs(item.x - colX);
            if (diff < minDiff) {
              minDiff = diff;
              bestCol = c;
            }
          }
        }

        if (rowCells[bestCol]) {
          rowCells[bestCol] += " " + item.text;
        } else {
          rowCells[bestCol] = item.text;
        }
      }

      // Trim empty trailing cells
      while (rowCells.length > 0 && rowCells[rowCells.length - 1] === "") {
        rowCells.pop();
      }

      if (rowCells.length > 0) {
        allRows.push(rowCells);
      }
    }
  }

  // Calculate maximum columns across all rows
  const maxCols = Math.max(1, ...allRows.map((r) => r.length));

  // Build CSV
  const csvLines: string[] = [];
  for (const row of allRows) {
    const escapedRow = row.map((cell) => {
      const needsQuotes = cell.includes(",") || cell.includes('"') || cell.includes("\n");
      if (needsQuotes) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    });
    csvLines.push(escapedRow.join(","));
  }
  const csvText = csvLines.join("\n");
  const csvBlob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });

  // Build standard Office OpenXML (.xlsx) ZIP package
  const zip = new JSZip();

  // 1. [Content_Types].xml
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
  );

  // 2. _rels/.rels
  zip.folder("_rels")?.file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );

  // 3. xl/_rels/workbook.xml.rels
  zip.folder("xl")?.folder("_rels")?.file(
    "workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );

  // 4. xl/workbook.xml
  zip.folder("xl")?.file(
    "workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="PDF_Data" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`
  );

  // 5. xl/styles.xml
  zip.folder("xl")?.file(
    "styles.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><color theme="1"/><name val="Calibri"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>`
  );

  // 6. xl/worksheets/sheet1.xml
  let sheetRowsXml = "";
  for (let r = 0; r < allRows.length; r++) {
    const rowNumber = r + 1;
    let cellsXml = "";
    const cells = allRows[r];
    if (!cells) continue;

    for (let c = 0; c < cells.length; c++) {
      const val = cells[c];
      if (!val) continue;

      const cellRef = `${getColumnName(c)}${rowNumber}`;
      const escaped = escapeXml(val);

      // Check if numeric
      const numericVal = Number(val.replace(/,/g, ""));
      if (!isNaN(numericVal) && val.trim() !== "") {
        cellsXml += `<c r="${cellRef}"><v>${numericVal}</v></c>`;
      } else {
        cellsXml += `<c r="${cellRef}" t="inlineStr"><is><t>${escaped}</t></is></c>`;
      }
    }

    if (cellsXml) {
      sheetRowsXml += `<row r="${rowNumber}">${cellsXml}</row>`;
    }
  }

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${sheetRowsXml}
  </sheetData>
</worksheet>`;

  zip.folder("xl")?.folder("worksheets")?.file("sheet1.xml", sheetXml);

  const xlsxBlob = await zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  return {
    xlsxBlob,
    csvBlob,
    csvText,
    totalRows: allRows.length,
    totalCols: maxCols,
    totalPages,
    previewRows: allRows.slice(0, 15),
  };
}
