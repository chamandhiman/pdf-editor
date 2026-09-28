import {
  AlignLeft,
  ChevronDown,
  Circle,
  Hand,
  Heading1,
  Heading2,
  Highlighter,
  Image as ImageIcon,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  MousePointer2,
  MoveUpRight,
  Pentagon,
  PenLine,
  PenTool,
  Shapes,
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
import { TEXT_PRESETS, type EditorState, type TextPresetKind } from "./useEditorState";

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

const TEXT_PRESET_ITEMS: {
  id: TextPresetKind;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
}[] = [
  { id: "text", label: "Add Text", icon: Type, hint: "Default text box (16px)" },
  { id: "heading", label: "Add Heading", icon: Heading1, hint: "Large bold title (28px)" },
  { id: "subheading", label: "Add Subheading", icon: Heading2, hint: "Section heading (20px)" },
  { id: "paragraph", label: "Add Paragraph", icon: AlignLeft, hint: "Body paragraph (14px)" },
  { id: "bullet-list", label: "Add Bullet List", icon: List, hint: "Bullet point list (•)" },
  { id: "numbered-list", label: "Add Numbered List", icon: ListOrdered, hint: "Numbered step list (1. 2. 3.)" },
  { id: "checklist", label: "Add Checklist", icon: ListTodo, hint: "Interactive checklist items (☐)" },
];

const shapeTools: ToolDef[] = [
  { id: "rectangle", label: "Rectangle", icon: Square, hint: "Drag to draw a rectangle" },
  { id: "circle", label: "Circle", icon: Circle, hint: "Drag to draw an ellipse" },
  { id: "polygon", label: "Polygon", icon: Pentagon, hint: "Drag to draw a polygon" },
  { id: "line", label: "Line", icon: Minus, hint: "Drag to draw a line" },
  { id: "arrow", label: "Arrow", icon: MoveUpRight, hint: "Drag to draw an arrow" },
];

const shapeSections = [
  {
    label: "Shapes",
    tools: [
      { id: "rectangle", label: "Rectangle", icon: Square, hint: "Drag to draw a rectangle" },
      { id: "circle", label: "Circle", icon: Circle, hint: "Drag to draw an ellipse" },
      { id: "polygon", label: "Polygon", icon: Pentagon, hint: "Drag to draw a polygon" },
    ] as ToolDef[],
  },
  {
    label: "Lines",
    tools: [
      { id: "line", label: "Line", icon: Minus, hint: "Drag to draw a line" },
      { id: "arrow", label: "Arrow", icon: MoveUpRight, hint: "Drag to draw an arrow" },
    ] as ToolDef[],
  },
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

  const GroupMenu = ({
    tools,
    label,
    sections,
    defaultIcon: DefaultIcon,
  }: {
    tools: ToolDef[];
    label: string;
    sections?: { label: string; tools: ToolDef[] }[];
    defaultIcon?: React.ComponentType<{ className?: string }>;
  }) => {
    const activeTool = tools.find((t) => t.id === editor.tool);
    const groupActive = !!activeTool;
    const CurrentIcon = activeTool ? activeTool.icon : (DefaultIcon ?? tools[0]!.icon);
    const currentLabel = activeTool ? activeTool.label : label;
    const currentHint = activeTool ? activeTool.hint : `${label} options`;

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
              aria-pressed={groupActive}
              onClick={() => editor.setTool(activeTool ? activeTool.id : tools[0]!.id)}
              className={cn(
                "h-8 gap-1.5 rounded-r-none px-2 text-muted-foreground hover:text-foreground",
                groupActive && "bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand",
              )}
            >
              <CurrentIcon className="h-4 w-4" />
              <span className="hidden text-xs font-medium xl:inline">{currentLabel}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span className="font-medium">{currentLabel}</span>
            <span className="ml-1.5 text-muted-foreground">{currentHint}</span>
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
            {sections ? (
              sections.map((sec, secIdx) => (
                <div key={sec.label}>
                  {secIdx > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {sec.label}
                  </DropdownMenuLabel>
                  {sec.tools.map((t) => (
                    <DropdownMenuItem
                      key={t.id}
                      onSelect={() => editor.setTool(t.id)}
                      className={cn("cursor-pointer", editor.tool === t.id && "bg-accent font-medium text-brand")}
                    >
                      <t.icon className="mr-2 h-4 w-4" /> {t.label}
                    </DropdownMenuItem>
                  ))}
                </div>
              ))
            ) : (
              tools.map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  onSelect={() => editor.setTool(t.id)}
                  className={cn("cursor-pointer", editor.tool === t.id && "bg-accent font-medium text-brand")}
                >
                  <t.icon className="mr-2 h-4 w-4" /> {t.label}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const AddTextToolGroup = () => {
    const isAddTextActive = editor.tool === "add-text";
    const currentPreset =
      TEXT_PRESET_ITEMS.find((p) => p.id === editor.textPreset) ?? TEXT_PRESET_ITEMS[0]!;
    const CurrentIcon = currentPreset.icon;

    const handleSelectPreset = (presetId: TextPresetKind) => {
      editor.setTextPreset(presetId);
      editor.setTool("add-text");
    };

    return (
      <div
        className={cn(
          "flex shrink-0 items-center rounded-md",
          isAddTextActive && "bg-brand-soft text-brand",
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={isAddTextActive}
              onClick={() => editor.setTool("add-text")}
              className={cn(
                "h-8 gap-1.5 rounded-r-none px-2 text-muted-foreground hover:text-foreground",
                isAddTextActive && "bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand",
              )}
            >
              <CurrentIcon className="h-4 w-4" />
              <span className="hidden text-xs font-medium xl:inline">{currentPreset.label}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span className="font-medium">{currentPreset.label}</span>
            <span className="ml-1.5 text-muted-foreground">Click page to place, or choose preset from dropdown</span>
          </TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Add Text options"
              className={cn(
                "h-8 w-5 rounded-l-none px-0 text-muted-foreground hover:text-foreground",
                isAddTextActive && "text-brand hover:bg-brand-soft hover:text-brand",
              )}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Add Text
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {TEXT_PRESET_ITEMS.map((item) => {
              const ItemIcon = item.icon;
              const isSelected = editor.textPreset === item.id;
              return (
                <DropdownMenuItem
                  key={item.id}
                  onSelect={() => handleSelectPreset(item.id)}
                  className={cn("flex items-center justify-between cursor-pointer py-2", isSelected && "bg-accent/60 font-medium")}
                >
                  <div className="flex items-center gap-2.5">
                    <ItemIcon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-xs leading-none">{item.label}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 leading-none">{item.hint}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono ml-2">
                    {TEXT_PRESETS[item.id].fontSize}px
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <div className="flex h-12 shrink-0 items-center gap-1 overflow-x-auto border-b border-border bg-background px-2 sm:px-3 no-scrollbar touch-scroll">
      {pointerTools.map((t) => (
        <ToolButton key={t.id} tool={t} />
      ))}

      <Separator orientation="vertical" className="mx-1.5 h-6" />
      <AddTextToolGroup />
      <ToolButton tool={{ id: "edit-text", label: "Edit Text", icon: PenLine, showLabel: true, hint: "Edit the document text" }} />

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
      <GroupMenu tools={shapeTools} label="Shapes" sections={shapeSections} defaultIcon={Shapes} />

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
