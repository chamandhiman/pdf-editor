import { useState, useEffect, useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import {
  Share2,
  Copy,
  Check,
  ArrowUp,
  MessageCircle,
  Twitter,
  Facebook,
  Mail,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function FloatingShareWidget() {
  const location = useLocation();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Do NOT render on editor page to keep the editor clean and distraction-free
  const isEditorPage = location.pathname.startsWith("/editor");

  // Track scroll position for Back to Top
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 320);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    if (popoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen]);

  if (isEditorPage) {
    return null;
  }

  const shareTitle = "PDF Studio — 100% Free In-Browser PDF Suite";
  const shareText = "Edit, merge, compress, and sign PDF documents freely in your browser with complete privacy.";
  const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://pdf.webtoolocean.com";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setPopoverOpen(false);
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2.5 print:hidden">
      {/* Back to Top Action */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-md backdrop-blur-md transition-all hover:bg-accent hover:scale-105 active:scale-95 cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-200"
          aria-label="Back to top"
          title="Back to top"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}

      {/* Share Popover Menu */}
      {popoverOpen && (
        <div
          ref={popoverRef}
          className="mb-1 w-64 rounded-2xl border border-border bg-card p-3.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Share2 className="h-3.5 w-3.5 text-brand" /> Share PDF Studio
            </span>
            <button
              onClick={() => setPopoverOpen(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {/* Native Device Share (when supported) */}
            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors cursor-pointer text-left"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand/10 text-brand">
                  <ExternalLink className="h-3.5 w-3.5" />
                </div>
                <span>Share via Device...</span>
              </button>
            )}

            {/* Copy Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </div>
                <span>{copied ? "Copied!" : "Copy Link"}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Direct URL</span>
            </button>

            {/* WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareTitle} - ${shareUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setPopoverOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
                <MessageCircle className="h-3.5 w-3.5" />
              </div>
              <span>WhatsApp</span>
            </a>

            {/* X / Twitter */}
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setPopoverOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sky-500/10 text-sky-500">
                <Twitter className="h-3.5 w-3.5" />
              </div>
              <span>X (Twitter)</span>
            </a>

            {/* Facebook */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setPopoverOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-600">
                <Facebook className="h-3.5 w-3.5" />
              </div>
              <span>Facebook</span>
            </a>

            {/* Email */}
            <a
              href={`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`}
              onClick={() => setPopoverOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
              </div>
              <span>Email</span>
            </a>
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setPopoverOpen((prev) => !prev)}
        className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg shadow-brand/25 transition-all hover:scale-105 active:scale-95 hover:bg-brand/90 cursor-pointer"
        aria-label="Share PDF Studio"
        title="Share PDF Studio"
      >
        <Share2 className="h-5 w-5 transition-transform group-hover:rotate-12" />
        <span className="sr-only">Share PDF Studio</span>
      </button>
    </div>
  );
}
