import { useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileUp, Sparkles, Check, ArrowRight, ShieldCheck } from "lucide-react";
import type { PDFToolDef } from "@/lib/pdf-tools-data";
import { setUploadedPdf } from "@/lib/pdf-store";

interface ToolWorkspaceModalProps {
  tool: PDFToolDef | null;
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onOpenEditor?: () => void;
}

export function ToolWorkspaceModal({
  tool,
  open,
  isOpen,
  onOpenChange,
  onClose,
  onOpenEditor,
}: ToolWorkspaceModalProps) {
  const isModalOpen = open ?? isOpen ?? Boolean(tool);
  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  if (!tool) return null;

  const isAvailable = tool.status === "available";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      const bytes = await file.arrayBuffer();
      setUploadedPdf(bytes, file.name);
      handleClose();
      navigate({ to: "/editor", search: { file: file.name } });
    }
  };

  const handleLaunchEditor = () => {
    handleClose();
    if (onOpenEditor) {
      onOpenEditor();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleNotifyMe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
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

      <Dialog
        open={isModalOpen}
        onOpenChange={(val) => {
          if (!val) handleClose();
          else onOpenChange?.(val);
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader className="text-left">
            <div className="flex items-center justify-between pr-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <tool.icon className="h-5 w-5" />
              </div>
              <Badge variant={isAvailable ? "default" : "secondary"}>
                {isAvailable ? "Fully Functional" : "Coming Soon"}
              </Badge>
            </div>
            <DialogTitle className="mt-3 text-lg font-bold">{tool.name}</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
              {tool.description}
            </DialogDescription>
          </DialogHeader>

          {isAvailable ? (
            <div className="space-y-4 pt-2">
              <div
                onClick={handleLaunchEditor}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 text-center hover:border-brand/60 hover:bg-brand-soft/40 transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-sm border border-border">
                  <FileUp className="h-5 w-5 text-brand" />
                </div>
                <p className="mt-3 text-sm font-semibold">Select PDF to use {tool.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Opens directly in the local PDF Studio editor
                </p>
                <Button variant="brand" size="sm" className="mt-4 gap-1.5">
                  <FileUp className="h-3.5 w-3.5" />
                  Choose PDF Document
                </Button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Runs 100% inside your browser session. Files stay on your machine.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="rounded-xl border border-border bg-secondary/50 p-4">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">
                      In Active Development
                    </h4>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      We are polishing the cloud-grade engine for <strong>{tool.name}</strong>.
                      Meanwhile, all core PDF editing, text modification, page rotation/deletion,
                      image placement, freehand drawing, highlighting, and signing are fully
                      functional in our PDF Studio Editor.
                    </p>
                  </div>
                </div>
              </div>

              {subscribed ? (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>We'll notify you as soon as {tool.name} is ready for production.</span>
                </div>
              ) : (
                <form onSubmit={handleNotifyMe} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email for updates..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-brand"
                  />
                  <Button type="submit" variant="outline" size="sm" className="shrink-0 text-xs">
                    Notify Me
                  </Button>
                </form>
              )}

              <div className="border-t border-border pt-4">
                <Button
                  variant="brand"
                  className="w-full gap-2 text-xs"
                  onClick={handleLaunchEditor}
                >
                  <FileUp className="h-4 w-4" />
                  Upload & Edit in PDF Studio Now
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
