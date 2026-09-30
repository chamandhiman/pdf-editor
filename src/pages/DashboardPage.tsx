import { useEffect, useRef, useState } from "react";
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
  Heart,
  Cloud,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ExternalLink,
  Check,
} from "lucide-react";
import { toast } from "sonner";
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
import { SupportModal } from "@/components/SupportModal";
import { useAuth } from "@/lib/auth-context";
import { setUploadedPdf } from "@/lib/pdf-store";
import { saveActiveDocument, getOfflineCloudDoc } from "@/lib/pdf-storage";
import { createBlankPdfDocument } from "@/lib/pdf-create";
import {
  getRecentDocs,
  removeRecentDoc,
  clearRecentDocs,
  type RecentDoc,
} from "@/lib/recent-docs";
import {
  getCloudDocuments,
  deleteCloudDocument,
  getRemainingDays,
  getUserProfile,
  type CloudDocument,
  type UserProfile,
} from "@/lib/cloud-documents";
import { PlanSelectionModal } from "@/components/editor/modals/PlanSelectionModal";
import { PLANS, type PlanId } from "@/lib/pricing-plans";
import { cn } from "@/lib/utils";

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

function EmptyState({
  title = "No documents yet",
  description = "Upload your first PDF to start editing. Files stay private and never leave your browser.",
  onUpload,
}: {
  title?: string;
  description?: string;
  onUpload: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/60">
        <FileText className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="mt-5 text-[17px] font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-xs text-[13.5px] text-muted-foreground">{description}</p>
      <Button variant="brand" size="lg" className="mt-6 gap-2" onClick={onUpload}>
        <FileUp className="h-4 w-4" />
        Upload PDF
      </Button>
    </div>
  );
}

/** Card for Cloud-Saved Documents */
function CloudDocCard({
  doc,
  onOpen,
  onDelete,
}: {
  doc: CloudDocument;
  onOpen: (doc: CloudDocument) => void;
  onDelete: (doc: CloudDocument) => void;
}) {
  const daysLeft = getRemainingDays(doc.expiresAt);

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
      <div className="absolute top-0 left-0 right-0 h-1 icon-edit" />

      {/* Preview container */}
      <div className="relative flex h-36 items-center justify-center rounded-xl border border-border/80 bg-gradient-to-b from-muted/30 to-muted/70 overflow-hidden shadow-inner group-hover:bg-brand-soft/20 transition-colors">
        {doc.thumbnailUrl ? (
          <img
            src={doc.thumbnailUrl}
            alt={doc.name}
            className="w-full h-full object-contain pointer-events-none group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-16 h-20 bg-background rounded-md shadow-md border border-border/60 flex flex-col items-center justify-center p-2 group-hover:scale-105 transition-transform">
            <FileText className="h-7 w-7 text-brand mb-1.5" />
            <div className="w-8 h-1 bg-muted-foreground/30 rounded-full mb-1" />
            <div className="w-6 h-1 bg-muted-foreground/20 rounded-full" />
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-red-600 to-rose-600 text-[10px] font-extrabold text-white shadow-sm tracking-wider">
            PDF
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-black/60 text-[10px] font-semibold text-white backdrop-blur-xs flex items-center gap-1">
            <Cloud className="w-2.5 h-2.5 text-brand" /> Cloud
          </span>
        </div>
      </div>

      <div className="mt-3 min-w-0">
        <p className="truncate text-sm font-bold text-foreground group-hover:text-brand transition-colors" title={doc.name}>
          {doc.name}
        </p>
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>{doc.pageCount} {doc.pageCount === 1 ? "page" : "pages"}</span>
          <span>Updated {formatDate(doc.updatedAt)}</span>
        </div>

        {/* Expiration badge */}
        <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
          {doc.planId === "free" ? (
            daysLeft <= 0 ? (
              <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                <Clock className="w-3 h-3" />
                Expired
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                <Clock className="w-3 h-3" />
                Expires in {daysLeft} {daysLeft === 1 ? "day" : "days"}
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <Check className="w-3 h-3" />
              Pro Storage
            </span>
          )}
          <span className="text-muted-foreground text-[10px]">
            {doc.planId === "free" ? "7-Day Cloud Storage" : "Unlimited Storage"}
          </span>
        </div>
      </div>

      {/* Ellipsis Menu */}
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
            onSelect={() => onDelete(doc)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete from Cloud
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** Card for Local Guest Documents */
function LocalDocCard({
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
      <div className="absolute top-0 left-0 right-0 h-1 icon-organize" />

      <div className="relative flex h-32 items-center justify-center rounded-xl border border-border/80 bg-gradient-to-b from-muted/30 to-muted/70 overflow-hidden shadow-inner group-hover:bg-brand-soft/20 transition-colors">
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-red-600 to-rose-600 text-[10px] font-extrabold text-white shadow-sm tracking-wider">
          PDF
        </div>

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
        <p className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          Local browser data only
        </p>
      </div>

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
            Remove from history
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
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<string>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [recentDocs, setRecentDocs] = useState<RecentDoc[]>(() => getRecentDocs());
  const [cloudDocs, setCloudDocs] = useState<CloudDocument[]>([]);
  const [loadingCloudDocs, setLoadingCloudDocs] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [planSelectionOpen, setPlanSelectionOpen] = useState(false);

  // Load user profile & cloud documents when user is authenticated
  useEffect(() => {
    if (!user) {
      setCloudDocs([]);
      setUserProfile(null);
      return;
    }

    let isMounted = true;
    setLoadingCloudDocs(true);

    getUserProfile(user.uid)
      .then((prof) => {
        if (isMounted) setUserProfile(prof);
      })
      .catch((e) => console.warn("[dashboard] Could not fetch profile:", e));

    getCloudDocuments(user.uid)
      .then((docs) => {
        if (isMounted) setCloudDocs(docs);
      })
      .catch((err) => {
        console.warn("[dashboard] Could not load cloud docs:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingCloudDocs(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleUpload = async (file?: File | null) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Please choose a valid PDF file.");
      return;
    }
    setUploadError(null);
    const bytes = await file.arrayBuffer();
    setUploadedPdf(bytes, file.name);
    await navigate({ to: "/editor", search: { file: file.name } });
  };

  const handleCreateBlank = async () => {
    try {
      const blank = await createBlankPdfDocument("Untitled.pdf");
      setUploadedPdf(blank.bytes, blank.fileName);
      navigate({ to: "/editor", search: { file: blank.fileName } });
    } catch (err) {
      toast.error("Failed to create blank document.");
    }
  };

  const handleOpenCloudDoc = async (doc: CloudDocument) => {
    const daysLeft = getRemainingDays(doc.expiresAt);
    if (doc.planId === "free" && daysLeft <= 0) {
      toast.error("This document has expired on the Free trial. Upgrade to Pro to reactivate documents.");
      return;
    }
    const toastId = toast.loading(`Opening ${doc.name}…`);
    try {
      let buffer: ArrayBuffer | null = null;
      if (doc.fileUrl && !doc.fileUrl.startsWith("indexeddb://")) {
        try {
          const response = await fetch(doc.fileUrl);
          if (response.ok) {
            buffer = await response.arrayBuffer();
          }
        } catch {
          // Fall back to offline store below
        }
      }

      if (!buffer) {
        const offline = await getOfflineCloudDoc(doc.id);
        if (offline?.bytes) {
          buffer = offline.bytes;
        }
      }

      if (!buffer) {
        throw new Error("Could not retrieve document file.");
      }

      setUploadedPdf(buffer, doc.name);
      if (doc.editorState) {
        await saveActiveDocument(doc.name, buffer, doc.editorState);
      }

      toast.success("Document loaded from cloud", { id: toastId });
      navigate({ to: "/editor", search: { file: doc.name } });
    } catch (err: any) {
      console.error("[dashboard] Failed to open cloud doc:", err);
      toast.error("Failed to load document from cloud storage.", { id: toastId });
    }
  };

  const handleDeleteCloudDoc = async (doc: CloudDocument) => {
    if (!user) return;
    const confirm = window.confirm(`Are you sure you want to delete "${doc.name}" from your cloud documents?`);
    if (!confirm) return;

    try {
      await deleteCloudDocument(user.uid, doc.id, doc.storagePath);
      setCloudDocs((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success(`Deleted "${doc.name}" from cloud storage.`);
    } catch (err) {
      toast.error("Failed to delete document.");
    }
  };

  const openLocalDoc = (_doc: RecentDoc) => {
    // For local guest history without stored bytes, prompt file selection
    inputRef.current?.click();
  };

  const removeLocalDoc = (id: string) => {
    removeRecentDoc(id);
    setRecentDocs(getRecentDocs());
  };

  const navItems = user
    ? [
        { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
        { icon: Cloud, label: "My Documents", id: "my-docs" },
        { icon: Clock, label: "Recent", id: "recent" },
        { icon: Star, label: "Templates", id: "templates" },
        { icon: Settings, label: "Settings", id: "settings" },
      ]
    : [
        { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
        { icon: Clock, label: "Recent", id: "recent" },
        { icon: Star, label: "Templates", id: "templates" },
        { icon: Settings, label: "Settings", id: "settings" },
      ];

  return (
    <div className="flex h-screen bg-background">
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className="hidden w-[230px] shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        {/* Brand */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <Link to="/" className="flex items-center gap-2">
            <BrandMark />
            <span className="text-[14px] font-semibold tracking-tight text-sidebar-foreground">PDF Studio</span>
          </Link>
        </div>

        {/* Upload CTA */}
        <div className="px-3 pt-4 space-y-2">
          <Button
            variant="brand"
            size="sm"
            className="w-full gap-2 font-semibold shadow-sm"
            onClick={() => inputRef.current?.click()}
          >
            <FileUp className="h-4 w-4" />
            Upload PDF
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={handleCreateBlank}
          >
            <FileText className="h-3.5 w-3.5" />
            Blank PDF
          </Button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex flex-col gap-0.5 px-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "templates") {
                  navigate({ to: "/templates" });
                } else {
                  setActiveNav(item.id);
                }
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors cursor-pointer",
                activeNav === item.id
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0 text-brand" />
              {item.label}
              {item.id === "templates" && (
                <span className="ml-auto text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-brand/10 text-brand">
                  New
                </span>
              )}
              {item.id === "my-docs" && user && cloudDocs.length > 0 && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-brand/10 text-brand">
                  {cloudDocs.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <Separator className="my-3 mx-3 w-auto" />

        {/* Support PDF Studio entry */}
        <div className="px-3">
          <button
            type="button"
            onClick={() => setSupportModalOpen(true)}
            className="flex w-full items-center gap-2 rounded-xl p-2.5 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors cursor-pointer"
          >
            <Heart className="h-4 w-4 text-rose-500 fill-rose-500/20" />
            <span>Support PDF Studio</span>
          </button>
        </div>

        {/* Pro Plan card (Structured for future monetization without active payments) */}
        <div className="mx-3 mt-2 rounded-xl border border-brand/20 bg-brand-soft/40 p-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            <span className="text-[12px] font-semibold text-brand">Pro Plan</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Extended cloud storage, priority processing, and team features.
          </p>
          <div className="mt-2 text-[11px] font-semibold text-muted-foreground text-center py-1 rounded bg-muted/60 border border-border/40">
            Coming Soon
          </div>
        </div>

        {/* User profile / Sign in button */}
        <div className="mt-auto border-t border-sidebar-border p-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent cursor-pointer">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={user.photoURL ?? undefined} referrerPolicy="no-referrer" />
                    <AvatarFallback className="text-[11px]">
                      {(user.displayName?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-medium text-sidebar-foreground">
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
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[12.5px] transition-colors hover:bg-sidebar-accent cursor-pointer"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-secondary">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span className="text-muted-foreground font-medium">Sign in with Google</span>
            </button>
          )}
        </div>
      </aside>

      {/* ── Main content ────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3 sm:px-6 pt-safe">
          <div className="flex items-center gap-2">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" aria-label="Open navigation">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[80vw] max-w-[260px] p-0 flex flex-col bg-sidebar">
                <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
                  <BrandMark />
                  <span className="text-[14px] font-semibold tracking-tight text-sidebar-foreground">PDF Studio</span>
                </div>
                <div className="px-3 pt-4 space-y-2">
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs"
                    onClick={() => {
                      setMobileNavOpen(false);
                      handleCreateBlank();
                    }}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Blank PDF
                  </Button>
                </div>
                <nav className="mt-4 flex flex-col gap-0.5 px-2">
                  {navItems.map((item) => (
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
                      <item.icon className="h-4 w-4 shrink-0 text-brand" />
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
                        <span className="truncate text-xs font-medium text-sidebar-foreground">
                          {user.displayName ?? user.email}
                        </span>
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
                      Sign in with Google
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Link to="/" className="flex items-center gap-1.5 lg:hidden">
              <BrandMark />
            </Link>

            <h1 className="text-[15px] sm:text-[16px] font-semibold text-foreground">
              {navItems.find((n) => n.id === activeNav)?.label ?? "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs hidden sm:inline-flex"
              onClick={handleCreateBlank}
            >
              <FileText className="h-3.5 w-3.5 text-brand" />
              Blank PDF
            </Button>
            <Button
              variant="brand"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => inputRef.current?.click()}
            >
              <FileUp className="h-3.5 w-3.5" />
              Upload PDF
            </Button>
            {!user && (
              <Button variant="outline" size="sm" className="h-8 text-xs font-medium" onClick={() => setSignInOpen(true)}>
                Sign In
              </Button>
            )}
          </div>
        </header>

        {/* Scrollable body */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 pb-safe touch-scroll">
          {/* Guest Mode Notification Banner (Requirement 8 & 9) */}
          {!user && (
            <div className="mb-6 p-4 rounded-2xl border border-brand/20 bg-brand/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Guest-First Mode (Browser Local Storage)
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                  You can edit and download PDFs freely without an account. Documents shown here are stored in this browser only. Sign in with Google anytime to save documents to cloud storage for 30 days and access them across devices.
                </p>
              </div>
              <Button
                variant="brand"
                size="sm"
                className="shrink-0 text-xs font-semibold gap-1.5 self-start sm:self-auto shadow-sm"
                onClick={() => setSignInOpen(true)}
              >
                <User className="h-3.5 w-3.5" />
                Sign in with Google
              </Button>
            </div>
          )}

          {/* Quick Access Row */}
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
                sub: "Create a blank A4 sheet",
                action: handleCreateBlank,
                colorClass: "icon-organize",
              },
              {
                icon: Star,
                label: "Templates",
                sub: "Browse templates",
                action: () => navigate({ to: "/templates" }),
                colorClass: "icon-convert",
              },
              {
                icon: Settings,
                label: "Settings",
                sub: "Cloud & storage status",
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

          {/* ── SECTION 1: Cloud Saved Documents (Logged-in feature) ── */}
          {user && (activeNav === "dashboard" || activeNav === "my-docs") && (
            <section className="mb-10">
              {/* Plan status & Document quota banner */}
              {(() => {
                const planId: PlanId = userProfile?.planId || "free";
                const isFreePlan = planId === "free";
                const currentPlan = PLANS[planId] || PLANS.free;

                return (
                  <div className="mb-6 p-4 rounded-2xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground">
                            Current plan: {currentPlan.name}
                          </h3>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              isFreePlan
                                ? "bg-muted text-muted-foreground"
                                : "bg-brand/15 text-brand"
                            )}
                          >
                            {isFreePlan ? "Trial" : "Active"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isFreePlan
                            ? "Free plan: 1 document, 7-day cloud storage"
                            : "Pro plan: Unlimited cloud documents"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <div className="text-right text-xs">
                        <span className="text-muted-foreground font-medium">Documents: </span>
                        <span className="font-bold text-foreground">
                          {isFreePlan
                            ? `${cloudDocs.length} / 1`
                            : `${cloudDocs.length} / Unlimited`}
                        </span>
                      </div>

                      {isFreePlan && (
                        <Button
                          variant="brand"
                          size="sm"
                          className="text-xs font-semibold gap-1.5 shadow-sm"
                          onClick={() => setPlanSelectionOpen(true)}
                          style={{ borderRadius: "4px" }}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Upgrade to Pro
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-bold text-foreground flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-brand" />
                    Saved Documents
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Access and resume your saved documents anytime.
                  </p>
                </div>
              </div>

              {loadingCloudDocs ? (
                <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-brand" />
                  Loading your saved documents…
                </div>
              ) : cloudDocs.length === 0 ? (
                <EmptyState
                  title="Your saved documents will appear here."
                  description="Save documents from the editor to keep them available in cloud storage for 30 days."
                  onUpload={() => inputRef.current?.click()}
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {cloudDocs.map((doc) => (
                    <CloudDocCard
                      key={doc.id}
                      doc={doc}
                      onOpen={handleOpenCloudDoc}
                      onDelete={handleDeleteCloudDoc}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── SECTION 2: Recent Documents (Local Browser History) ── */}
          {(activeNav === "dashboard" || activeNav === "recent") && (
            <section className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-semibold text-foreground">
                    {user ? "Recent Documents (Local)" : "Recent Documents"}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Stored locally in this web browser.
                  </p>
                </div>
                {recentDocs.length > 0 && (
                  <button
                    className="text-[12.5px] text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={() => {
                      clearRecentDocs();
                      setRecentDocs([]);
                    }}
                  >
                    Clear all
                  </button>
                )}
              </div>

              {recentDocs.length === 0 ? (
                !user && <EmptyState onUpload={() => inputRef.current?.click()} />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {recentDocs.map((doc) => (
                    <LocalDocCard
                      key={doc.id}
                      doc={doc}
                      onOpen={openLocalDoc}
                      onRemove={removeLocalDoc}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── SECTION 3: Templates placeholder ── */}
          {activeNav === "templates" && (
            <section className="mt-8">
              <h2 className="mb-4 text-[14px] font-semibold text-foreground">Templates</h2>
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center bg-card/40">
                <Star className="mb-3 h-8 w-8 text-muted-foreground/40" />
                <p className="text-[14px] font-medium text-muted-foreground">Coming soon</p>
                <p className="mt-1 text-[12.5px] text-muted-foreground max-w-sm">
                  Pre-built document templates (invoices, resumes, contracts) will appear here.
                </p>
              </div>
            </section>
          )}

          {/* ── SECTION 4: Settings & Storage Overview (Requirement 10) ── */}
          {activeNav === "settings" && (
            <section className="mt-4 max-w-2xl space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-foreground">Account & Cloud Storage</h3>
                
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-border/60">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-semibold text-foreground">
                      {user ? `Signed in as ${user.email}` : "Guest Mode"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-border/60">
                    <span className="text-muted-foreground">Active Plan:</span>
                    <span className="font-semibold text-brand">Free Tier</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-border/60">
                    <span className="text-muted-foreground">Cloud Storage Expiration:</span>
                    <span className="font-semibold text-foreground">30 Days per saved file</span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Local Browser Storage:</span>
                    <span className="font-semibold text-emerald-600">Active (IndexedDB)</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-brand/20 bg-brand/5 space-y-1.5 mt-4">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand" />
                    Pro Subscription (Coming Soon)
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Permanent cloud storage, larger storage quotas, no ads, and advanced PDF processing tools will be introduced in future updates.
                  </p>
                </div>
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

      {/* Plan selection modal */}
      <PlanSelectionModal
        open={planSelectionOpen}
        onOpenChange={setPlanSelectionOpen}
        onSelectFreePlan={() => setPlanSelectionOpen(false)}
      />

      {/* Support modal */}
      <SupportModal open={supportModalOpen} onOpenChange={setSupportModalOpen} />
    </div>
  );
}
