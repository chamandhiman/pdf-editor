import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { setUploadedPdf } from "@/lib/pdf-store";

interface ReplacePdfModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the loaded bytes + filename after a valid PDF is chosen */
  onReplace: (bytes: ArrayBuffer, fileName: string) => void;
}

export function ReplacePdfModal({ open, onOpenChange, onReplace }: ReplacePdfModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file.");
      return;
    }
    setError(null);
    const bytes = await file.arrayBuffer();
    setUploadedPdf(bytes, file.name);
    onReplace(bytes, file.name);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Replace document</DialogTitle>
          <DialogDescription>
            Choose a new PDF to replace the current document. Your annotations will be cleared.
          </DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          className={cn(
            "mt-2 cursor-pointer rounded-xl border border-dashed border-border bg-secondary/40 px-6 py-10 text-center transition-all",
            "hover:border-brand/60 hover:bg-brand-soft/50",
            dragging && "border-brand bg-brand-soft shadow-panel",
          )}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background shadow-panel">
            <FileUp className={cn("h-5 w-5 text-muted-foreground", dragging && "text-brand")} />
          </div>
          <p className="mt-4 text-[14px] font-medium">Drop a PDF here</p>
          <p className="mt-1 text-[12.5px] text-muted-foreground">or click to browse</p>

          <Button
            variant="brand"
            size="sm"
            className="mt-5"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            Choose PDF
          </Button>

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          {error && <p className="mt-3 text-[12.5px] text-destructive">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
