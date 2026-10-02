import { PDF_STUDIO_TEMPLATES, type TemplateMetadata } from "./pdf-templates-data";
import { exportEditedPdf } from "./pdf-export";
import type { PDFDocument } from "@/types/pdf";

export { PDF_STUDIO_TEMPLATES, type TemplateMetadata };

export interface TemplateDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  badge: string;
  fileName: string;
  accentColor: string;
  previewSnippet: string;
  pages?: number | undefined;
  isAtsFriendly?: boolean | undefined;
  isPro?: boolean | undefined;
}

export const PDF_TEMPLATES: TemplateDefinition[] = PDF_STUDIO_TEMPLATES.map((t) => ({
  id: t.id,
  name: t.name,
  category: t.category,
  description: t.description,
  badge: t.badge || t.style || "Featured",
  fileName: `${t.name.replace(/[^a-zA-Z0-9_-]/g, "-")}.pdf`,
  accentColor: t.accentColor,
  previewSnippet: t.description,
  pages: t.pages,
  isAtsFriendly: t.isAtsFriendly,
  isPro: t.isPro,
}));

/**
 * Creates a genuine editable PDFDocument with real PDFObjects and exports initial vector bytes.
 */
export async function generateTemplatePdfAndDoc(templateId: string): Promise<{
  bytes: ArrayBuffer;
  fileName: string;
  doc: PDFDocument;
}> {
  // Legacy alias mapping
  let targetId = templateId;
  if (templateId === "resume") targetId = "ats-professional";
  if (templateId === "invoice") targetId = "professional-invoice";
  if (templateId === "simple-contract") targetId = "service-agreement";
  if (templateId === "cover-letter") targetId = "job-cover-letter";

  const tpl = PDF_STUDIO_TEMPLATES.find((t) => t.id === targetId) || PDF_STUDIO_TEMPLATES[0]!;
  const doc = tpl.createDocument();

  // Export initial clean PDF bytes from the editable document state
  const edited = await exportEditedPdf(doc);
  if (!edited) {
    throw new Error(`Failed to compile template "${tpl.name}" into PDF bytes.`);
  }

  const bytes = edited.buffer.slice(
    edited.byteOffset,
    edited.byteOffset + edited.byteLength
  ) as ArrayBuffer;

  const safeFileName =
    doc.fileName ||
    (doc as any).name ||
    `${tpl.name.replace(/[^a-zA-Z0-9_-]/g, "-")}.pdf`;

  doc.fileName = safeFileName;

  return {
    bytes,
    fileName: safeFileName,
    doc,
  };
}

/**
 * Legacy wrapper: generates template PDF bytes and attaches editable doc state.
 */
export async function generateTemplatePdf(templateId: string): Promise<{
  bytes: ArrayBuffer;
  fileName: string;
  doc?: PDFDocument;
}> {
  const result = await generateTemplatePdfAndDoc(templateId);
  return {
    bytes: result.bytes,
    fileName: result.fileName,
    doc: result.doc,
  };
}
