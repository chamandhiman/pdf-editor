import {
  ChevronDown,
  Circle,
  Hand,
  Highlighter,
  Image as ImageIcon,
  Link2,
  Minus,
  MousePointer2,
  MoveUpRight,
  Pentagon,
  PenLine,
  PenTool,
  Signature,
  Square,
  Stamp,
  StickyNote,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { stampPresets } from "@/lib/demo-document";
import { cn } from "@/lib/utils";
import type { ToolId } from "@/types/pdf";
import type { EditorState } from "./useEditorState";

interface ToolDef {
  id: ToolId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
  showLabel?: boolean;
}

const pointerTools: ToolDef[] = [
  { id: "select", label: "Select", icon: MousePointer2, hint: "Select and move objects" },
  { id: "hand", label: "Hand", icon: Hand, hint: "Pan the document" },
];

const textTools: ToolDef[] = [
  { id: "add-text", label: "Add Text", icon: Type, showLabel: true, hint: "Click the page to place a text box" },
  { id: "edit-text", label: "Edit Text", icon: PenLine, showLabel: true, hint: "Edit the document text" },
];

const lineTools: ToolDef[] = [
  { id: "line", label: "Line", icon: Minus, hint: "Drag to draw a line" },
  { id: "arrow", label: "Arrow", icon: MoveUpRight, hint: "Drag to draw an arrow" },
];

const shapeTools: ToolDef[] = [
  { id: "rectangle", label: "Rectangle", icon: Square, hint: "Drag to draw a rectangle" },
  { id: "circle", label: "Circle", icon: Circle, hint: "Drag to draw an ellipse" },
  { id: "polygon", label: "Polygon", icon: Pentagon, hint: "Drag to draw a polygon" },
];

const markupTools: ToolDef[] = [
  { id: "highlight", label: "Highlight", icon: Highlighter, hint: "Drag across text to highlight" },
  { id: "image", label: "Image", icon: ImageIcon, hint: "Insert an image" },
  { id: "link", label: "Link", icon: Link2, hint: "Add a link area" },
  { id: "note", label: "Note", icon: StickyNote, hint: "Click the page to add a comment" },
];

export function EditorToolbar({ editor }: { editor: EditorState }) {
  const ToolButton = ({ tool }: { tool: ToolDef }) => {
    const active = editor.tool === tool.id;
    return (
      <Tooltip>
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
            {tool.showLabel && <span className="hidden text-xs font-medium xl:inline">{tool.label}</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span className="font-medium">{tool.label}</span>
          <span className="ml-1.5 text-muted-foreground">{tool.hint}</span>
        </TooltipContent>
      </Tooltip>
    );
  };

  const GroupMenu = ({ tools, label }: { tools: ToolDef[]; label: string }) => {
    const activeTool = tools.find((t) => t.id === editor.tool) ?? tools[0]!;
    const groupActive = tools.some((t) => t.id === editor.tool);
    return (
      <div
        className={cn(
          "flex shrink-0 items-center rounded-md",
          groupActive && "bg-brand-soft text-brand",
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.setTool(activeTool.id)}
              className={cn(
                "h-8 gap-1.5 rounded-r-none px-2 text-muted-foreground hover:text-foreground",
                groupActive && "text-brand hover:bg-brand-soft hover:text-brand",
              )}
            >
              <activeTool.icon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span className="font-medium">{activeTool.label}</span>
            <span className="ml-1.5 text-muted-foreground">{activeTool.hint}</span>
          </TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`${label} options`}
              className={cn(
                "h-8 w-5 rounded-l-none px-0 text-muted-foreground",
                groupActive && "text-brand hover:bg-brand-soft hover:text-brand",
              )}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {label}
            </DropdownMenuLabel>
            {tools.map((t) => (
              <DropdownMenuItem key={t.id} onSelect={() => editor.setTool(t.id)}>
                <t.icon className="mr-2 h-4 w-4" /> {t.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <div className="flex h-12 shrink-0 items-center gap-1 overflow-x-auto border-b border-border bg-background px-3">
      {pointerTools.map((t) => (
        <ToolButton key={t.id} tool={t} />
      ))}

      <Separator orientation="vertical" className="mx-1.5 h-6" />
      {textTools.map((t) => (
        <ToolButton key={t.id} tool={t} />
      ))}

      <Separator orientation="vertical" className="mx-1.5 h-6" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={editor.tool === "sign"}
            onClick={() => editor.setTool("sign")}
            className={cn(
              "h-8 shrink-0 gap-1.5 px-2 text-muted-foreground hover:text-foreground",
              editor.tool === "sign" && "bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand",
            )}
          >
            <Signature className="h-4 w-4" />
            <span className="hidden text-xs font-medium xl:inline">Sign</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Sign — draw, type or upload a signature</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-1.5 h-6" />
      <ToolButton tool={{ id: "draw", label: "Draw", icon: PenTool, hint: "Freehand drawing" }} />
      <GroupMenu tools={lineTools} label="Lines" />
      <GroupMenu tools={shapeTools} label="Shapes" />

      <Separator orientation="vertical" className="mx-1.5 h-6" />
      {markupTools.map((t) => (
        <ToolButton key={t.id} tool={t} />
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
          >
            <Stamp className="h-4 w-4" />
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Stamps
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {stampPresets.map((s) => (
            <DropdownMenuItem
              key={s.label}
              onSelect={() => editor.addStamp(editor.activePage, s.label, s.color)}
            >
              <span
                className="mr-2 h-2.5 w-2.5 rounded-full"
                style={{ background: s.color }}
                aria-hidden
              />
              {s.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
