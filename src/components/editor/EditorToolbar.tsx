import {
  Hand,
  Highlighter,
  Image as ImageIcon,
  Link2,
  MousePointer2,
  PenLine,
  PenTool,
  Signature,
  StickyNote,
  Stamp,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ToolId } from "@/types/pdf";
import type { EditorState } from "./useEditorState";

interface ToolDef {
  id: ToolId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  showLabel?: boolean;
  hint: string;
}

const groups: ToolDef[][] = [
  [
    { id: "select", label: "Select", icon: MousePointer2, hint: "Select and move objects" },
    { id: "hand", label: "Hand", icon: Hand, hint: "Pan the document" },
  ],
  [
    { id: "add-text", label: "Add Text", icon: Type, showLabel: true, hint: "Insert a text box" },
    { id: "edit-text", label: "Edit Text", icon: PenLine, showLabel: true, hint: "Edit existing text" },
    { id: "sign", label: "Sign", icon: Signature, showLabel: true, hint: "Place a signature" },
  ],
  [
    { id: "draw", label: "Draw", icon: PenTool, hint: "Freehand drawing" },
    { id: "highlight", label: "Highlight", icon: Highlighter, hint: "Highlight text" },
    { id: "image", label: "Image", icon: ImageIcon, hint: "Insert an image" },
    { id: "stamp", label: "Stamp", icon: Stamp, hint: "Add a stamp" },
    { id: "link", label: "Link", icon: Link2, hint: "Add a link" },
    { id: "note", label: "Note", icon: StickyNote, hint: "Add a sticky note" },
  ],
];

export function EditorToolbar({ editor }: { editor: EditorState }) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-1 overflow-x-auto border-b border-border bg-background px-3">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-1">
          {gi > 0 && <Separator orientation="vertical" className="mx-1.5 h-6" />}
          {group.map((tool) => {
            const active = editor.tool === tool.id;
            return (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-pressed={active}
                    onClick={() => editor.setTool(tool.id)}
                    className={cn(
                      "h-8 shrink-0 gap-1.5 px-2 text-muted-foreground hover:text-foreground",
                      active && "bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand",
                    )}
                  >
                    <tool.icon className="h-4 w-4" />
                    {tool.showLabel && (
                      <span className="hidden text-xs font-medium xl:inline">{tool.label}</span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="font-medium">{tool.label}</span>
                  <span className="ml-1.5 text-muted-foreground">{tool.hint}</span>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      ))}
    </div>
  );
}
