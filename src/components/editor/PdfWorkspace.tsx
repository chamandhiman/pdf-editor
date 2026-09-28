import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageLayer } from "./PageLayer";
import { PdfPage } from "./PdfPage";
import type { EditorState } from "./useEditorState";

export function PdfWorkspace({ editor }: { editor: EditorState }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const pages =
    editor.viewMode === "single"
      ? editor.document.pages.filter((p) => p.index + 1 === editor.activePage)
      : editor.document.pages;

  // Auto-fit initial zoom for mobile screens (< 768px)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.innerWidth < 768;
    if (isMobile && pages.length > 0) {
      const activeP = pages[0];
      const pWidth = activeP?.width || 612;
      const availableWidth = window.innerWidth - 20; // 10px breathing room
      if (availableWidth < pWidth) {
        const fitPercent = Math.max(30, Math.min(100, Math.floor((availableWidth / pWidth) * 100)));
        if (editor.zoom === 100) {
          editor.setZoom(fitPercent);
        }
      }
    }
  }, [pages.length]);

  return (
    <ScrollArea className="h-full w-full bg-canvas touch-scroll">
      <div ref={containerRef} className="flex min-h-full w-full justify-center px-1.5 sm:px-6 py-3 sm:py-8">
        <div
          className="flex flex-col items-center gap-6 sm:gap-12 origin-top transition-transform duration-150"
          style={{ zoom: editor.zoom / 100 }}
        >
          {pages.map((page) => (
            <PdfPage
              key={page.id}
              page={page}
              editor={editor}
              active={editor.activePage === page.index + 1}
              onActivate={() => editor.setActivePage(page.index + 1)}
            >
              <PageLayer page={page} editor={editor} pageNumber={page.index + 1} />
            </PdfPage>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
