import type { PDFDocument } from "@/types/pdf";

export const createDemoDocument = (fileName = "Sample-Document.pdf"): PDFDocument => ({
  id: "doc-1",
  fileName,
  pageSize: "A4",
  orientation: "Portrait",
  pages: Array.from({ length: 4 }, (_, i) => ({
    id: `page-${i + 1}`,
    index: i,
    label: `Page ${i + 1}`,
    rotation: 0,
    width: 794,
    height: 1123,
    objects: [],
  })),
});

export const demoOutline = [
  { id: "1", title: "Employee Service Agreement", page: 1, level: 0 },
  { id: "2", title: "1. Position and Duties", page: 1, level: 1 },
  { id: "3", title: "2. Compensation", page: 2, level: 1 },
  { id: "4", title: "3. Benefits Schedule", page: 2, level: 1 },
  { id: "5", title: "4. Confidentiality", page: 3, level: 1 },
  { id: "6", title: "5. Termination", page: 3, level: 1 },
  { id: "7", title: "Signatures", page: 4, level: 0 },
];

export const demoAnnotations = [
  { id: "a1", type: "Highlight", page: 1, author: "You", text: "…term of twelve (12) months" },
  { id: "a2", type: "Note", page: 2, author: "R. Mehta", text: "Confirm the salary band with HR." },
  { id: "a3", type: "Comment", page: 3, author: "You", text: "Clause 4.2 needs legal review." },
  { id: "a4", type: "Signature", page: 4, author: "You", text: "Signature field placed" },
];

export const demoBookmarks = [
  { id: "b1", title: "Compensation table", page: 2 },
  { id: "b2", title: "Confidentiality clause", page: 3 },
  { id: "b3", title: "Signature block", page: 4 },
];
