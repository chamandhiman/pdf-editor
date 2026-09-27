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

export type ListType = "none" | "bullet" | "numbered" | "check";

export interface TextProps {
  value: string;
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
  align: "left" | "center" | "right" | "justify";
  listType?: ListType | undefined;
  listItems?: string[] | undefined;
}

export interface PDFObject {
  id: string;
  type: PDFObjectType;
  pageId: string;
  pageNumber?: number | undefined;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  text?: TextProps;
  image?: { src: string; alt: string; originalSrc?: string | undefined };
  signature?: { kind: "draw" | "type" | "upload"; src?: string; name?: string; font?: string };
  drawing?: { paths: string[]; stroke: string; thickness: number };
  shape?: { kind: ShapeKind; stroke: string; fill: string; thickness: number };
  highlight?: { color: string };
  note?: { body: string; author: string };
  link?: { url: string };
  stamp?: { label: string; color: string };
}

export type PageType = "pdf" | "blank";

export interface PDFPage {
  id: string;
  index: number;
  label: string;
  rotation: number;
  width: number;
  height: number;
  template: number;
  objects: PDFObject[];
  type?: PageType;
  originalPageNumber?: number;
}

export interface TextStyleOverride {
  fontFamily?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  align?: "left" | "center" | "right" | "justify";
  bg?: string;
}

export interface PDFDocument {
  id: string;
  fileName: string;
  pageSize: "A4" | "Letter" | "Legal";
  orientation: "Portrait" | "Landscape";
  pages: PDFPage[];
  textOverrides: Record<string, string>;
  textColorOverrides: Record<string, string>;
  textBgOverrides: Record<string, string>;
  textStyleOverrides: Record<string, TextStyleOverride>;
}

export type ViewMode = "single" | "continuous";
export type SidebarTab = "thumbnails" | "outline" | "annotations" | "bookmarks";
