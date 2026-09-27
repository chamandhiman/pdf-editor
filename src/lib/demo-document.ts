import type { PDFDocument } from "@/types/pdf";

export const PAGE_WIDTH = 794;
export const PAGE_HEIGHT = 1123;

export const createDemoDocument = (fileName = "Sample-Document.pdf"): PDFDocument => ({
  id: "doc-1",
  fileName,
  pageSize: "A4",
  orientation: "Portrait",
  textOverrides: {},
  textColorOverrides: {},
  textBgOverrides: {},
  textStyleOverrides: {},
  pages: Array.from({ length: 4 }, (_, i) => ({
    id: `page-${i + 1}`,
    index: i,
    label: `Page ${i + 1}`,
    rotation: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    template: i,
    objects: [],
  })),
});

export const demoOutline = [
  { id: "1", title: "Employee Service Agreement", page: 1, level: 0 },
  { id: "2", title: "1. Position and Duties", page: 1, level: 1 },
  { id: "3", title: "Terms and Conditions", page: 2, level: 0 },
  { id: "4", title: "2. Confidentiality", page: 2, level: 1 },
  { id: "5", title: "Compensation and Benefits", page: 3, level: 0 },
  { id: "6", title: "3. Salary structure", page: 3, level: 1 },
  { id: "7", title: "Signatures", page: 4, level: 0 },
];

export const demoBookmarks = [
  { id: "b1", title: "Compensation table", page: 3 },
  { id: "b2", title: "Confidentiality clause", page: 2 },
  { id: "b3", title: "Signature block", page: 4 },
];

export const stampPresets = [
  { label: "Approved", color: "#1f9d55" },
  { label: "Rejected", color: "#d13c3c" },
  { label: "Draft", color: "#6b7280" },
  { label: "Confidential", color: "#b4420f" },
  { label: "Paid", color: "#0f766e" },
  { label: "Important", color: "#b45309" },
];

export const signatureFonts = [
  { id: "cursive-1", label: "Classic", family: "'Segoe Script', 'Brush Script MT', cursive" },
  { id: "cursive-2", label: "Formal", family: "'Snell Roundhand', 'Apple Chancery', cursive" },
  { id: "cursive-3", label: "Casual", family: "'Bradley Hand', 'Comic Sans MS', cursive" },
];

export const demoImages = [
  {
    id: "logo",
    label: "Company logo",
    src:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="#eef2f7"/><circle cx="90" cy="100" r="42" fill="#2f5bd1"/><rect x="150" y="76" width="130" height="14" rx="7" fill="#1c2333"/><rect x="150" y="104" width="96" height="10" rx="5" fill="#8a94a6"/></svg>`,
      ),
  },
  {
    id: "chart",
    label: "Quarterly chart",
    src:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="#ffffff"/><g fill="#2f5bd1"><rect x="40" y="110" width="34" height="60"/><rect x="94" y="80" width="34" height="90"/><rect x="148" y="52" width="34" height="118"/><rect x="202" y="92" width="34" height="78"/><rect x="256" y="34" width="34" height="136"/></g><line x1="30" y1="172" x2="300" y2="172" stroke="#c9d1de" stroke-width="2"/></svg>`,
      ),
  },
  {
    id: "seal",
    label: "Official seal",
    src:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><circle cx="120" cy="120" r="108" fill="none" stroke="#1f6f4a" stroke-width="6"/><circle cx="120" cy="120" r="88" fill="none" stroke="#1f6f4a" stroke-width="2"/><text x="120" y="112" text-anchor="middle" font-family="serif" font-size="26" fill="#1f6f4a">VERIFIED</text><text x="120" y="146" text-anchor="middle" font-family="serif" font-size="16" fill="#1f6f4a">NORTHBRIDGE</text></svg>`,
      ),
  },
];
