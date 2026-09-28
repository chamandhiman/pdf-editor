import { useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Clock,
  File,
  FileUp,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Settings,
  Sparkles,
  Star,
  Trash2,
  User,
  FileText,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { BrandMark } from "@/components/BrandMark";
import { SignInModal } from "@/components/editor/modals/SignInModal";
import { useAuth } from "@/lib/auth-context";
import { setUploadedPdf } from "@/lib/pdf-store";
import {
  getRecentDocs,
  removeRecentDoc,
  clearRecentDocs,
  type RecentDoc,
} from "@/lib/recent-docs";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: File, label: "My Documents", id: "my-docs" },
  { icon: Clock, label: "Recent", id: "recent" },
  { icon: Star, label: "Templates", id: "templates" },
  { icon: Settings, label: "Settings", id: "settings" },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/60">
        <FileText className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="mt-5 text-[17px] font-semibold tracking-tight">No documents yet</h2>
      <p className="mt-2 max-w-xs text-[13.5px] text-muted-foreground">
        Upload your first PDF to start editing. Files stay private and never leave your browser.
      </p>
      <Button variant="brand" size="lg" className="mt-6 gap-2" onClick={onUpload}>
        <FileUp className="h-4 w-4" />
        Upload a PDF
      </Button>
    </div>
  );
}

function DocCard({
  doc,
  onOpen,
  onRemove,
}: {
  doc: RecentDoc;
  onOpen: (doc: RecentDoc) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "group relative flex cursor-pointer flex-col rounded-2xl border border-border bg-card p-4 shadow-sm",
        "transition-all hover:border-brand/40 hover:shadow-lg pdf-card-glow overflow-hidden",
      )}
      onClick={() => onOpen(doc)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen(doc);
      }}
    >
      {/* Red accent strip at the top */}
      <div className="absolute top-0 left-0 right-0 h-1 icon-edit" />

      {/* PDF paper preview */}
      <div className="relative flex h-32 items-center justify-center rounded-xl border border-border/80 bg-gradient-to-b from-muted/30 to-muted/70 overflow-hidden shadow-inner group-hover:bg-brand-soft/20 transition-colors">
        {/* PDF red badge in corner */}
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-red-600 to-rose-600 text-[10px] font-extrabold text-white shadow-sm tracking-wider">
          PDF
        </div>

        {/* Paper sheet effect */}
        <div className="w-16 h-20 bg-background rounded-md shadow-md border border-border/60 flex flex-col items-center justify-center p-2 group-hover:scale-105 transition-transform">
          <FileText className="h-7 w-7 text-brand mb-1.5" />
          <div className="w-8 h-1 bg-muted-foreground/30 rounded-full mb-1" />
          <div className="w-6 h-1 bg-muted-foreground/20 rounded-full" />
        </div>
      </div>

      <div className="mt-3 min-w-0">
        <p className="truncate text-sm font-bold text-foreground group-hover:text-brand transition-colors" title={doc.fileName}>
          {doc.fileName}
        </p>
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>{doc.pages ? `${doc.pages} pages` : "PDF Document"}</span>
          <span>{formatDate(doc.openedAt)}</span>
        </div>
      </div>

      {/* Ellipsis menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-7 w-7 rounded-lg bg-background/80 backdrop-blur opacity-0 transition-opacity group-hover:opacity-100 shadow-sm"
            aria-label="Document options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onOpen(doc);
            }}
          >
            <FolderOpen className="mr-2 h-3.5 w-3.5" />
            Open in Editor
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => onRemove(doc.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Remove from list
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, signOut } = useAuth();
  const [signInOpen, setSignInOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [docs, setDocs] = useState<RecentDoc[]>(() => getRecentDocs());
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = async (file?: File | null) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Please choose a PDF file.");
      return;
    }
    setUploadError(null);
    const bytes = await file.arrayBuffer();
    setUploadedPdf(bytes, file.name);
    await navigate({ to: "/editor", search: { file: file.name } });
  };

  const openDoc = (doc: RecentDoc) => {
    // The file bytes are gone after a page refresh, so we ask user to re-upload
    // In a real app this would open from cloud storage
    inputRef.current?.click();
  };

  const removeDoc = (id: string) => {
    removeRecentDoc(id);
    setDocs(getRecentDocs());
  };

  return (
    <div className="flex h-screen bg-background">
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        {/* Brand */}
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <BrandMark />
          <span className="text-[14px] font-semibold tracking-tight">PDF Studio</span>
        </div>

        {/* Upload CTA */}
        <div className="px-3 pt-4">
          <Button
            id="dashboard-upload-btn"
            variant="brand"
            size="sm"
            className="w-full gap-2"
            onClick={() => inputRef.current?.click()}
          >
            <FileUp className="h-4 w-4" />
            Upload PDF
          </Button>
        </div>

        {/* Nav */}
        <nav className="mt-4 flex flex-col gap-0.5 px-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors",
                activeNav === item.id
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        <Separator className="my-3 mx-3 w-auto" />

        {/* Upgrade banner */}
        <div className="mx-3 rounded-xl border border-brand/20 bg-brand-soft/50 p-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            <span className="text-[12px] font-semibold text-brand">Upgrade to Pro</span>
          </div>
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
            Cloud saves, version history and team sharing.
          </p>
          <Button variant="brand" size="sm" className="mt-2.5 h-7 w-full text-[12px]">
            See plans
          </Button>
        </div>

        {/* User profile */}
        <div className="mt-auto border-t border-sidebar-border p-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={user.photoURL ?? undefined} referrerPolicy="no-referrer" />
                    <AvatarFallback className="text-[11px]">
                      {(user.displayName?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-medium">
                      {user.displayName ?? "User"}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-48">
                <DropdownMenuItem onSelect={signOut}>
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              onClick={() => setSignInOpen(true)}
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[12.5px] transition-colors hover:bg-sidebar-accent"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-secondary">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span className="text-muted-foreground">Sign in</span>
            </button>
          )}
        </div>
      </aside>

      {/* ── Main content ────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3 sm:px-6 pt-safe">
          <div className="flex items-center gap-2">
            {/* Mobile Sidebar Trigger */}
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" aria-label="Open navigation">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[80vw] max-w-[260px] p-0 flex flex-col bg-sidebar">
                <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
                  <BrandMark />
                  <span className="text-[14px] font-semibold tracking-tight">PDF Studio</span>
                </div>
                <div className="px-3 pt-4">
                  <Button
                    variant="brand"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => {
                      setMobileNavOpen(false);
                      inputRef.current?.click();
                    }}
                  >
                    <FileUp className="h-4 w-4" />
                    Upload PDF
                  </Button>
                </div>
                <nav className="mt-4 flex flex-col gap-0.5 px-2">
                  {NAV_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveNav(item.id);
                        setMobileNavOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors",
                        activeNav === item.id
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </button>
                  ))}
                </nav>

                <div className="mt-auto border-t border-sidebar-border p-3">
                  {user ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={user.photoURL ?? undefined} referrerPolicy="no-referrer" />
                          <AvatarFallback className="text-[11px]">
                            {(user.displayName?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-xs font-medium">{user.displayName ?? user.email}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={signOut}>
                        <LogOut className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setMobileNavOpen(false);
                        setSignInOpen(true);
                      }}
                    >
                      Sign In
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Link to="/" className="flex items-center gap-1.5 lg:hidden">
              <BrandMark />
            </Link>

            <h1 className="text-[15px] sm:text-[16px] font-semibold">
              {NAV_ITEMS.find((n) => n.id === activeNav)?.label ?? "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile upload */}
            <Button
              variant="brand"
              size="sm"
              className="h-8 gap-1.5 text-xs lg:hidden"
              onClick={() => inputRef.current?.click()}
            >
              <FileUp className="h-3.5 w-3.5" />
              Upload
            </Button>
            {!user && (
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setSignInOpen(true)}>
                Sign In
              </Button>
            )}
          </div>
        </header>

        {/* Scrollable body */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 pb-safe touch-scroll">
          {/* Quick access row */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: FileUp,
                label: "Upload PDF",
                sub: "Open any PDF file",
                action: () => inputRef.current?.click(),
                colorClass: "icon-edit",
              },
              {
                icon: FileText,
                label: "Blank document",
                sub: "Start from scratch",
                action: () => inputRef.current?.click(),
                colorClass: "icon-organize",
              },
              {
                icon: Star,
                label: "Templates",
                sub: "Browse templates",
                action: () => setActiveNav("templates"),
                colorClass: "icon-convert",
              },
              {
                icon: Settings,
                label: "Settings",
                sub: "Preferences",
                action: () => setActiveNav("settings"),
                colorClass: "icon-compress",
              },
            ].map((card) => (
              <button
                key={card.label}
                onClick={card.action}
                className="group flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-brand/40 hover:shadow-md pdf-card-glow cursor-pointer"
              >
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md text-white group-hover:scale-105 transition-transform",
                    card.colorClass,
                  )}
                >
                  <card.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground group-hover:text-brand transition-colors">{card.label}</p>
                  <p className="text-xs text-muted-foreground">{card.sub}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Recent documents */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold">Recent documents</h2>
              {docs.length > 0 && (
                <button
                  className="text-[12.5px] text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    clearRecentDocs();
                    setDocs([]);
                  }}
                >
                  Clear all
                </button>
              )}
            </div>

            {docs.length === 0 ? (
              <EmptyState onUpload={() => inputRef.current?.click()} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {docs.map((doc) => (
                  <DocCard key={doc.id} doc={doc} onOpen={openDoc} onRemove={removeDoc} />
                ))}
              </div>
            )}
          </section>

          {/* Templates placeholder */}
          {activeNav === "templates" && (
            <section className="mt-8">
              <h2 className="mb-4 text-[14px] font-semibold">Templates</h2>
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
                <Star className="mb-3 h-8 w-8 text-muted-foreground/40" />
                <p className="text-[14px] font-medium text-muted-foreground">Coming soon</p>
                <p className="mt-1 text-[12.5px] text-muted-foreground">
                  Pre-built document templates will appear here.
                </p>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => void handleUpload(e.target.files?.[0])}
      />
      {uploadError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-destructive/30 bg-background px-4 py-2 text-[12.5px] text-destructive shadow-md">
          {uploadError}
        </div>
      )}

      {/* Sign-In modal */}
      <SignInModal open={signInOpen} onOpenChange={setSignInOpen} />
    </div>
  );
}
