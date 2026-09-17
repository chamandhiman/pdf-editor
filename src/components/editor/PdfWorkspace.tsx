import { ScrollArea } from "@/components/ui/scroll-area";
import { PageLayer } from "./PageLayer";
import { PdfPage } from "./PdfPage";
import type { EditorState } from "./useEditorState";

export function PdfWorkspace({ editor }: { editor: EditorState }) {
  const pages =
    editor.viewMode === "single"
      ? editor.document.pages.filter((p) => p.index + 1 === editor.activePage)
      : editor.document.pages;

  return (
    <ScrollArea className="h-full w-full bg-canvas">
      <div className="flex min-h-full w-full justify-center px-6 py-8">
        <div
          className="flex flex-col items-center gap-12 origin-top transition-transform duration-150"
          style={{ zoom: editor.zoom / 100 }}
        >
          {pages.map((page) => (
            <PdfPage
              key={page.id}
              page={page}
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
