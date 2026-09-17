import {
  ChevronDown,
  Download,
  MoreHorizontal,
  Redo2,
  Save,
  Share2,
  Undo2,
  PanelLeft,
  PanelRight,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BrandMark } from "@/components/BrandMark";
import type { EditorState } from "./useEditorState";

export function EditorHeader({ editor }: { editor: EditorState }) {
  const soon = (label: string) => toast(`${label} is coming in the next pass.`);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-toolbar px-3">
      <Link to="/" className="flex items-center gap-2">
        <BrandMark />
        <span className="hidden text-sm font-semibold tracking-tight sm:inline">PDF Studio</span>
      </Link>

      <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="max-w-[220px] gap-1.5 font-medium">
            <span className="truncate">{editor.document.fileName}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuItem onSelect={() => soon("Rename")}>Rename…</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => soon("Duplicate")}>Make a copy</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => soon("Version history")}>
            Version history
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => soon("Document properties")}>
            Document properties
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="mx-auto flex items-center gap-1">
        <IconAction label="Undo" onClick={editor.undo} disabled={!editor.canUndo}>
          <Undo2 className="h-4 w-4" />
        </IconAction>
        <IconAction label="Redo" onClick={editor.redo} disabled={!editor.canRedo}>
          <Redo2 className="h-4 w-4" />
        </IconAction>
      </div>

      <div className="flex items-center gap-1">
        <IconAction
          label="Toggle pages panel"
          onClick={() => editor.setSidebarOpen(!editor.sidebarOpen)}
          className="hidden lg:inline-flex"
        >
          <PanelLeft className="h-4 w-4" />
        </IconAction>
        <IconAction
          label="Toggle properties"
          onClick={() => editor.setPanelOpen(!editor.panelOpen)}
          className="hidden lg:inline-flex"
        >
          <PanelRight className="h-4 w-4" />
        </IconAction>

        <Separator orientation="vertical" className="mx-1 hidden h-6 md:block" />

        <Button
          variant="ghost"
          size="sm"
          className="hidden gap-1.5 md:inline-flex"
          onClick={() => soon("Save")}
        >
          <Save className="h-4 w-4" /> Save
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="hidden gap-1.5 lg:inline-flex"
          onClick={() => soon("Share")}
        >
          <Share2 className="h-4 w-4" /> Share
        </Button>
        <Button variant="brand" size="sm" className="gap-1.5" onClick={() => soon("Download")}>
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Download</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="More actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={() => soon("Print")}>Print</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => soon("Export")}>Export as…</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => soon("Compress")}>Compress PDF</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => soon("Sign in")}>Sign In</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          className="hidden xl:inline-flex"
          onClick={() => soon("Sign in")}
        >
          Sign In
        </Button>
      </div>
    </header>
  );
}

function IconAction({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} onClick={onClick} className={className}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
