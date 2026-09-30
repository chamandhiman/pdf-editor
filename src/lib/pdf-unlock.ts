import { PDFDocument } from "pdf-lib";
import { loadPdfDocument, getPdfJs } from "./pdf-loader";

export interface UnlockDetectionResult {
  isEncrypted: boolean;
  requiresPassword: boolean;
  pageCount?: number;
}

/**
 * Detects whether a PDF file is encrypted, and if an open password is required
 */
export async function detectPdfEncryption(bytes: ArrayBuffer): Promise<UnlockDetectionResult> {
  // First test with pdf-lib without ignoring encryption
  try {
    const doc = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: false });
    return {
      isEncrypted: false,
      requiresPassword: false,
      pageCount: doc.getPageCount(),
    };
  } catch (err: any) {
    const msg = String(err?.message || "").toLowerCase();
    const isEnc = msg.includes("encrypted") || msg.includes("password");

    // Check with PDF.js if it can be opened without password (owner-only restriction)
    try {
      const pdfjsDoc = await loadPdfDocument(bytes.slice(0));
      return {
        isEncrypted: true,
        requiresPassword: false, // Opened without password, has owner/permissions lock
        pageCount: pdfjsDoc.numPages,
      };
    } catch (pdfjsErr: any) {
      const pdfjsMsg = String(pdfjsErr?.name || pdfjsErr?.message || "").toLowerCase();
      if (pdfjsMsg.includes("password") || isEnc) {
        return {
          isEncrypted: true,
          requiresPassword: true,
        };
      }
      return {
        isEncrypted: isEnc,
        requiresPassword: true,
      };
    }
  }
}

/**
 * Unlocks a password-protected or restricted PDF and returns unencrypted bytes
 */
export async function unlockPdf(
  bytes: ArrayBuffer,
  password?: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ bytes: Uint8Array; pageCount: number }> {
  const pdfjs = await getPdfJs();

  // 1. Try opening via PDF.js with optional password to verify credentials & decrypt streams
  let pdfjsDoc: any;
  try {
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(bytes.slice(0)),
      password: password || undefined,
    });
    pdfjsDoc = await loadingTask.promise;
  } catch (err: any) {
    const msg = String(err?.name || err?.message || "").toLowerCase();
    if (msg.includes("password")) {
      throw new Error(
        password
          ? "Incorrect password. Please verify the password and try again."
          : "This PDF is password-protected. Please enter the password to unlock it."
      );
    }
    throw new Error(err?.message || "Failed to authenticate PDF document.");
  }

  const numPages = pdfjsDoc.numPages;

  // 2. Try fast path: if pdf-lib can load with ignoreEncryption, copy & flatten without /Encrypt
  try {
    const srcDoc = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: true });
    try {
      srcDoc.getForm().flatten();
    } catch {
      // Safe fallback
    }

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, srcDoc.getPageIndices());

    for (let i = 0; i < copiedPages.length; i++) {
      const page = copiedPages[i]!;
      if (onProgress) onProgress(i + 1, copiedPages.length);

      try {
        const mediaBox = page.getMediaBox();
        const cropBox = page.getCropBox();
        if (!cropBox || cropBox.width <= 0 || cropBox.height <= 0) {
          page.setCropBox(mediaBox.x, mediaBox.y, mediaBox.width, mediaBox.height);
        }
      } catch {
        // Safe fallback
      }
      newDoc.addPage(page);
    }

    const unlockedBytes = await newDoc.save({ useObjectStreams: false, addDefaultPage: false });

    // Verify output has no encryption
    const verifyDoc = await PDFDocument.load(unlockedBytes, { ignoreEncryption: false });
    if (verifyDoc.getPageCount() > 0) {
      return {
        bytes: unlockedBytes,
        pageCount: verifyDoc.getPageCount(),
      };
    }
  } catch {
    // If fast path fails because stream filters were locked with user password,
    // continue to robust renderer path below.
  }

  // 3. Robust path: Recompile pages decrypted in PDF.js memory
  const newDoc = await PDFDocument.create();

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (onProgress) onProgress(pageNum, numPages);

    const page = await pdfjsDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) throw new Error("Could not initialize 2D canvas context.");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await (page.render as any)({
      canvasContext: ctx,
      viewport,
      canvas,
    }).promise;

    const imgDataUrl = canvas.toDataURL("image/jpeg", 0.95);
    const imgBytes = await fetch(imgDataUrl).then((r) => r.arrayBuffer());
    const embeddedImg = await newDoc.embedJpg(imgBytes);

    const unscaledVp = page.getViewport({ scale: 1.0 });
    const pdfPage = newDoc.addPage([unscaledVp.width, unscaledVp.height]);
    pdfPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: unscaledVp.width,
      height: unscaledVp.height,
    });
  }

  const unlockedBytes = await newDoc.save({ useObjectStreams: false, addDefaultPage: false });
  return {
    bytes: unlockedBytes,
    pageCount: numPages,
  };
}
