export type ToolId =
  | "select"
  | "hand"
  | "add-text"
  | "edit-text"
  | "sign"
  | "draw"
  | "highlight"
  | "image"
  | "stamp"
  | "link"
  | "note";

export type PDFObjectType = "text" | "image" | "signature" | "shape" | "note" | "highlight";

export interface PDFObject {
  id: string;
  type: PDFObjectType;
  pageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  text?: {
    value: string;
    fontFamily: string;
    fontSize: number;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    color: string;
    align: "left" | "center" | "right";
  };
}

export interface PDFPage {
  id: string;
  index: number;
  label: string;
  rotation: number;
  width: number;
  height: number;
  objects: PDFObject[];
}

export interface PDFDocument {
  id: string;
  fileName: string;
  pageSize: "A4" | "Letter" | "Legal";
  orientation: "Portrait" | "Landscape";
  pages: PDFPage[];
}

export type ViewMode = "single" | "continuous";
export type SidebarTab = "thumbnails" | "outline" | "annotations" | "bookmarks";
