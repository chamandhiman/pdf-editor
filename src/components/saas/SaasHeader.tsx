import { useState, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  Menu,
  Sparkles,
  ArrowRight,
  FileUp,
  User,
  LogOut,
  LayoutDashboard,
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
import { useAuth } from "@/lib/auth-context";
import { ALL_PDF_TOOLS, type PDFToolDef } from "@/lib/pdf-tools-data";
import { setUploadedPdf } from "@/lib/pdf-store";

interface SaasHeaderProps {
  onToolSelect?: (tool: PDFToolDef) => void;
  onUploadRequest?: () => void;
  onSelectTool?: (tool: PDFToolDef) => void;
  onOpenUploadModal?: () => void;
}

export function SaasHeader({
  onToolSelect,
  onUploadRequest,
  onSelectTool,
  onOpenUploadModal,
}: SaasHeaderProps) {
  const handleToolSelect = onToolSelect || onSelectTool;
  const handleUploadRequest = onUploadRequest || onOpenUploadModal;

  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [signInOpen, setSignInOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editTools = ALL_PDF_TOOLS.filter((t) => t.category === "edit" || t.category === "sign");
  const organizeTools = ALL_PDF_TOOLS.filter((t) => t.category === "organize");
  const utilityTools = ALL_PDF_TOOLS.filter(
    (t) => t.category === "compress" || t.category === "security" || t.category === "ocr",
  );
  const fromPdf = ALL_PDF_TOOLS.filter((t) => t.category === "convert" && t.id.startsWith("pdf-to"));
  const toPdf = ALL_PDF_TOOLS.filter((t) => t.category === "convert" && !t.id.startsWith("pdf-to"));
  const imageTools = ALL_PDF_TOOLS.filter((t) => t.category === "image");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      const bytes = await file.arrayBuffer();
      setUploadedPdf(bytes, file.name);
      navigate({ to: "/editor", search: { file: file.name } });
    }
  };

  const handleToolClick = (tool: PDFToolDef) => {
    setMobileMenuOpen(false);
    if (handleToolSelect) {
      handleToolSelect(tool);
    } else if (tool.status === "available") {
      fileInputRef.current?.click();
    } else {
      navigate({ to: "/tools" });
    }
  };

  const handlePrimaryCta = () => {
    if (handleUploadRequest) {
      handleUploadRequest();
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <header className="sticky top-0 z-30 w-full border-b border-border/80 bg-background/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <BrandMark />
            <div className="flex flex-col">
              <span className="text-[17px] font-bold tracking-tight text-foreground">
                PDF Studio
              </span>
              <span className="hidden text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:inline-block">
                Professional PDF SaaS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 lg:flex">
            {/* PDF Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-md px-3 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground cursor-pointer outline-none"
                >
                  PDF Tools
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[680px] p-4 shadow-xl">
                <div className="grid grid-cols-3 gap-5">
                  {/* Edit Column */}
                  <div>
                    <DropdownMenuLabel className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Edit & Sign
                    </DropdownMenuLabel>
                    <div className="mt-1 space-y-0.5">
                      {editTools.slice(0, 5).map((tool) => (
                        <DropdownMenuItem
                          key={tool.id}
                          onClick={() => handleToolClick(tool)}
                          className="flex items-center gap-2.5 rounded-lg px-2 py-2 cursor-pointer"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand">
                            <tool.icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-foreground">{tool.name}</span>
                            <span className="text-[11px] text-muted-foreground line-clamp-1">
                              {tool.description}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </div>

                  {/* Organize Column */}
                  <div>
                    <DropdownMenuLabel className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Organize
                    </DropdownMenuLabel>
                    <div className="mt-1 space-y-0.5">
                      {organizeTools.slice(0, 5).map((tool) => (
                        <DropdownMenuItem
                          key={tool.id}
                          onClick={() => handleToolClick(tool)}
                          className="flex items-center gap-2.5 rounded-lg px-2 py-2 cursor-pointer"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
                            <tool.icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-foreground">{tool.name}</span>
                            <span className="text-[11px] text-muted-foreground line-clamp-1">
                              {tool.description}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </div>

                  {/* Utilities Column */}
                  <div>
                    <DropdownMenuLabel className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Security & Utilities
                    </DropdownMenuLabel>
                    <div className="mt-1 space-y-0.5">
                      {utilityTools.slice(0, 5).map((tool) => (
                        <DropdownMenuItem
                          key={tool.id}
                          onClick={() => handleToolClick(tool)}
                          className="flex items-center gap-2.5 rounded-lg px-2 py-2 cursor-pointer"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
                            <tool.icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-foreground">{tool.name}</span>
                            <span className="text-[11px] text-muted-foreground line-clamp-1">
                              {tool.description}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator className="my-3" />
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-[12px] text-muted-foreground">
                    Over 30+ dedicated PDF tools built for web
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

            {/* Convert PDF Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-md px-3 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground cursor-pointer outline-none"
                >
                  Convert PDF
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[520px] p-4 shadow-xl">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <DropdownMenuLabel className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Convert from PDF
                    </DropdownMenuLabel>
                    <div className="mt-1 space-y-0.5">
                      {[...fromPdf, ...imageTools.filter((t) => t.id.startsWith("pdf-to"))].slice(0, 5).map((tool) => (
                        <DropdownMenuItem
                          key={tool.id}
                          onClick={() => handleToolClick(tool)}
                          className="flex items-center gap-2.5 rounded-lg px-2 py-2 cursor-pointer"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
                            <tool.icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs font-semibold">{tool.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </div>

                  <div>
                    <DropdownMenuLabel className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Convert to PDF
                    </DropdownMenuLabel>
                    <div className="mt-1 space-y-0.5">
                      {[...toPdf, ...imageTools.filter((t) => t.id.startsWith("jpg-to") || t.id.startsWith("png-to"))].slice(0, 5).map((tool) => (
                        <DropdownMenuItem
                          key={tool.id}
                          onClick={() => handleToolClick(tool)}
                          className="flex items-center gap-2.5 rounded-lg px-2 py-2 cursor-pointer"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
                            <tool.icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs font-semibold">{tool.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Resources Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-md px-3 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground cursor-pointer outline-none"
                >
                  Resources
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 p-2 shadow-xl">
                <DropdownMenuItem asChild>
                  <a href="#how-it-works" className="cursor-pointer text-xs py-2">
                    How PDF Studio Works
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#why-pdf-studio" className="cursor-pointer text-xs py-2">
                    Why PDF Studio
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#use-cases" className="cursor-pointer text-xs py-2">
                    Use Cases & Workflows
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/faq" className="cursor-pointer text-xs py-2">
                    Frequently Asked Questions
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/privacy" className="cursor-pointer text-xs py-2">
                    Privacy & Security Architecture
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Direct Links */}
            <Link
              to="/pricing"
              className="rounded-md px-3 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              to="/tools"
              className="rounded-md px-3 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
            >
              All Tools
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 px-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? "User"} referrerPolicy="no-referrer" />
                      <AvatarFallback className="text-[10px] bg-brand text-brand-foreground">
                        {(user.displayName ?? user.email ?? "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-xs font-medium md:inline-block max-w-[120px] truncate">
                      {user.displayName ?? user.email ?? "User"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 shadow-lg">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                      <span>My Documents</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="flex items-center gap-2 text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSignInOpen(true)}
                className="hidden text-xs font-medium sm:inline-flex text-muted-foreground hover:text-foreground"
              >
                <User className="mr-1.5 h-3.5 w-3.5" /> Sign In
              </Button>
            )}

            <Button
              variant="brand"
              size="sm"
              onClick={handlePrimaryCta}
              className="gap-1.5 shadow-sm text-xs font-semibold px-4"
            >
              <FileUp className="h-3.5 w-3.5" />
              <span>Edit PDF</span>
            </Button>

            {/* Mobile Menu Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] overflow-y-auto p-5">
                <SheetHeader className="text-left">
                  <SheetTitle className="flex items-center gap-2">
                    <BrandMark />
                    <span>PDF Studio</span>
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-6 flex flex-col gap-4">
                  <Button
                    variant="brand"
                    className="w-full justify-center gap-2"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handlePrimaryCta();
                    }}
                  >
                    <FileUp className="h-4 w-4" />
                    Edit PDF Now
                  </Button>

                  <div className="border-t border-border pt-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Navigation
                    </span>
                    <nav className="mt-2 flex flex-col space-y-1">
                      <Link
                        to="/"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                      >
                        Home
                      </Link>
                      <Link
                        to="/tools"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                      >
                        All PDF Tools (30+)
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                      >
                        My Documents
                      </Link>
                      <Link
                        to="/pricing"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                      >
                        Pricing & Plans
                      </Link>
                      <Link
                        to="/faq"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                      >
                        FAQ
                      </Link>
                      <Link
                        to="/contact"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                      >
                        Contact
                      </Link>
                    </nav>
                  </div>

                  <div className="border-t border-border pt-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Popular Tools
                    </span>
                    <div className="mt-2 flex flex-col space-y-1">
                      {ALL_PDF_TOOLS.filter((t) => t.popular).map((tool) => (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => handleToolClick(tool)}
                          className="flex items-center justify-between rounded-md px-3 py-2 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <span className="font-medium text-foreground">{tool.name}</span>
                          <span className="text-[10px] text-muted-foreground">{tool.badge}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {!user && (
                    <div className="border-t border-border pt-4">
                      <Button
                        variant="outline"
                        className="w-full justify-center gap-2"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setSignInOpen(true);
                        }}
                      >
                        <User className="h-4 w-4" />
                        Sign In
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <SignInModal open={signInOpen} onOpenChange={setSignInOpen} />
    </>
  );
}
