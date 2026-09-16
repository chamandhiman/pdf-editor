export type ToolId =
  | "select"
  | "hand"
  | "add-text"
  | "edit-text"
  | "sign"
  | "draw"
  | "line"
  | "arrow"
  | "rectangle"
  | "circle"
  | "polygon"
  | "highlight"
  | "image"
  | "stamp"
  | "link"
  | "note";

export type ShapeKind = "line" | "arrow" | "rectangle" | "circle" | "polygon";

export type PDFObjectType =
  | "text"
  | "image"
  | "signature"
  | "drawing"
  | "shape"
  | "note"
  | "highlight"
  | "link"
  | "stamp";

export interface TextProps {
  value: string;
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
  align: "left" | "center" | "right";
}

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
  text?: TextProps;
  image?: { src: string; alt: string };
  signature?: { kind: "draw" | "type" | "upload"; src?: string; name?: string; font?: string };
  drawing?: { paths: string[]; stroke: string; thickness: number };
  shape?: { kind: ShapeKind; stroke: string; fill: string; thickness: number };
  highlight?: { color: string };
  note?: { body: string; author: string };
  link?: { url: string };
  stamp?: { label: string; color: string };
}

export interface PDFPage {
  id: string;
  index: number;
  label: string;
  rotation: number;
  width: number;
  height: number;
  template: number;
  objects: PDFObject[];
}

export interface PDFDocument {
  id: string;
  fileName: string;
  pageSize: "A4" | "Letter" | "Legal";
  orientation: "Portrait" | "Landscape";
  pages: PDFPage[];
  textOverrides: Record<string, string>;
}

export type ViewMode = "single" | "continuous";
export type SidebarTab = "thumbnails" | "outline" | "annotations" | "bookmarks";
