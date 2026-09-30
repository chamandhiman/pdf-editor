import { PDFDocument } from "pdf-lib";

/**
 * Creates an empty, standard A4 blank PDF document in browser memory.
 */
export async function createBlankPdfDocument(fileName = "Untitled.pdf"): Promise<{
  bytes: ArrayBuffer;
  fileName: string;
}> {
  const doc = await PDFDocument.create();
  // Standard A4 dimensions (595.28 x 841.89 points)
  doc.addPage([595.28, 841.89]);
  const uint8 = await doc.save();
  return {
    bytes: uint8.buffer as ArrayBuffer,
    fileName,
  };
}
