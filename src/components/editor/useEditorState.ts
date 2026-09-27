import { useCallback, useMemo, useRef, useState } from "react";
import { createDemoDocument, PAGE_HEIGHT, PAGE_WIDTH } from "@/lib/demo-document";
import type {
  ListType,
  PDFDocument,
  PDFObject,
  PDFObjectType,
  PDFPage,
  ShapeKind,
  SidebarTab,
  TextStyleOverride,
  ToolId,
  ViewMode,
} from "@/types/pdf";

export const ZOOM_PRESETS = [50, 75, 100, 125, 150, 200];

let objectSeq = 0;
const nextId = (prefix: string) => `${prefix}-${++objectSeq}-${Math.round(Math.random() * 1e6)}`;

export interface ToolDefaults {
  stroke: string;
  thickness: number;
  highlightColor: string;
  highlightOpacity: number;
}

export type TextPresetKind =
  | "text"
  | "heading"
  | "subheading"
  | "paragraph"
  | "bullet-list"
  | "numbered-list"
  | "checklist";

export const TEXT_PRESETS: Record<
  TextPresetKind,
  {
    label: string;
    value: string;
    listType: ListType;
    listItems?: string[];
    fontSize: number;
    bold: boolean;
    width: number;
    height: number;
  }
> = {
  text: {
    label: "Add Text",
    value: "Click to edit text",
    listType: "none",
    fontSize: 16,
    bold: false,
    width: 240,
    height: 40,
  },
  heading: {
    label: "Add Heading",
    value: "Heading",
    listType: "none",
    fontSize: 28,
    bold: true,
    width: 280,
    height: 48,
  },
  subheading: {
    label: "Add Subheading",
    value: "Subheading",
    listType: "none",
    fontSize: 20,
    bold: true,
    width: 240,
    height: 40,
  },
  paragraph: {
    label: "Add Paragraph",
    value: "Start typing your paragraph text here. You can customize the font, size, and styling anytime.",
    listType: "none",
    fontSize: 14,
    bold: false,
    width: 380,
    height: 84,
  },
  "bullet-list": {
    label: "Add Bullet List",
    value: "Smart lead targeting\nAutomated follow-ups\nPipeline analytics",
    listType: "bullet",
    listItems: ["Smart lead targeting", "Automated follow-ups", "Pipeline analytics"],
    fontSize: 14,
    bold: false,
    width: 260,
    height: 96,
  },
  "numbered-list": {
    label: "Add Numbered List",
    value: "First item\nSecond item\nThird item",
    listType: "numbered",
    listItems: ["First item", "Second item", "Third item"],
    fontSize: 14,
    bold: false,
    width: 260,
    height: 96,
  },
  checklist: {
    label: "Add Checklist",
    value: "Task 1\nTask 2\nTask 3",
    listType: "check",
    listItems: ["Task 1", "Task 2", "Task 3"],
    fontSize: 14,
    bold: false,
    width: 260,
    height: 96,
  },
};

export function useEditorState(fileName?: string) {
  const [doc, setDoc] = useState<PDFDocument>(() => createDemoDocument(fileName));
  const past = useRef<PDFDocument[]>([]);
  const future = useRef<PDFDocument[]>([]);
  const [historyTick, setHistoryTick] = useState(0);

  const [tool, setToolRaw] = useState<ToolId>("select");
  const [activePage, setActivePage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("thumbnails");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("continuous");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modal, setModal] = useState<null | "signature" | "image" | "link" | "crop">(null);
  const [defaults, setDefaults] = useState<ToolDefaults>({
    stroke: "#2f5bd1",
    thickness: 3,
    highlightColor: "#ffd84d",
    highlightOpacity: 45,
  });
  const [textPreset, setTextPreset] = useState<TextPresetKind>("text");
  const [pendingImage, setPendingImage] = useState<{ src: string; alt: string } | null>(null);

  /* ----------------------------- history ----------------------------- */
  const commit = useCallback((updater: (prev: PDFDocument) => PDFDocument) => {
    setDoc((prev) => {
      const next = updater(prev);
      if (next === prev) return prev;
      past.current = [...past.current.slice(-49), prev];
      future.current = [];
      return next;
    });
    setHistoryTick((t) => t + 1);
  }, []);

  const undo = useCallback(() => {
    setDoc((prev) => {
      const last = past.current.pop();
      if (!last) return prev;
      future.current = [prev, ...future.current];
      return last;
    });
    setHistoryTick((t) => t + 1);
  }, []);

  const redo = useCallback(() => {
    setDoc((prev) => {
      const [next, ...rest] = future.current;
      if (!next) return prev;
      future.current = rest;
      past.current = [...past.current, prev];
      return next;
    });
    setHistoryTick((t) => t + 1);
  }, []);

  /* ----------------------------- objects ----------------------------- */
  const allObjects = useMemo(() => doc.pages.flatMap((p) => p.objects), [doc]);
  const selected = useMemo(
    () => allObjects.find((o) => o.id === selectedId) ?? null,
    [allObjects, selectedId],
  );

  const pageIdFor = useCallback(
    (page?: number) => {
      const idx = (page !== undefined ? page : activePage) - 1;
      return doc.pages[idx]?.id ?? doc.pages[0]!.id;
    },
    [doc.pages, activePage],
  );

  const addObject = useCallback(
    (object: Omit<PDFObject, "id">) => {
      const id = nextId(object.type);
      commit((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === object.pageId ? { ...p, objects: [...p.objects, { ...object, id }] } : p,
        ),
      }));
      setSelectedId(id);
      return id;
    },
    [commit],
  );

  const updateObject = useCallback(
    (id: string, patch: Partial<PDFObject>, record = true) => {
      const apply = (prev: PDFDocument): PDFDocument => ({
        ...prev,
        pages: prev.pages.map((p) => ({
          ...p,
          objects: p.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)),
        })),
      });
      if (record) commit(apply);
      else setDoc(apply);
    },
    [commit],
  );

  const updateObjectText = useCallback(
    (id: string, patch: Partial<NonNullable<PDFObject["text"]>>) => {
      commit((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => ({
          ...p,
          objects: p.objects.map((o) =>
            o.id === id && o.text ? { ...o, text: { ...o.text, ...patch } } : o,
          ),
        })),
      }));
    },
    [commit],
  );

  const updateSelected = useCallback(
    (patch: Partial<PDFObject>) => selectedId && updateObject(selectedId, patch),
    [selectedId, updateObject],
  );
  const updateSelectedText = useCallback(
    (patch: Partial<NonNullable<PDFObject["text"]>>) =>
      selectedId && updateObjectText(selectedId, patch),
    [selectedId, updateObjectText],
  );

  const deleteObject = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => ({ ...p, objects: p.objects.filter((o) => o.id !== id) })),
      }));
      setSelectedId((cur) => (cur === id ? null : cur));
    },
    [commit],
  );

  const duplicateObject = useCallback(
    (id: string) => {
      const source = allObjects.find((o) => o.id === id);
      if (!source) return null;
      const copy: Omit<PDFObject, "id"> = {
        type: source.type,
        pageId: source.pageId,
        pageNumber: source.pageNumber,
        x: source.x + 20,
        y: source.y + 20,
        width: source.width,
        height: source.height,
        rotation: source.rotation,
        opacity: source.opacity,
        ...(source.text
          ? {
              text: {
                ...source.text,
                ...(source.text.listItems ? { listItems: [...source.text.listItems] } : {}),
              },
            }
          : {}),
        ...(source.shape ? { shape: { ...source.shape } } : {}),
        ...(source.drawing
          ? { drawing: { ...source.drawing, paths: [...source.drawing.paths] } }
          : {}),
        ...(source.image ? { image: { ...source.image } } : {}),
        ...(source.highlight ? { highlight: { ...source.highlight } } : {}),
        ...(source.note ? { note: { ...source.note } } : {}),
        ...(source.link ? { link: { ...source.link } } : {}),
        ...(source.stamp ? { stamp: { ...source.stamp } } : {}),
        ...(source.signature ? { signature: { ...source.signature } } : {}),
      };
      const newId = addObject(copy);
      setSelectedId(newId);
      return newId;
    },
    [allObjects, addObject],
  );

  const bringToFront = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => {
          const idx = p.objects.findIndex((o) => o.id === id);
          if (idx === -1 || idx === p.objects.length - 1) return p;
          const obj = p.objects[idx]!;
          const rest = p.objects.filter((o) => o.id !== id);
          return { ...p, objects: [...rest, obj] };
        }),
      }));
    },
    [commit],
  );

  const bringForward = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => {
          const idx = p.objects.findIndex((o) => o.id === id);
          if (idx === -1 || idx === p.objects.length - 1) return p;
          const next = [...p.objects];
          const temp = next[idx]!;
          next[idx] = next[idx + 1]!;
          next[idx + 1] = temp;
          return { ...p, objects: next };
        }),
      }));
    },
    [commit],
  );

  const sendBackward = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => {
          const idx = p.objects.findIndex((o) => o.id === id);
          if (idx <= 0) return p;
          const next = [...p.objects];
          const temp = next[idx]!;
          next[idx] = next[idx - 1]!;
          next[idx - 1] = temp;
          return { ...p, objects: next };
        }),
      }));
    },
    [commit],
  );

  const sendToBack = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => {
          const idx = p.objects.findIndex((o) => o.id === id);
          if (idx <= 0) return p;
          const obj = p.objects[idx]!;
          const rest = p.objects.filter((o) => o.id !== id);
          return { ...p, objects: [obj, ...rest] };
        }),
      }));
    },
    [commit],
  );

  /* ------------------------- object factories ------------------------- */
  const addTextObject = useCallback(
    (page: number, x: number, y: number, presetKind: TextPresetKind = "text") => {
      const preset = TEXT_PRESETS[presetKind] ?? TEXT_PRESETS.text;
      return addObject({
        type: "text",
        pageId: pageIdFor(page),
        pageNumber: page,
        x,
        y,
        width: preset.width,
        height: preset.height,
        rotation: 0,
        opacity: 100,
        text: {
          value: preset.value,
          fontFamily: "Inter",
          fontSize: preset.fontSize,
          bold: preset.bold,
          italic: false,
          underline: false,
          color: "#1c2333",
          align: "left",
          listType: preset.listType,
          ...(preset.listItems ? { listItems: [...preset.listItems] } : {}),
        },
      });
    },
    [addObject, pageIdFor],
  );

  const addHighlight = useCallback(
    (page: number, rect: { x: number; y: number; width: number; height: number }) =>
      addObject({
        type: "highlight",
        pageId: pageIdFor(page),
        pageNumber: page,
        ...rect,
        rotation: 0,
        opacity: defaults.highlightOpacity,
        highlight: { color: defaults.highlightColor },
      }),
    [addObject, pageIdFor, defaults],
  );

  const addDrawing = useCallback(
    (
      page: number,
      rect: { x: number; y: number; width: number; height: number },
      paths: string[],
    ) =>
      addObject({
        type: "drawing",
        pageId: pageIdFor(page),
        pageNumber: page,
        ...rect,
        rotation: 0,
        opacity: 100,
        drawing: { paths, stroke: defaults.stroke, thickness: defaults.thickness },
      }),
    [addObject, pageIdFor, defaults],
  );

  const addShape = useCallback(
    (
      page: number,
      kind: ShapeKind,
      rect: { x: number; y: number; width: number; height: number },
    ) =>
      addObject({
        type: "shape",
        pageId: pageIdFor(page),
        pageNumber: page,
        ...rect,
        rotation: 0,
        opacity: 100,
        shape: {
          kind,
          stroke: defaults.stroke,
          fill: "transparent",
          thickness: defaults.thickness,
        },
      }),
    [addObject, pageIdFor, defaults],
  );

  const addNote = useCallback(
    (page: number, x: number, y: number) => {
      const id = addObject({
        type: "note",
        pageId: pageIdFor(page),
        pageNumber: page,
        x,
        y,
        width: 28,
        height: 28,
        rotation: 0,
        opacity: 100,
        note: { body: "", author: "You" },
      });
      setEditingId(id);
      return id;
    },
    [addObject, pageIdFor],
  );

  const addLink = useCallback(
    (page: number, url: string, at?: { x: number; y: number }) =>
      addObject({
        type: "link",
        pageId: pageIdFor(page),
        pageNumber: page,
        x: at?.x ?? 120,
        y: at?.y ?? 240,
        width: 220,
        height: 28,
        rotation: 0,
        opacity: 100,
        link: { url },
      }),
    [addObject, pageIdFor],
  );

  const addSignature = useCallback(
    (page: number, signature: NonNullable<PDFObject["signature"]>) =>
      addObject({
        type: "signature",
        pageId: pageIdFor(page),
        pageNumber: page,
        x: 120,
        y: 720,
        width: 240,
        height: 90,
        rotation: 0,
        opacity: 100,
        signature,
      }),
    [addObject, pageIdFor],
  );

  const addImage = useCallback(
    (
      page: number,
      src: string,
      alt: string,
      at?: { x: number; y: number },
      size?: { width: number; height: number },
    ) =>
      addObject({
        type: "image",
        pageId: pageIdFor(page),
        pageNumber: page,
        x: at?.x ?? 150,
        y: at?.y ?? 300,
        width: size?.width ?? 260,
        height: size?.height ?? 170,
        rotation: 0,
        opacity: 100,
        image: { src, alt, originalSrc: src },
      }),
    [addObject, pageIdFor],
  );

  const addStamp = useCallback(
    (page: number, label: string, color: string) =>
      addObject({
        type: "stamp",
        pageId: pageIdFor(page),
        pageNumber: page,
        x: 430,
        y: 180,
        width: 210,
        height: 74,
        rotation: -8,
        opacity: 100,
        stamp: { label, color },
      }),
    [addObject, pageIdFor],
  );

  /* ------------------------------ pages ------------------------------ */
  const reindex = (pages: PDFDocument["pages"]) =>
    pages.map((p, i) => ({ ...p, index: i, label: `Page ${i + 1}` }));

  const addPage = useCallback(() => {
    const newPageId = nextId("page");
    commit((prev) => {
      const refPage = prev.pages[prev.pages.length - 1] || prev.pages[0];
      const width = refPage ? refPage.width : PAGE_WIDTH;
      const height = refPage ? refPage.height : PAGE_HEIGHT;
      const newPage: PDFPage = {
        id: newPageId,
        index: prev.pages.length,
        label: `Page ${prev.pages.length + 1}`,
        rotation: 0,
        width,
        height,
        template: -1,
        type: "blank",
        objects: [],
      };
      return {
        ...prev,
        pages: reindex([...prev.pages, newPage]),
      };
    });
    setActivePage(doc.pages.length + 1);
  }, [commit, doc.pages.length]);

  const duplicatePage = useCallback(
    (id: string) => {
      commit((prev) => {
        const i = prev.pages.findIndex((p) => p.id === id);
        if (i < 0) return prev;
        const source = prev.pages[i]!;
        const clone: PDFPage = {
          ...source,
          id: nextId("page"),
          type: source.type ?? (source.originalPageNumber ? "pdf" : "blank"),
          ...(source.originalPageNumber !== undefined
            ? { originalPageNumber: source.originalPageNumber }
            : {}),
          objects: source.objects.map((o) => ({ ...o, id: nextId(o.type) })),
        };
        const pages = [...prev.pages];
        pages.splice(i + 1, 0, clone);
        return { ...prev, pages: reindex(pages) };
      });
      setActivePage((prev) => prev + 1);
    },
    [commit],
  );

  const deletePage = useCallback(
    (id: string) => {
      commit((prev) =>
        prev.pages.length <= 1
          ? prev
          : { ...prev, pages: reindex(prev.pages.filter((p) => p.id !== id)) },
      );
      setActivePage((p) => Math.max(1, Math.min(p, doc.pages.length - 1)));
    },
    [commit, doc.pages.length],
  );

  const rotatePage = useCallback(
    (id: string, delta: number) => {
      commit((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === id ? { ...p, rotation: (((p.rotation + delta) % 360) + 360) % 360 } : p,
        ),
      }));
    },
    [commit],
  );

  const movePage = useCallback(
    (from: number, to: number) => {
      if (from === to) return;
      commit((prev) => {
        const pages = [...prev.pages];
        const [moved] = pages.splice(from, 1);
        if (!moved) return prev;
        pages.splice(to, 0, moved);
        return { ...prev, pages: reindex(pages) };
      });
      setActivePage(to + 1);
    },
    [commit],
  );

  const setPdfPages = useCallback(
    (sizes: { width: number; height: number }[], name: string) => {
      past.current = [];
      future.current = [];
      setDoc({
        id: "doc-1",
        fileName: name,
        pageSize: "A4",
        orientation: "Portrait",
        textOverrides: {},
        textColorOverrides: {},
        textBgOverrides: {},
        textStyleOverrides: {},
        pages: sizes.map((s, i) => ({
          id: `page-${i + 1}`,
          index: i,
          label: `Page ${i + 1}`,
          rotation: 0,
          width: s.width,
          height: s.height,
          template: -1,
          type: "pdf" as const,
          originalPageNumber: i + 1,
          objects: [],
        })),
      });
      setActivePage(1);
      setHistoryTick((t) => t + 1);
    },
    [],
  );

  const setDocument = useCallback((restored: PDFDocument, overrideFileName?: string) => {
    past.current = [];
    future.current = [];
    setDoc({
      ...restored,
      fileName: overrideFileName ?? restored.fileName,
      textColorOverrides: restored.textColorOverrides ?? {},
      textBgOverrides: restored.textBgOverrides ?? {},
      textStyleOverrides: restored.textStyleOverrides ?? {},
    });
    setActivePage(1);
    setHistoryTick((t) => t + 1);
  }, []);

  const setTextOverride = useCallback(
    (key: string, value: string, color?: string, bg?: string) => {
      commit((prev) => ({
        ...prev,
        textOverrides: { ...prev.textOverrides, [key]: value },
        textColorOverrides: color
          ? { ...(prev.textColorOverrides ?? {}), [key]: color }
          : (prev.textColorOverrides ?? {}),
        textBgOverrides: bg
          ? { ...(prev.textBgOverrides ?? {}), [key]: bg }
          : (prev.textBgOverrides ?? {}),
        textStyleOverrides: {
          ...(prev.textStyleOverrides ?? {}),
          [key]: {
            ...(prev.textStyleOverrides?.[key] ?? {}),
            ...(color ? { color } : {}),
            ...(bg ? { bg } : {}),
          },
        },
      }));
    },
    [commit],
  );

  const setTextStyleOverride = useCallback(
    (key: string, style: Partial<TextStyleOverride>) => {
      commit((prev) => {
        const existing = prev.textStyleOverrides?.[key] ?? {};
        const merged = { ...existing, ...style };
        return {
          ...prev,
          textStyleOverrides: {
            ...(prev.textStyleOverrides ?? {}),
            [key]: merged,
          },
          textColorOverrides: merged.color
            ? { ...(prev.textColorOverrides ?? {}), [key]: merged.color }
            : (prev.textColorOverrides ?? {}),
          textBgOverrides: merged.bg
            ? { ...(prev.textBgOverrides ?? {}), [key]: merged.bg }
            : (prev.textBgOverrides ?? {}),
        };
      });
    },
    [commit],
  );

  /* ------------------------------- zoom ------------------------------- */
  const zoomIn = useCallback(
    () => setZoom((z) => ZOOM_PRESETS.find((p) => p > z) ?? ZOOM_PRESETS[ZOOM_PRESETS.length - 1]!),
    [],
  );
  const zoomOut = useCallback(
    () => setZoom((z) => [...ZOOM_PRESETS].reverse().find((p) => p < z) ?? ZOOM_PRESETS[0]!),
    [],
  );

  const setTool = useCallback((next: ToolId) => {
    setToolRaw(next);
    if (next !== "select") setSelectedId(null);
    if (next === "sign") setModal("signature");
    if (next === "image") setModal("image");
    if (next === "link") setModal("link");
  }, []);

  const annotations = useMemo(
    () =>
      doc.pages.flatMap((p) =>
        p.objects
          .filter((o) =>
            (["note", "highlight", "signature", "drawing", "stamp", "link"] as PDFObjectType[]).includes(
              o.type,
            ),
          )
          .map((o) => ({ object: o, page: p.index + 1 })),
      ),
    [doc],
  );

  return {
    document: doc,
    annotations,
    tool,
    setTool,
    activePage,
    setActivePage,
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    sidebarTab,
    setSidebarTab,
    sidebarOpen,
    setSidebarOpen,
    panelOpen,
    setPanelOpen,
    viewMode,
    setViewMode,
    selected,
    selectedId,
    setSelectedId,
    editingId,
    setEditingId,
    modal,
    setModal,
    defaults,
    setDefaults,
    addObject,
    updateObject,
    updateObjectText,
    updateSelected,
    updateSelectedText,
    deleteObject,
    duplicateObject,
    bringToFront,
    bringForward,
    sendBackward,
    sendToBack,
    textPreset,
    setTextPreset,
    pendingImage,
    setPendingImage,
    addTextObject,
    addHighlight,
    addDrawing,
    addShape,
    addNote,
    addLink,
    addSignature,
    addImage,
    addStamp,
    addPage,
    duplicatePage,
    deletePage,
    rotatePage,
    movePage,
    setTextOverride,
    setTextStyleOverride,
    setPdfPages,
    setDocument,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    historyTick,
  };
}

export type EditorState = ReturnType<typeof useEditorState>;
