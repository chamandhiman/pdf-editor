import { Maximize2, Minus, Plus, Rows3, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { EditorState } from "./useEditorState";

export function BottomToolbar({ editor }: { editor: EditorState }) {
  return (
    <div className="flex h-9 shrink-0 items-center gap-2 border-t border-border bg-toolbar px-3 text-[12px] text-muted-foreground">
      <span className="tabular-nums">
        Page {editor.activePage} of {editor.document.pages.length}
      </span>

      <div className="mx-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="iconSm"
          aria-label="Zoom out"
          onClick={editor.zoomOut}
          className="text-muted-foreground"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-11 text-center tabular-nums text-foreground">{editor.zoom}%</span>
        <Button
          variant="ghost"
          size="iconSm"
          aria-label="Zoom in"
          onClick={editor.zoomIn}
          className="text-muted-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <Separator orientation="vertical" className="mx-1.5 h-5" />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[12px] text-muted-foreground"
          onClick={() => editor.setZoom(115)}
        >
          Fit Width
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[12px] text-muted-foreground"
          onClick={() => editor.setZoom(80)}
        >
          Fit Page
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <ViewToggle
          active={editor.viewMode === "single"}
          label="Single Page"
          onClick={() => editor.setViewMode("single")}
        >
          <Square className="h-3.5 w-3.5" />
        </ViewToggle>
        <ViewToggle
          active={editor.viewMode === "continuous"}
          label="Continuous"
          onClick={() => editor.setViewMode("continuous")}
        >
          <Rows3 className="h-3.5 w-3.5" />
        </ViewToggle>
        <Separator orientation="vertical" className="mx-1 h-5" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="iconSm"
              aria-label="Fullscreen"
              className="text-muted-foreground"
              onClick={() => {
                if (typeof document !== "undefined") {
                  if (document.fullscreenElement) void document.exitFullscreen();
                  else void document.documentElement.requestFullscreen?.().catch(() => {
                    toast("Fullscreen is unavailable here.");
                  });
                }
              }}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fullscreen</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function ViewToggle({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={active}
          onClick={onClick}
          className={cn(
            "h-7 gap-1.5 px-2 text-[12px] text-muted-foreground",
            active && "bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand",
          )}
        >
          {children}
          <span className="hidden sm:inline">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
