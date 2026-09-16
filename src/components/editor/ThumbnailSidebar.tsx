import { Bookmark, FilePlus2, Import, List, MessageSquare, Files } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { demoAnnotations, demoBookmarks, demoOutline } from "@/lib/demo-document";
import type { SidebarTab } from "@/types/pdf";
import { ThumbnailItem } from "./ThumbnailItem";
import type { EditorState } from "./useEditorState";

const tabs: { id: SidebarTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "thumbnails", label: "Thumbnails", icon: Files },
  { id: "outline", label: "Outline", icon: List },
  { id: "annotations", label: "Annotations", icon: MessageSquare },
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
];

export function ThumbnailSidebar({ editor }: { editor: EditorState }) {
  const soon = (label: string) => toast(`${label} is coming in the next pass.`);

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
                active={editor.activePage === page.index + 1}
                onSelect={() => editor.setActivePage(page.index + 1)}
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
            {demoAnnotations.map((a) => (
              <button
                key={a.id}
                onClick={() => editor.setActivePage(a.page)}
                className="block w-full rounded-md border border-border bg-background p-2.5 text-left transition-colors hover:border-brand/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-brand">
                    {a.type}
                  </span>
                  <span className="text-[11px] text-muted-foreground">p. {a.page}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-[13px] text-foreground">{a.text}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{a.author}</p>
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
          onClick={() => soon("Add Page")}
        >
          <FilePlus2 className="h-4 w-4" /> Add Page
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={() => soon("Import Pages")}
        >
          <Import className="h-4 w-4" /> Import Pages
        </Button>
      </div>
    </div>
  );
}
