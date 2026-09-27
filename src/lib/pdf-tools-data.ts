import {
  Type,
  Heading,
  Image as ImageIcon,
  Shapes,
  Highlighter,
  StickyNote,
  Files,
  Split,
  RotateCw,
  Trash2,
  ArrowUpDown,
  FileDown,
  FileSpreadsheet,
  Presentation,
  FileImage,
  FileArchive,
  PenTool,
  Shield,
  Unlock,
  Stamp,
  ScanText,
  Hash,
  FileUp,
  FileCode,
  Layers,
  type LucideIcon,
} from "lucide-react";

export type ToolCategory =
  | "all"
  | "edit"
  | "convert"
  | "organize"
  | "compress"
  | "sign"
  | "security"
  | "ocr"
  | "image";

export interface PDFToolDef {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  icon: LucideIcon;
  status: "available" | "coming-soon";
  badge?: string;
  popular?: boolean;
  slug?: string;
}

export type PdfTool = PDFToolDef;

export const TOOL_CATEGORIES: { id: ToolCategory; name: string }[] = [
  { id: "all", name: "All Tools" },
  { id: "edit", name: "Edit" },
  { id: "convert", name: "Convert" },
  { id: "organize", name: "Organize" },
  { id: "compress", name: "Compress" },
  { id: "sign", name: "Sign" },
  { id: "security", name: "Security" },
  { id: "ocr", name: "OCR" },
  { id: "image", name: "Image / PDF" },
];

export const pdfToolCategories = TOOL_CATEGORIES;

export function getToolsByCategory(category: ToolCategory): PDFToolDef[] {
  if (category === "all") return ALL_PDF_TOOLS;
  return ALL_PDF_TOOLS.filter((t) => t.category === category);
}

export const ALL_PDF_TOOLS: PDFToolDef[] = [
  // ── Edit Tools (Integrated in Editor) ──────────────────────────────
  {
    id: "edit-text",
    name: "Edit PDF Text",
    category: "edit",
    description: "Modify existing text in your PDF directly without altering layout or fonts.",
    icon: Type,
    status: "available",
    badge: "Available Now",
    popular: true,
  },
  {
    id: "add-text",
    name: "Add Text & Headings",
    category: "edit",
    description: "Insert new headings, paragraphs, and customized typography onto any page.",
    icon: Heading,
    status: "available",
    badge: "Available Now",
    popular: true,
  },
  {
    id: "insert-image",
    name: "Insert Images",
    category: "edit",
    description: "Place company logos, diagrams, and photos onto pages with full drag & resize.",
    icon: ImageIcon,
    status: "available",
    badge: "Available Now",
  },
  {
    id: "shapes-drawing",
    name: "Shapes & Freehand",
    category: "edit",
    description: "Draw arrows, rectangles, circles, lines, and freehand markup on your PDF.",
    icon: Shapes,
    status: "available",
    badge: "Available Now",
  },
  {
    id: "highlight-text",
    name: "Highlight PDF",
    category: "edit",
    description: "Emphasize key passages with colored translucent highlighter stripes.",
    icon: Highlighter,
    status: "available",
    badge: "Available Now",
  },
  {
    id: "annotate-notes",
    name: "Annotate & Comments",
    category: "edit",
    description: "Attach sticky comment pins with author notes for collaborative reviews.",
    icon: StickyNote,
    status: "available",
    badge: "Available Now",
  },

  // ── Sign Tools (Integrated in Editor) ──────────────────────────────
  {
    id: "sign-pdf",
    name: "Sign PDF",
    category: "sign",
    description: "Draw, type, or upload your electronic signature to sign documents in seconds.",
    icon: PenTool,
    status: "available",
    badge: "Available Now",
    popular: true,
  },
  {
    id: "stamp-pdf",
    name: "Stamp PDF",
    category: "security",
    description: "Stamp documents with Approved, Confidential, Paid, Rejected, or Draft seals.",
    icon: Stamp,
    status: "available",
    badge: "Available Now",
  },

  // ── Organize Tools ────────────────────────────────────────────────
  {
    id: "rotate-pdf",
    name: "Rotate Pages",
    category: "organize",
    description: "Rotate individual pages or entire documents 90°, 180°, or 270° clockwise.",
    icon: RotateCw,
    status: "available",
    badge: "Available Now",
  },
  {
    id: "delete-pages",
    name: "Delete Pages",
    category: "organize",
    description: "Select and remove unwanted pages from your PDF document instantly.",
    icon: Trash2,
    status: "available",
    badge: "Available Now",
  },
  {
    id: "reorder-pages",
    name: "Reorder Pages",
    category: "organize",
    description: "Drag and drop page thumbnails to rearrange document structure in seconds.",
    icon: ArrowUpDown,
    status: "available",
    badge: "Available Now",
  },
  {
    id: "merge-pdf",
    name: "Merge PDF",
    category: "organize",
    description: "Combine multiple PDF files into a single unified document in desired order.",
    icon: Files,
    status: "coming-soon",
    badge: "Coming Soon",
    popular: true,
  },
  {
    id: "split-pdf",
    name: "Split PDF",
    category: "organize",
    description: "Separate specific page ranges or extract individual pages into separate files.",
    icon: Split,
    status: "coming-soon",
    badge: "Coming Soon",
  },
  {
    id: "extract-pages",
    name: "Extract Pages",
    category: "organize",
    description: "Save selected pages from a large PDF document into a brand new PDF file.",
    icon: FileDown,
    status: "coming-soon",
    badge: "Coming Soon",
  },

  // ── Convert from PDF ──────────────────────────────────────────────
  {
    id: "pdf-to-word",
    name: "PDF to Word",
    category: "convert",
    description: "Convert PDF documents to editable Microsoft Word DOCX files with preserved layout.",
    icon: FileCode,
    status: "coming-soon",
    badge: "Coming Soon",
    popular: true,
  },
  {
    id: "pdf-to-excel",
    name: "PDF to Excel",
    category: "convert",
    description: "Extract tables and tabular data from PDF into editable XLSX spreadsheets.",
    icon: FileSpreadsheet,
    status: "coming-soon",
    badge: "Coming Soon",
  },
  {
    id: "pdf-to-ppt",
    name: "PDF to PowerPoint",
    category: "convert",
    description: "Turn PDF presentations back into editable Microsoft PowerPoint PPTX slides.",
    icon: Presentation,
    status: "coming-soon",
    badge: "Coming Soon",
  },
  {
    id: "pdf-to-jpg",
    name: "PDF to JPG",
    category: "image",
    description: "Render high-resolution JPG images of each page from your PDF file.",
    icon: FileImage,
    status: "coming-soon",
    badge: "Coming Soon",
  },
  {
    id: "pdf-to-png",
    name: "PDF to PNG",
    category: "image",
    description: "Export crisp, lossless PNG graphic images from PDF pages with transparency.",
    icon: FileImage,
    status: "coming-soon",
    badge: "Coming Soon",
  },

  // ── Convert to PDF ────────────────────────────────────────────────
  {
    id: "word-to-pdf",
    name: "Word to PDF",
    category: "convert",
    description: "Convert DOC and DOCX documents to standardized, print-ready PDF files.",
    icon: FileUp,
    status: "coming-soon",
    badge: "Coming Soon",
  },
  {
    id: "excel-to-pdf",
    name: "Excel to PDF",
    category: "convert",
    description: "Convert XLSX and XLS sheets into clean, shareable PDF reports and tables.",
    icon: FileSpreadsheet,
    status: "coming-soon",
    badge: "Coming Soon",
  },
  {
    id: "ppt-to-pdf",
    name: "PowerPoint to PDF",
    category: "convert",
    description: "Transform PPT and PPTX pitch decks and slide presentations into universal PDFs.",
    icon: Presentation,
    status: "coming-soon",
    badge: "Coming Soon",
  },
  {
    id: "jpg-to-pdf",
    name: "JPG to PDF",
    category: "image",
    description: "Combine JPG photos and scans into a single neatly paginated PDF book.",
    icon: FileImage,
    status: "coming-soon",
    badge: "Coming Soon",
  },
  {
    id: "png-to-pdf",
    name: "PNG to PDF",
    category: "image",
    description: "Convert high-resolution PNG image captures into clean PDF documents.",
    icon: FileImage,
    status: "coming-soon",
    badge: "Coming Soon",
  },

  // ── Utilities, Compress, Security, OCR ────────────────────────────
  {
    id: "compress-pdf",
    name: "Compress PDF",
    category: "compress",
    description: "Reduce PDF file size significantly while maintaining crisp visual quality.",
    icon: FileArchive,
    status: "coming-soon",
    badge: "Coming Soon",
    popular: true,
  },
  {
    id: "ocr-pdf",
    name: "OCR PDF",
    category: "ocr",
    description: "Optical Character Recognition to convert scanned document images into searchable text.",
    icon: ScanText,
    status: "coming-soon",
    badge: "Coming Soon",
  },
  {
    id: "protect-pdf",
    name: "Protect PDF",
    category: "security",
    description: "Encrypt your PDF with standard 256-bit AES password encryption.",
    icon: Shield,
    status: "coming-soon",
    badge: "Coming Soon",
  },
  {
    id: "unlock-pdf",
    name: "Unlock PDF",
    category: "security",
    description: "Remove security passwords and restrictions from your personal PDF files.",
    icon: Unlock,
    status: "coming-soon",
    badge: "Coming Soon",
  },
  {
    id: "page-numbers",
    name: "Add Page Numbers",
    category: "organize",
    description: "Insert customizable header and footer page numbering across all pages.",
    icon: Hash,
    status: "coming-soon",
    badge: "Coming Soon",
  },
  {
    id: "watermark-pdf",
    name: "Watermark PDF",
    category: "security",
    description: "Overlay custom text or image watermarks with controllable opacity.",
    icon: Layers,
    status: "coming-soon",
    badge: "Coming Soon",
  },
];

export const pdfTools = ALL_PDF_TOOLS;
