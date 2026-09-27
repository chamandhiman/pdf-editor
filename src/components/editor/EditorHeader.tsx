import { useState } from "react";
import {
  ChevronDown,
  Copy,
  Download,
  FilePenLine,
  FolderOpen,
  History,
  Info,
  LayoutDashboard,
  Loader2,
  LogOut,
  MoreHorizontal,
  PanelLeft,
  PanelRight,
  Printer,
  Redo2,
  Save,
  Share2,
  Undo2,
  User,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BrandMark } from "@/components/BrandMark";
import { useAuth } from "@/lib/auth-context";
import { downloadEditedPdf, printEditedPdf } from "@/lib/pdf-download";
import type { EditorState } from "./useEditorState";

interface EditorHeaderProps {
  editor: EditorState;
  onReplaceClick: () => void;
  onSignInRequired: () => void;
}

export function EditorHeader({ editor, onReplaceClick, onSignInRequired }: EditorHeaderProps) {
  const { user, signOut } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  const soon = (label: string) => toast(`${label} is coming in the next pass.`);

  const handleDownload = async () => {
    if (downloading) return;
    const toastId = toast.loading("Preparing PDF with your edits…");
    await downloadEditedPdf(
      editor.document,
      () => setDownloading(true),
      (ok) => {
        setDownloading(false);
        toast.dismiss(toastId);
        if (ok) {
          toast.success("Download started — edits included!");
        } else {
          toast.error("Failed to prepare PDF for download.");
        }
      },
    );
  };

  const handlePrint = async () => {
    if (printing) return;
    const toastId = toast.loading("Preparing document for printing…");
    await printEditedPdf(
      editor.document,
      () => setPrinting(true),
      (ok) => {
        setPrinting(false);
        toast.dismiss(toastId);
        if (!ok) {
          toast.info("Opened print dialog.");
        }
      },
    );
  };

  const handleMakeCopy = () => {
    const currentName = editor.document.fileName;
    const baseName = currentName.replace(/\.pdf$/i, "");
    const copyName = `${baseName} (Copy).pdf`;
    editor.setDocument(
      {
        ...editor.document,
        fileName: copyName,
      },
      copyName,
    );
    toast.success(`Created copy: "${copyName}"`);
  };

  const handleRename = () => {
    const current = editor.document.fileName.replace(/\.pdf$/i, "");
    const next = window.prompt("Rename document:", current);
    if (next && next.trim()) {
      const finalName = next.trim().endsWith(".pdf") ? next.trim() : `${next.trim()}.pdf`;
      editor.setDocument(
        {
          ...editor.document,
          fileName: finalName,
        },
        finalName,
      );
      toast.success(`Renamed to "${finalName}"`);
    }
  };

  const handleDocInfo = () => {
    const pageCount = editor.document.pages.length;
    const objCount = editor.document.pages.reduce((acc, p) => acc + p.objects.length, 0);
    toast.info(
      `Document: ${editor.document.fileName} • ${pageCount} page(s) • ${objCount} object(s)`,
    );
  };

  const handleVersionHistory = () => {
    toast.info(`Current version: v1.0 • History actions: ${editor.historyTick}`);
  };

  const handleSave = () => {
    if (!user) {
      onSignInRequired();
      return;
    }
    // TODO: wire to Firestore / Storage
    toast("Cloud save is coming soon. Sign in to be notified.");
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-toolbar px-3">
      {/* Logo + dashboard link */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to="/dashboard" className="flex items-center gap-2">
            <BrandMark />
            <span className="hidden text-sm font-semibold tracking-tight sm:inline">PDF Studio</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent>Back to Dashboard</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

      {/* File menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="max-w-[220px] gap-1.5 font-medium">
            <span className="truncate">{editor.document.fileName}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuItem onSelect={onReplaceClick}>
            <FolderOpen className="mr-2 h-3.5 w-3.5" />
            Replace PDF…
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleRename}>
            <FilePenLine className="mr-2 h-3.5 w-3.5" />
            Rename…
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleMakeCopy}>
            <Copy className="mr-2 h-3.5 w-3.5" />
            Make a copy
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleVersionHistory}>
            <History className="mr-2 h-3.5 w-3.5" />
            Version history
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleDocInfo}>
            <Info className="mr-2 h-3.5 w-3.5" />
            Document properties
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Undo/Redo */}
      <div className="mx-auto flex items-center gap-1">
        <IconAction label="Undo" onClick={editor.undo} disabled={!editor.canUndo}>
          <Undo2 className="h-4 w-4" />
        </IconAction>
        <IconAction label="Redo" onClick={editor.redo} disabled={!editor.canRedo}>
          <Redo2 className="h-4 w-4" />
        </IconAction>
      </div>

      <div className="flex items-center gap-1">
        {/* Panel toggles */}
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

        {/* Dashboard nav button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="hidden md:inline-flex" asChild>
              <Link to="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Dashboard</TooltipContent>
        </Tooltip>

        {/* Save */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden gap-1.5 md:inline-flex"
          onClick={handleSave}
        >
          <Save className="h-4 w-4" /> Save
        </Button>

        {/* Share */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden gap-1.5 lg:inline-flex"
          onClick={() => soon("Share")}
        >
          <Share2 className="h-4 w-4" /> Share
        </Button>

        {/* Download / Print Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="brand"
              size="sm"
              className="gap-1.5"
              disabled={downloading || printing}
            >
              {downloading || printing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {downloading ? "Exporting…" : printing ? "Preparing…" : "Download"}
              </span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={handleDownload} className="cursor-pointer gap-2">
              <Download className="h-4 w-4 text-muted-foreground" />
              <span>Download PDF</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handlePrint} className="cursor-pointer gap-2">
              <Printer className="h-4 w-4 text-muted-foreground" />
              <span>Print PDF</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* More menu - Secondary document actions ONLY */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="More actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={handleMakeCopy} className="cursor-pointer gap-2">
              <Copy className="h-4 w-4 text-muted-foreground" />
              <span>Make a copy</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleRename} className="cursor-pointer gap-2">
              <FilePenLine className="h-4 w-4 text-muted-foreground" />
              <span>Rename…</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleVersionHistory} className="cursor-pointer gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <span>Version history</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleDocInfo} className="cursor-pointer gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span>Document info</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Auth area */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? "User"} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-2 py-1.5">
                <p className="text-[13px] font-medium">{user.displayName ?? "User"}</p>
                <p className="text-[12px] text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={signOut}>
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="hidden xl:inline-flex"
            onClick={onSignInRequired}
          >
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
}

function IconAction({
  label,
  onClick,
  children,
  className,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          onClick={onClick}
          disabled={disabled}
          className={className}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
