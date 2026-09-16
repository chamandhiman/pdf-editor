import { Files, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { ThumbnailSidebar } from "@/components/editor/ThumbnailSidebar";
import { PdfWorkspace } from "@/components/editor/PdfWorkspace";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { BottomToolbar } from "@/components/editor/BottomToolbar";
import { useEditorState } from "@/components/editor/useEditorState";

export function EditorPage({ fileName }: { fileName?: string }) {
  const editor = useEditorState(fileName);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <EditorHeader editor={editor} />
      <EditorToolbar editor={editor} />

      <div className="flex min-h-0 flex-1">
        {editor.sidebarOpen && (
          <aside className="hidden w-[228px] shrink-0 border-r border-border lg:block">
            <ThumbnailSidebar editor={editor} />
          </aside>
        )}

        <main className="min-w-0 flex-1">
          <PdfWorkspace editor={editor} />
        </main>

        {editor.panelOpen && (
          <aside className="hidden w-[272px] shrink-0 border-l border-border lg:block">
            <PropertiesPanel editor={editor} />
          </aside>
        )}
      </div>

      <div className="flex h-11 items-center justify-between gap-2 border-t border-border bg-toolbar px-3 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <Files className="h-4 w-4" /> Pages
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] p-0">
            <SheetHeader className="border-b border-border p-3">
              <SheetTitle className="text-sm">Pages</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100%-3.25rem)]">
              <ThumbnailSidebar editor={editor} />
            </div>
          </SheetContent>
        </Sheet>

        <span className="text-[12px] tabular-nums text-muted-foreground">
          {editor.activePage} / {editor.document.pages.length}
        </span>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" /> Properties
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[288px] p-0">
            <SheetHeader className="border-b border-border p-3">
              <SheetTitle className="text-sm">Properties</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100%-3.25rem)]">
              <PropertiesPanel editor={editor} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden lg:block">
        <BottomToolbar editor={editor} />
      </div>
    </div>
  );
}
