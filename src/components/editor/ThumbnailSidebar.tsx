import { useState } from "react";
import { Bookmark, FilePlus2, Import, List, MessageSquare, Files } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { demoBookmarks, demoOutline } from "@/lib/demo-document";
import type { PDFObject, SidebarTab } from "@/types/pdf";
import type { PdfDocumentProxy } from "@/lib/pdf-loader";
import { ThumbnailItem } from "./ThumbnailItem";
import { usePdfDoc } from "./usePdfDocument";
import type { EditorState } from "./useEditorState";

const tabs: { id: SidebarTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "thumbnails", label: "Thumbnails", icon: Files },
  { id: "outline", label: "Outline", icon: List },
  { id: "annotations", label: "Annotations", icon: MessageSquare },
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
];

const summarise = (o: PDFObject) => {
  if (o.type === "note") return o.note?.body || "Empty note";
  if (o.type === "link") return o.link?.url ?? "";
  if (o.type === "stamp") return o.stamp?.label ?? "";
  if (o.type === "signature") return o.signature?.name ?? "Signature placed";
  if (o.type === "highlight") return "Highlighted area";
  return "Freehand drawing";
};

export function ThumbnailSidebar({ editor, doc: propDoc }: { editor: EditorState; doc?: PdfDocumentProxy | null }) {
  const contextDoc = usePdfDoc();
  const doc = propDoc !== undefined ? propDoc : contextDoc;

  // Drag and drop state for page sorting
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ pageId: string; position: "before" | "after" } | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, pageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!draggedId || draggedId === pageId) {
      setDropTarget(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const isAfter = (e.clientX - rect.left) > rect.width / 2;
    setDropTarget({ pageId, position: isAfter ? "after" : "before" });
  };

  const handleDragLeave = (e: React.DragEvent, pageId: string) => {
    const related = e.relatedTarget as HTMLElement | null;
    if (!e.currentTarget.contains(related)) {
      setDropTarget((prev) => (prev?.pageId === pageId ? null : prev));
    }
  };

  const handleDrop = (e: React.DragEvent, targetPageId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetPageId) {
      setDraggedId(null);
      setDropTarget(null);
      return;
    }

    const pages = editor.document.pages;
    const fromIndex = pages.findIndex((p) => p.id === draggedId);
    const targetIndex = pages.findIndex((p) => p.id === targetPageId);
    if (fromIndex < 0 || targetIndex < 0) {
      setDraggedId(null);
      setDropTarget(null);
      return;
    }

    const isAfter = dropTarget?.position === "after";
    let finalIndex = isAfter ? targetIndex + 1 : targetIndex;
    if (fromIndex < finalIndex) {
      finalIndex -= 1;
    }

    if (fromIndex !== finalIndex) {
      editor.movePage(fromIndex, finalIndex);
    }

    setDraggedId(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDropTarget(null);
  };

  return (
    <div className="flex h-full w-full flex-col bg-toolbar">
      <Tabs
        value={editor.sidebarTab}
        onValueChange={(v) => editor.setSidebarTab(v as SidebarTab)}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <div className="border-b border-border px-2 py-2">
          <TabsList className="grid h-9 w-full grid-cols-4 bg-muted/70 p-0.5">
            {tabs.map((t) => (
              <Tooltip key={t.id}>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value={t.id}
                    aria-label={t.label}
                    className="h-8 data-[state=active]:bg-background data-[state=active]:text-brand"
                  >
                    <t.icon className="h-4 w-4" />
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>{t.label}</TooltipContent>
              </Tooltip>
            ))}
          </TabsList>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <TabsContent value="thumbnails" className="m-0 grid grid-cols-2 gap-3 p-3">
            {editor.document.pages.map((page) => (
              <ThumbnailItem
                key={page.id}
                page={page}
                doc={doc}
                active={editor.activePage === page.index + 1}
                isDragging={draggedId === page.id}
                dropPosition={dropTarget?.pageId === page.id ? dropTarget.position : null}
                onSelect={() => {
                  editor.setActivePage(page.index + 1);
                  const el = document.getElementById(`pdf-page-${page.index + 1}`);
                  el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }}
                onRotate={(delta) => editor.rotatePage(page.id, delta)}
                onDuplicate={() => editor.duplicatePage(page.id)}
                onDelete={() => editor.deletePage(page.id)}
                onDragStart={(e) => handleDragStart(e, page.id)}
                onDragOver={(e) => handleDragOver(e, page.id)}
                onDragLeave={(e) => handleDragLeave(e, page.id)}
                onDrop={(e) => handleDrop(e, page.id)}
                onDragEnd={handleDragEnd}
              />
            ))}
          </TabsContent>

          <TabsContent value="outline" className="m-0 p-2">
            {demoOutline.map((item) => (
              <button
                key={item.id}
                onClick={() => editor.setActivePage(item.page)}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                style={{ paddingLeft: 8 + item.level * 14 }}
              >
                <span className="truncate">{item.title}</span>
                <span className="tabular-nums text-[11px]">{item.page}</span>
              </button>
            ))}
          </TabsContent>

          <TabsContent value="annotations" className="m-0 space-y-2 p-3">
            {editor.annotations.length === 0 && (
              <p className="px-1 py-6 text-center text-[12px] text-muted-foreground">
                No annotations yet. Add a note, highlight or stamp to see it here.
              </p>
            )}
            {editor.annotations.map(({ object, page }) => (
              <button
                key={object.id}
                onClick={() => {
                  editor.setActivePage(page);
                  editor.setSelectedId(object.id);
                }}
                className="block w-full rounded-md border border-border bg-background p-2.5 text-left transition-colors hover:border-brand/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-brand">
                    {object.type}
                  </span>
                  <span className="text-[11px] text-muted-foreground">p. {page}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-[13px] text-foreground">{summarise(object)}</p>
              </button>
            ))}
          </TabsContent>

          <TabsContent value="bookmarks" className="m-0 p-2">
            {demoBookmarks.map((b) => (
              <button
                key={b.id}
                onClick={() => editor.setActivePage(b.page)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Bookmark className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{b.title}</span>
                <span className="ml-auto tabular-nums text-[11px]">{b.page}</span>
              </button>
            ))}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      <div className="shrink-0 space-y-1.5 border-t border-border p-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => {
            editor.addPage();
            toast.success("Added new blank page");
          }}
        >
          <FilePlus2 className="h-4 w-4" /> Add Page
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={() => toast("Importing pages from another file is coming next.")}
        >
          <Import className="h-4 w-4" /> Import Pages
        </Button>
      </div>
    </div>
  );
}
