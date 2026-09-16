import { useCallback, useMemo, useRef, useState } from "react";
import { createDemoDocument, PAGE_HEIGHT, PAGE_WIDTH } from "@/lib/demo-document";
import type {
  PDFDocument,
  PDFObject,
  PDFObjectType,
  ShapeKind,
  SidebarTab,
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
  const [modal, setModal] = useState<null | "signature" | "image" | "link">(null);
  const [defaults, setDefaults] = useState<ToolDefaults>({
    stroke: "#2f5bd1",
    thickness: 3,
    highlightColor: "#ffd84d",
    highlightOpacity: 45,
  });

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
    (page?: number) => doc.pages[(page ?? activePage) - 1]?.id ?? doc.pages[0]!.id,
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
      if (!source) return;
      addObject({ ...source, x: source.x + 24, y: source.y + 24 });
    },
    [allObjects, addObject],
  );

  /* ------------------------- object factories ------------------------- */
  const addTextObject = useCallback(
    (page: number, x: number, y: number) =>
      addObject({
        type: "text",
        pageId: pageIdFor(page),
        x,
        y,
        width: 240,
        height: 40,
        rotation: 0,
        opacity: 100,
        text: {
          value: "Click to edit text",
          fontFamily: "Inter",
          fontSize: 16,
          bold: false,
          italic: false,
          underline: false,
          color: "#1c2333",
          align: "left",
        },
      }),
    [addObject, pageIdFor],
  );

  const addHighlight = useCallback(
    (page: number, rect: { x: number; y: number; width: number; height: number }) =>
      addObject({
        type: "highlight",
        pageId: pageIdFor(page),
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
    (page: number, src: string, alt: string) =>
      addObject({
        type: "image",
        pageId: pageIdFor(page),
        x: 150,
        y: 300,
        width: 260,
        height: 170,
        rotation: 0,
        opacity: 100,
        image: { src, alt },
      }),
    [addObject, pageIdFor],
  );

  const addStamp = useCallback(
    (page: number, label: string, color: string) =>
      addObject({
        type: "stamp",
        pageId: pageIdFor(page),
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
    commit((prev) => ({
      ...prev,
      pages: reindex([
        ...prev.pages,
        {
          id: nextId("page"),
          index: prev.pages.length,
          label: "",
          rotation: 0,
          width: PAGE_WIDTH,
          height: PAGE_HEIGHT,
          template: -1,
          objects: [],
        },
      ]),
    }));
  }, [commit]);

  const duplicatePage = useCallback(
    (id: string) => {
      commit((prev) => {
        const i = prev.pages.findIndex((p) => p.id === id);
        if (i < 0) return prev;
        const source = prev.pages[i]!;
        const clone = {
          ...source,
          id: nextId("page"),
          objects: source.objects.map((o) => ({ ...o, id: nextId(o.type) })),
        };
        const pages = [...prev.pages];
        pages.splice(i + 1, 0, clone);
        return { ...prev, pages: reindex(pages) };
      });
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

  const setTextOverride = useCallback(
    (key: string, value: string) => {
      commit((prev) => ({ ...prev, textOverrides: { ...prev.textOverrides, [key]: value } }));
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
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    historyTick,
  };
}

export type EditorState = ReturnType<typeof useEditorState>;
