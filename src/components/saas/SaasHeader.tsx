import { useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import {
  ChevronDown,
  Menu,
  Sparkles,
  ArrowRight,
  FileUp,
  FileText,
  FilePenLine,
  User,
  LogOut,
  LayoutDashboard,
  Heart,
  Cloud,
  Clock,
  Star,
  Settings,
  Type,
  Files,
  Split,
  Zap,
  ArrowUpDown,
  Trash2,
  RotateCw,
  Shield,
  Unlock,
  ScanText,
  PenTool,
  Stamp,
  FileDown,
  FileCode,
  FileSpreadsheet,
  Presentation,
  FileImage,
  Grip,
  CreditCard,
  Building2,
  GraduationCap,
  Globe,
  FileBadge,
  ExternalLink,
  Boxes,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandMark } from "@/components/BrandMark";
import { SignInModal } from "@/components/editor/modals/SignInModal";
import { SupportModal } from "@/components/SupportModal";
import { useAuth } from "@/lib/auth-context";
import { setUploadedPdf } from "@/lib/pdf-store";
import { createBlankPdfDocument } from "@/lib/pdf-create";

interface SaasHeaderProps {
  onToolSelect?: (tool: any) => void;
  onUploadRequest?: () => void;
  onSelectTool?: (tool: any) => void;
  onOpenUploadModal?: () => void;
}

export function SaasHeader({
  onToolSelect,
  onUploadRequest,
  onSelectTool,
  onOpenUploadModal,
}: SaasHeaderProps) {
  const handleUploadRequest = onUploadRequest || onOpenUploadModal;

  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath === path || currentPath.startsWith(path + "/");
  };

  const isConvertActive =
    currentPath.startsWith("/convert") ||
    currentPath.includes("-to-");

  const isToolsActive = currentPath === "/tools" || currentPath.startsWith("/tools/");

  const getNavClass = (active: boolean) =>
    cn(
      "flex items-center gap-1.5 rounded-[4px] px-2.5 py-1.5 text-[13px] font-bold uppercase tracking-tight transition-all group",
      active
        ? "bg-brand/15 text-brand shadow-xs border border-brand/35"
        : "text-foreground/85 hover:text-brand hover:bg-brand/5 border border-transparent"
    );

  const { user, signOut } = useAuth();
  const [signInOpen, setSignInOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      if (typeof window !== "undefined") {
        window.location.replace("/");
      } else {
        navigate({ to: "/" });
      }
    }
  };
  const [supportOpen, setSupportOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateBlank = async () => {
    try {
      const blank = await createBlankPdfDocument("Untitled.pdf");
      setUploadedPdf(blank.bytes, blank.fileName);
      navigate({ to: "/editor", search: { file: blank.fileName } });
    } catch (err) {
      console.error("Failed to create blank document:", err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      const bytes = await file.arrayBuffer();
      setUploadedPdf(bytes, file.name);
      navigate({ to: "/editor", search: { file: file.name } });
    }
  };

  const handleToolClick = (tool: { id: string; name: string; isComingSoon?: boolean }) => {
    setMobileMenuOpen(false);
    if (tool.id === "edit-pdf") {
      navigate({ to: "/edit-pdf" });
      return;
    }
    if (tool.id === "protect-pdf") {
      navigate({ to: "/protect" });
      return;
    }
    if (tool.id === "merge-pdf") {
      navigate({ to: "/merge-pdf" });
      return;
    }
    if (tool.id === "split-pdf") {
      navigate({ to: "/split-pdf" });
      return;
    }
    if (tool.id === "delete-pages") {
      navigate({ to: "/remove-pages" });
      return;
    }
    if (tool.id === "reorder-pages") {
      navigate({ to: "/reorder-pages" });
      return;
    }
    if (tool.id === "unlock-pdf") {
      navigate({ to: "/unlock-pdf" });
      return;
    }
    if (tool.id === "ocr-pdf") {
      navigate({ to: "/ocr-pdf" });
      return;
    }
    if (tool.id === "compress-pdf") {
      navigate({ to: "/compress-pdf" });
      return;
    }
    if (tool.id === "jpg-to-pdf" || tool.id === "image-to-pdf") {
      navigate({ to: "/jpg-to-pdf" });
      return;
    }
    if (tool.id === "png-to-pdf") {
      navigate({ to: "/png-to-pdf" });
      return;
    }
    if (tool.id === "word-to-pdf") {
      navigate({ to: "/word-to-pdf" });
      return;
    }
    if (tool.id === "excel-to-pdf") {
      navigate({ to: "/excel-to-pdf" });
      return;
    }
    if (tool.id === "ppt-to-pdf" || tool.id === "powerpoint-to-pdf") {
      navigate({ to: "/ppt-to-pdf" });
      return;
    }
    if (tool.id === "pdf-to-word") {
      navigate({ to: "/pdf-to-word" });
      return;
    }
    if (tool.id === "pdf-to-excel") {
      navigate({ to: "/pdf-to-excel" });
      return;
    }
    if (tool.id === "pdf-to-ppt") {
      navigate({ to: "/pdf-to-ppt" });
      return;
    }
    if (tool.id === "pdf-to-jpg") {
      navigate({ to: "/pdf-to-jpg" });
      return;
    }
    if (tool.id === "pdf-to-png") {
      navigate({ to: "/pdf-to-png" });
      return;
    }
    if (tool.id === "rotate-pdf") {
      navigate({ to: "/rotate-pdf" });
      return;
    }
    if (tool.id === "watermark-pdf") {
      navigate({ to: "/watermark-pdf" });
      return;
    }
    if (tool.id === "extract-pages" || tool.id === "extract-pdf") {
      navigate({ to: "/extract-pages" });
      return;
    }
    if (tool.id === "page-numbers") {
      navigate({ to: "/page-numbers" });
      return;
    }
    if (tool.id === "sign-pdf") {
      navigate({ to: "/sign-pdf" });
      return;
    }
    if (tool.id === "stamp-pdf") {
      navigate({ to: "/stamp-pdf" });
      return;
    }
    if (tool.isComingSoon) {
      toast.info(`${tool.name} is coming soon in an upcoming update!`);
      return;
    }
    fileInputRef.current?.click();
  };

  const handlePrimaryCta = () => {
    if (handleUploadRequest) {
      handleUploadRequest();
    } else {
      fileInputRef.current?.click();
    }
  };

  // Structured Tool Catalog for Mega Menu
  const editOrganizeTools = [
    { id: "edit-pdf", name: "Edit PDF", desc: "Modify text, add images & markup", icon: Type },
    { id: "merge-pdf", name: "Merge PDF", desc: "Combine multiple PDFs into one", icon: Files },
    { id: "split-pdf", name: "Split PDF", desc: "Separate pages into individual files", icon: Split },
    { id: "compress-pdf", name: "Compress PDF", desc: "Shrink file size with crisp clarity", icon: Zap },
    { id: "reorder-pages", name: "Reorder PDF Pages", desc: "Rearrange page order easily", icon: ArrowUpDown },
    { id: "delete-pages", name: "Delete PDF Pages", desc: "Remove unwanted pages", icon: Trash2 },
    { id: "rotate-pdf", name: "Rotate PDF", desc: "Rotate pages 90° or 180°", icon: RotateCw },
  ];

  const securityUtilityTools = [
    { id: "protect-pdf", name: "Protect PDF", desc: "256-bit AES encryption & password", icon: Shield },
    { id: "unlock-pdf", name: "Unlock PDF", desc: "Remove security passwords", icon: Unlock },
    { id: "ocr-pdf", name: "OCR PDF", desc: "Extract text from scans & images", icon: ScanText },
    { id: "sign-pdf", name: "Sign PDF", desc: "Add digital & draw signatures", icon: PenTool },
    { id: "watermark-pdf", name: "Watermark PDF", desc: "Stamp confidential or custom text", icon: Stamp },
    { id: "extract-pages", name: "Extract PDF Pages", desc: "Save specific pages as new file", icon: FileDown },
  ];

  const conversionTools = [
    { id: "pdf-to-word", name: "PDF to Word", desc: "Convert PDF to editable DOCX", icon: FileCode },
    { id: "pdf-to-excel", name: "PDF to Excel", desc: "Extract tables into XLSX", icon: FileSpreadsheet },
    { id: "pdf-to-ppt", name: "PDF to PowerPoint", desc: "Convert slides to PPTX", icon: Presentation },
    { id: "pdf-to-jpg", name: "PDF to JPG", desc: "Render high-res page images", icon: FileImage },
    { id: "pdf-to-png", name: "PDF to PNG", desc: "Export lossless PNG graphics", icon: FileImage },
    { id: "word-to-pdf", name: "Word to PDF", desc: "Convert DOCX documents to PDF", icon: FileCode },
    { id: "excel-to-pdf", name: "Excel to PDF", desc: "Convert XLSX spreadsheets to PDF", icon: FileSpreadsheet },
    { id: "ppt-to-pdf", name: "PowerPoint to PDF", desc: "Turn PPTX slides into PDF", icon: Presentation },
    { id: "png-to-pdf", name: "PNG to PDF", desc: "Convert PNG images into PDF", icon: FileImage },
    { id: "jpg-to-pdf", name: "JPG to PDF", desc: "Convert JPG photos into PDF", icon: FileUp },
  ];

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <header className="sticky top-0 z-30 w-full border-b border-border/60 bg-background/95 backdrop-blur-md shadow-sm">
        <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90 shrink-0">
            <BrandMark />
            <div className="flex flex-col leading-none text-left">
              <span className="text-[17px] font-black tracking-tight text-foreground flex items-center">
                <span>PDF</span>
                <span className="text-brand ml-1">Studio</span>
              </span>
              <span className="text-[10px] font-medium tracking-normal text-muted-foreground mt-0.5">
                by webtoolocean
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Out in the open like iLovePDF reference */}
          <nav className="hidden items-center gap-1 xl:gap-2 lg:flex">
            <Link
              to="/merge-pdf"
              className={getNavClass(isActive("/merge-pdf"))}
            >
              <Files className="h-4 w-4 text-brand shrink-0 transition-transform group-hover:scale-110" />
              <span>Merge PDF</span>
            </Link>

            <Link
              to="/split-pdf"
              className={getNavClass(isActive("/split-pdf"))}
            >
              <Split className="h-4 w-4 text-brand shrink-0 transition-transform group-hover:scale-110" />
              <span>Split PDF</span>
            </Link>

            <Link
              to="/compress-pdf"
              className={getNavClass(isActive("/compress-pdf"))}
            >
              <Zap className="h-4 w-4 text-brand shrink-0 transition-transform group-hover:scale-110" />
              <span>Compress PDF</span>
            </Link>

            <Link
              to="/edit-pdf"
              className={getNavClass(isActive("/edit-pdf"))}
            >
              <FilePenLine className="h-4 w-4 text-brand shrink-0 transition-transform group-hover:scale-110" />
              <span>Edit PDF</span>
            </Link>

            <Link
              to="/protect"
              className={getNavClass(isActive("/protect"))}
            >
              <Shield className="h-4 w-4 text-brand shrink-0 transition-transform group-hover:scale-110" />
              <span>Protect PDF</span>
            </Link>

            {/* CONVERT PDF DROPDOWN */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(getNavClass(isConvertActive), "cursor-pointer outline-none")}
                >
                  <ArrowUpDown className="h-4 w-4 text-brand shrink-0 transition-transform group-hover:scale-110" />
                  <span>Convert PDF</span>
                  <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 p-2 shadow-xl rounded-xl">
                <DropdownMenuLabel className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Convert to PDF
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => handleToolClick({ id: "word-to-pdf", name: "Word to PDF" })}
                  className="cursor-pointer text-xs py-1.5"
                >
                  <FileCode className="h-3.5 w-3.5 mr-2 text-blue-500" /> Word to PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleToolClick({ id: "excel-to-pdf", name: "Excel to PDF" })}
                  className="cursor-pointer text-xs py-1.5"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Excel to PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleToolClick({ id: "ppt-to-pdf", name: "PowerPoint to PDF" })}
                  className="cursor-pointer text-xs py-1.5"
                >
                  <Presentation className="h-3.5 w-3.5 mr-2 text-amber-500" /> PowerPoint to PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleToolClick({ id: "jpg-to-pdf", name: "JPG to PDF" })}
                  className="cursor-pointer text-xs py-1.5"
                >
                  <FileUp className="h-3.5 w-3.5 mr-2 text-brand" /> JPG to PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleToolClick({ id: "png-to-pdf", name: "PNG to PDF" })}
                  className="cursor-pointer text-xs py-1.5"
                >
                  <FileImage className="h-3.5 w-3.5 mr-2 text-purple-500" /> PNG to PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Convert from PDF
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => handleToolClick({ id: "pdf-to-word", name: "PDF to Word" })}
                  className="cursor-pointer text-xs py-2"
                >
                  <FileCode className="h-3.5 w-3.5 mr-2 text-blue-500" /> PDF to Word
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleToolClick({ id: "pdf-to-excel", name: "PDF to Excel" })}
                  className="cursor-pointer text-xs py-2"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-emerald-500" /> PDF to Excel
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleToolClick({ id: "pdf-to-ppt", name: "PDF to PowerPoint" })}
                  className="cursor-pointer text-xs py-2"
                >
                  <Presentation className="h-3.5 w-3.5 mr-2 text-amber-500" /> PDF to PowerPoint
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleToolClick({ id: "pdf-to-jpg", name: "PDF to JPG" })}
                  className="cursor-pointer text-xs py-2"
                >
                  <FileImage className="h-3.5 w-3.5 mr-2 text-orange-500" /> PDF to JPG
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleToolClick({ id: "pdf-to-png", name: "PDF to PNG" })}
                  className="cursor-pointer text-xs py-2"
                >
                  <FileImage className="h-3.5 w-3.5 mr-2 text-emerald-500" /> PDF to PNG
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* ALL PDF TOOLS MEGA MENU */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(getNavClass(isToolsActive), "cursor-pointer outline-none")}
                >
                  <Sparkles className="h-4 w-4 text-brand shrink-0 transition-transform group-hover:scale-110" />
                  <span>All PDF Tools</span>
                  <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[720px] p-5 shadow-2xl rounded-2xl">
                <div className="grid grid-cols-3 gap-6">
                  {/* Column 1: Edit & Organize */}
                  <div>
                    <DropdownMenuLabel className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Edit & Organize
                    </DropdownMenuLabel>
                    <div className="mt-1.5 space-y-0.5">
                      {editOrganizeTools.map((tool) => (
                        <DropdownMenuItem
                          key={tool.id}
                          onClick={() => handleToolClick(tool)}
                          className="flex items-center justify-between rounded-lg px-2.5 py-2 cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand/10 text-brand">
                              <tool.icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-semibold text-foreground truncate">{tool.name}</span>
                              <span className="text-[11px] text-muted-foreground line-clamp-1">{tool.desc}</span>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: Security & Utilities */}
                  <div>
                    <DropdownMenuLabel className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Security & Utilities
                    </DropdownMenuLabel>
                    <div className="mt-1.5 space-y-0.5">
                      {securityUtilityTools.map((tool) => (
                        <DropdownMenuItem
                          key={tool.id}
                          onClick={() => handleToolClick(tool)}
                          className="flex items-center justify-between rounded-lg px-2.5 py-2 cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
                              <tool.icon className="h-3.5 w-3.5 text-brand" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-semibold text-foreground truncate">{tool.name}</span>
                              <span className="text-[11px] text-muted-foreground line-clamp-1">{tool.desc}</span>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </div>

                  {/* Column 3: Convert PDF */}
                  <div>
                    <DropdownMenuLabel className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Convert PDF
                    </DropdownMenuLabel>
                    <div className="mt-1.5 space-y-0.5">
                      {conversionTools.map((tool) => (
                        <DropdownMenuItem
                          key={tool.id}
                          onClick={() => handleToolClick(tool)}
                          className="flex items-center justify-between rounded-lg px-2.5 py-2 cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                              <tool.icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-semibold text-foreground truncate">{tool.name}</span>
                              <span className="text-[11px] text-muted-foreground line-clamp-1">{tool.desc}</span>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator className="my-3" />
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-[12px] text-muted-foreground">
                    Dedicated PDF tools built for the web
                  </span>
                  <Link
                    to="/tools"
                    className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                  >
                    View All PDF Tools <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-0 px-1.5 rounded-full" id="user-menu-trigger">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? "User"} referrerPolicy="no-referrer" />
                      <AvatarFallback className="text-[10px] bg-brand text-brand-foreground">
                        {(user.displayName ?? user.email ?? "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 shadow-lg rounded-xl">
                  {/* User name header inside dropdown */}
                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? "User"} referrerPolicy="no-referrer" />
                      <AvatarFallback className="text-xs bg-brand text-brand-foreground">
                        {(user.displayName ?? user.email ?? "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate leading-tight">
                        {user.displayName ?? "User"}
                      </span>
                      {user.email && (
                        <span className="text-[10px] text-muted-foreground truncate leading-tight">
                          {user.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <Cloud className="h-4 w-4 text-brand" />
                      <span>My Documents</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Recent</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center">
                <Button
                  size="sm"
                  onClick={() => setSignInOpen(true)}
                  className="rounded-[4px] px-4 py-1.5 text-xs font-bold shadow-md shadow-brand/20 bg-[#e5322d] hover:bg-[#c92a26] text-white transition-all cursor-pointer"
                >
                  Sign In
                </Button>
              </div>
            )}

            {/* 9-DOT PRODUCTS & APPS MEGA MENU (Screenshot feature) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="WebToolOcean Apps & Products"
                  className="flex h-9 w-9 items-center justify-center rounded-[4px] text-foreground hover:bg-muted/70 hover:text-brand transition-colors cursor-pointer outline-none"
                >
                  <Grip className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-[92vw] sm:w-[680px] p-6 shadow-2xl rounded-2xl border border-border/80 bg-popover/98 backdrop-blur-xl"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                  {/* Column 1: Other Products */}
                  <div className="sm:col-span-5 sm:border-r sm:border-border/60 sm:pr-5 space-y-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Other Products
                    </span>
                    <div className="space-y-2.5">
                      <a
                        href="https://Resume.webtoolocean.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-2 rounded-xl hover:bg-muted/60 transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <FileBadge className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground group-hover:text-brand flex items-center gap-1.5">
                            Resume Builder
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                            Resume.webtoolocean.com • AI resume builder
                          </p>
                        </div>
                      </a>

                      <a
                        href="https://builder.webtoolocean.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-2 rounded-xl hover:bg-muted/60 transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground group-hover:text-brand flex items-center gap-1.5">
                            Free Website Builder
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                            builder.webtoolocean.com • Drag & drop sites
                          </p>
                        </div>
                      </a>

                      <a
                        href="https://webtoolocean.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-2 rounded-xl hover:bg-muted/60 transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Boxes className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground group-hover:text-brand flex items-center gap-1.5">
                            WebToolOcean Suite
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                            webtoolocean.com • All-in-one tools
                          </p>
                        </div>
                      </a>
                    </div>
                  </div>

                  {/* Column 2: Solutions */}
                  <div className="sm:col-span-4 sm:border-r sm:border-border/60 sm:pr-5 space-y-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Solutions
                    </span>
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-brand/5 to-orange-500/5 border border-border/60">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-brand" />
                          <span className="text-xs font-bold text-foreground">Business</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Streamlined PDF editing and workflows for business teams.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
                        <div className="flex items-center gap-2 mb-1">
                          <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs font-bold text-foreground">Education</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Smart document tools for students and teachers.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Quick Links (Pricing, Security, Features, About us) */}
                  <div className="sm:col-span-3 space-y-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Company
                    </span>
                    <div className="space-y-1">
                      <Link
                        to="/pricing"
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-muted/70 hover:text-brand transition-colors"
                      >
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span>Pricing</span>
                      </Link>

                      <Link
                        to="/security"
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-muted/70 hover:text-brand transition-colors"
                      >
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span>Security</span>
                      </Link>

                      <Link
                        to="/tools"
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-muted/70 hover:text-brand transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-muted-foreground" />
                        <span>Features</span>
                      </Link>

                      <Link
                        to="/about"
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-muted/70 hover:text-brand transition-colors"
                      >
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span>About us</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden rounded-[4px]" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] overflow-y-auto p-5">
                <SheetHeader className="text-left">
                  <SheetTitle className="flex items-center gap-2 text-left">
                    <BrandMark />
                    <div className="flex flex-col leading-none text-left">
                      <span className="text-base font-black tracking-tight text-foreground">
                        PDF <span className="text-brand">Studio</span>
                      </span>
                      <span className="text-[10px] font-medium tracking-normal text-muted-foreground mt-0.5">
                        by webtoolocean
                      </span>
                    </div>
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-6 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="brand"
                      className="justify-center gap-1.5 text-xs font-bold bg-[#e5322d] text-white rounded-[4px]"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate({ to: "/edit-pdf" });
                      }}
                    >
                      <FileUp className="h-3.5 w-3.5" />
                      Edit PDF
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-center gap-1.5 text-xs font-semibold border-border/80 rounded-[4px]"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleCreateBlank();
                      }}
                    >
                      <FileText className="h-3.5 w-3.5 text-brand" />
                      Blank PDF
                    </Button>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-border">
                    <Link
                      to="/merge-pdf"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-[4px] px-3 py-2 text-sm font-semibold transition-colors",
                        isActive("/merge-pdf")
                          ? "bg-brand/15 text-brand font-bold border border-brand/25"
                          : "hover:bg-muted"
                      )}
                    >
                      <Files className="h-4 w-4 text-brand" />
                      Merge PDF
                    </Link>
                    <Link
                      to="/split-pdf"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-[4px] px-3 py-2 text-sm font-semibold transition-colors",
                        isActive("/split-pdf")
                          ? "bg-brand/15 text-brand font-bold border border-brand/25"
                          : "hover:bg-muted"
                      )}
                    >
                      <Split className="h-4 w-4 text-brand" />
                      Split PDF
                    </Link>
                    <Link
                      to="/compress-pdf"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-[4px] px-3 py-2 text-sm font-semibold transition-colors",
                        isActive("/compress-pdf")
                          ? "bg-brand/15 text-brand font-bold border border-brand/25"
                          : "hover:bg-muted"
                      )}
                    >
                      <Zap className="h-4 w-4 text-brand" />
                      Compress PDF
                    </Link>
                    <Link
                      to="/edit-pdf"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-[4px] px-3 py-2 text-sm font-semibold transition-colors",
                        isActive("/edit-pdf")
                          ? "bg-brand/15 text-brand font-bold border border-brand/25"
                          : "hover:bg-muted"
                      )}
                    >
                      <FilePenLine className="h-4 w-4 text-brand" />
                      Edit PDF
                    </Link>
                    <Link
                      to="/protect"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-[4px] px-3 py-2 text-sm font-semibold transition-colors",
                        isActive("/protect")
                          ? "bg-brand/15 text-brand font-bold border border-brand/25"
                          : "hover:bg-muted"
                      )}
                    >
                      <Shield className="h-4 w-4 text-brand" />
                      Protect PDF
                    </Link>
                    <Link
                      to="/jpg-to-pdf"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-[4px] px-3 py-2 text-sm font-semibold transition-colors",
                        isActive("/jpg-to-pdf")
                          ? "bg-brand/15 text-brand font-bold border border-brand/25"
                          : "hover:bg-muted"
                      )}
                    >
                      <FileUp className="h-4 w-4 text-brand" />
                      Image to PDF
                    </Link>
                    <Link
                      to="/pdf-to-word"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-[4px] px-3 py-2 text-sm font-semibold transition-colors",
                        isActive("/pdf-to-word")
                          ? "bg-brand/15 text-brand font-bold border border-brand/25"
                          : "hover:bg-muted"
                      )}
                    >
                      <FileCode className="h-4 w-4 text-brand" />
                      PDF to Word
                    </Link>
                    <Link
                      to="/pdf-to-excel"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-[4px] px-3 py-2 text-sm font-semibold transition-colors",
                        isActive("/pdf-to-excel")
                          ? "bg-brand/15 text-brand font-bold border border-brand/25"
                          : "hover:bg-muted"
                      )}
                    >
                      <FileSpreadsheet className="h-4 w-4 text-brand" />
                      PDF to Excel
                    </Link>
                    <Link
                      to="/word-to-pdf"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-[4px] px-3 py-2 text-sm font-semibold transition-colors",
                        isActive("/word-to-pdf")
                          ? "bg-brand/15 text-brand font-bold border border-brand/25"
                          : "hover:bg-muted"
                      )}
                    >
                      <FileCode className="h-4 w-4 text-blue-500" />
                      Word to PDF
                    </Link>
                    <Link
                      to="/excel-to-pdf"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-[4px] px-3 py-2 text-sm font-semibold transition-colors",
                        isActive("/excel-to-pdf")
                          ? "bg-brand/15 text-brand font-bold border border-brand/25"
                          : "hover:bg-muted"
                      )}
                    >
                      <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                      Excel to PDF
                    </Link>
                    <Link
                      to="/ppt-to-pdf"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-[4px] px-3 py-2 text-sm font-semibold transition-colors",
                        isActive("/ppt-to-pdf")
                          ? "bg-brand/15 text-brand font-bold border border-brand/25"
                          : "hover:bg-muted"
                      )}
                    >
                      <Presentation className="h-4 w-4 text-amber-500" />
                      PowerPoint to PDF
                    </Link>
                    <Link
                      to="/png-to-pdf"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-[4px] px-3 py-2 text-sm font-semibold transition-colors",
                        isActive("/png-to-pdf")
                          ? "bg-brand/15 text-brand font-bold border border-brand/25"
                          : "hover:bg-muted"
                      )}
                    >
                      <FileImage className="h-4 w-4 text-purple-500" />
                      PNG to PDF
                    </Link>
                    <Link
                      to="/tools"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-[4px] px-3 py-2 text-sm font-semibold transition-colors",
                        isToolsActive
                          ? "bg-brand/15 text-brand font-bold border border-brand/25"
                          : "hover:bg-muted"
                      )}
                    >
                      <Sparkles className="h-4 w-4 text-brand" />
                      All PDF Tools
                    </Link>
                  </div>

                  <div className="space-y-1 pt-3 border-t border-border">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3">
                      Other Products
                    </span>
                    <a
                      href="https://Resume.webtoolocean.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-muted rounded-lg"
                    >
                      <span>Resume.webtoolocean.com</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                    <a
                      href="https://builder.webtoolocean.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-muted rounded-lg"
                    >
                      <span>builder.webtoolocean.com</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  </div>

                  <div className="pt-3 border-t border-border space-y-1">
                    <Link
                      to="/about"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-muted rounded-lg"
                    >
                      <Heart className="h-3.5 w-3.5 text-rose-500" />
                      About us
                    </Link>
                    <Link
                      to="/pricing"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-muted rounded-lg"
                    >
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                      Pricing
                    </Link>
                    <Link
                      to="/security"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-muted rounded-lg"
                    >
                      <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                      Security
                    </Link>
                    <Link
                      to="/contact"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-muted rounded-lg"
                    >
                      <Mail className="h-3.5 w-3.5 text-brand" />
                      Contact Support
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <SignInModal open={signInOpen} onOpenChange={setSignInOpen} />
      <SupportModal open={supportOpen} onOpenChange={setSupportOpen} />
    </>
  );
}
