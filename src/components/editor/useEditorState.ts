import { useCallback, useMemo, useState } from "react";
import { createDemoDocument } from "@/lib/demo-document";
import type { PDFObject, SidebarTab, ToolId, ViewMode } from "@/types/pdf";

const mockSelection: PDFObject = {
  id: "obj-1",
  type: "text",
  pageId: "page-1",
  x: 148,
  y: 262,
  width: 320,
  height: 44,
  rotation: 0,
  opacity: 100,
  text: {
    value: "Aarav Sharma",
    fontFamily: "Inter",
    fontSize: 16,
    bold: false,
    italic: false,
    underline: false,
    color: "#1c2333",
    align: "left",
  },
};

export function useEditorState(fileName?: string) {
  const [document] = useState(() => createDemoDocument(fileName));
  const [tool, setTool] = useState<ToolId>("select");
  const [activePage, setActivePage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("thumbnails");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("continuous");
  const [selected, setSelected] = useState<PDFObject | null>(null);

  const selectMockObject = useCallback(() => setSelected(mockSelection), []);
  const updateSelected = useCallback((patch: Partial<PDFObject>) => {
    setSelected((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);
  const updateSelectedText = useCallback((patch: Partial<NonNullable<PDFObject["text"]>>) => {
    setSelected((prev) =>
      prev?.text ? { ...prev, text: { ...prev.text, ...patch } } : prev,
    );
  }, []);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(200, z + 10)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(50, z - 10)), []);

  return useMemo(
    () => ({
      document,
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
      setSelected,
      selectMockObject,
      updateSelected,
      updateSelectedText,
    }),
    [
      document,
      tool,
      activePage,
      zoom,
      sidebarTab,
      sidebarOpen,
      panelOpen,
      viewMode,
      selected,
      zoomIn,
      zoomOut,
      selectMockObject,
      updateSelected,
      updateSelectedText,
    ],
  );
}

export type EditorState = ReturnType<typeof useEditorState>;
