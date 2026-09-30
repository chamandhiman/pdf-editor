import { useState } from "react";
import {
  ChevronDown,
  Copy,
  Download,
  FilePenLine,
  FolderOpen,
  History,
  Cloud,
  Check,
  Info,
  LayoutDashboard,
  Loader2,
  LogOut,
  PanelLeft,
  PanelRight,
  Printer,
  Redo2,
  Save,
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
import { cn } from "@/lib/utils";
import type { EditorState } from "./useEditorState";

interface EditorHeaderProps {
  editor: EditorState;
  onReplaceClick: () => void;
  onSignInRequired: () => void;
  onSaveClick: () => void;
  onLeaveClick?: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
}

export function EditorHeader({
  editor,
  onReplaceClick,
  onSignInRequired,
  onSaveClick,
  onLeaveClick,
  isSaving = false,
  isSaved = false,
}: EditorHeaderProps) {
  const { user, signOut } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

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


  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-1 sm:gap-2 border-b border-border bg-toolbar px-2 sm:px-3 pt-safe">
      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
        {/* Logo: Back to Home for guests, or Dashboard for authenticated users */}
        <Tooltip>
          <TooltipTrigger asChild>
            {onLeaveClick ? (
              <button
                type="button"
                onClick={onLeaveClick}
                className="flex items-center gap-1.5 shrink-0 hover:opacity-85 transition-opacity cursor-pointer text-left"
              >
                <BrandMark />
                <div className="hidden sm:flex flex-col leading-none text-left">
                  <span className="text-xs font-black tracking-tight text-foreground">
                    PDF <span className="text-brand">Studio</span>
                  </span>
                  <span className="text-[9px] font-medium text-muted-foreground mt-0.5">
                    by webtoolocean
                  </span>
                </div>
              </button>
            ) : (
              <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-1.5 shrink-0">
                <BrandMark />
                <div className="hidden sm:flex flex-col leading-none text-left">
                  <span className="text-xs font-black tracking-tight text-foreground">
                    PDF <span className="text-brand">Studio</span>
                  </span>
                  <span className="text-[9px] font-medium text-muted-foreground mt-0.5">
                    by webtoolocean
                  </span>
                </div>
              </Link>
            )}
          </TooltipTrigger>
          <TooltipContent>Back to Home</TooltipContent>
        </Tooltip>

        {/* Dashboard button with icon + label on logo's right side */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
          style={{ borderRadius: "4px" }}
          asChild
        >
          <Link to="/dashboard">
            <LayoutDashboard className="h-3.5 w-3.5 text-brand" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </Button>

        <Separator orientation="vertical" className="mx-0.5 hidden h-5 sm:block" />

        {/* File menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="max-w-[100px] xs:max-w-[140px] sm:max-w-[180px] md:max-w-[220px] gap-1 px-1.5 sm:px-2 font-medium">
              <span className="truncate text-xs sm:text-sm">{editor.document.fileName}</span>
              <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem onSelect={onSaveClick} className="gap-2 font-medium">
              <Cloud className="mr-1 h-3.5 w-3.5 text-brand" />
              Save to Cloud…
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
      </div>

      {/* Undo/Redo */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        <IconAction label="Undo" onClick={editor.undo} disabled={!editor.canUndo} className="h-8 w-8">
          <Undo2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </IconAction>
        <IconAction label="Redo" onClick={editor.redo} disabled={!editor.canRedo} className="h-8 w-8">
          <Redo2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </IconAction>
      </div>

      <div className="flex items-center gap-1 shrink-0">
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

        {/* Save button */}
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5 px-2.5 h-8 sm:h-9 text-xs font-semibold border-border/80 hover:bg-muted transition-all",
            isSaved && "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15"
          )}
          onClick={onSaveClick}
          disabled={isSaving}
          title={user ? "Save document to cloud" : "Sign in to save document"}
          style={{ borderRadius: "4px" }}
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
          ) : isSaved ? (
            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Cloud className="h-3.5 w-3.5 text-brand" />
          )}
          <span>
            {isSaving ? "Saving…" : isSaved ? "Saved" : "Save"}
          </span>
        </Button>

        {/* Download / Print Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="brand"
              size="sm"
              className="h-8 sm:h-9 gap-1.5 px-2.5 sm:px-3 text-xs font-semibold"
              disabled={downloading || printing}
              style={{ borderRadius: "4px" }}
            >
              {downloading || printing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>
                {downloading ? "Downloading…" : printing ? "Preparing…" : "Download"}
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

        {/* Auth area */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? "User"} referrerPolicy="no-referrer" />
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
              <DropdownMenuItem asChild>
                <Link to="/dashboard" className="cursor-pointer gap-2 flex items-center">
                  <LayoutDashboard className="mr-2 h-3.5 w-3.5" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={signOut} className="cursor-pointer">
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
