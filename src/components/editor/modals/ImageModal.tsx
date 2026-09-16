import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { demoImages } from "@/lib/demo-document";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (src: string, alt: string) => void;
}

export function ImageModal({ open, onOpenChange, onApply }: Props) {
  const [picked, setPicked] = useState<{ src: string; alt: string } | null>(null);
  const [dragging, setDragging] = useState(false);

  const readFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPicked({ src: String(reader.result), alt: file.name });
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Add Image</DialogTitle>
          <DialogDescription>Place an image on the current page.</DialogDescription>
        </DialogHeader>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            readFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex h-[180px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/30 text-center transition-colors",
            dragging && "border-brand bg-brand-soft",
          )}
        >
          {picked ? (
            <img src={picked.src} alt={picked.alt} className="max-h-[150px] object-contain" />
          ) : (
            <>
              <ImagePlus className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Drop image here</span>
              <span className="text-[12px] text-muted-foreground">Browse files · PNG, JPG, JPEG, WEBP</span>
            </>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={(e) => readFile(e.target.files?.[0])}
          />
        </label>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Sample assets
          </p>
          <div className="grid grid-cols-3 gap-2">
            {demoImages.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setPicked({ src: img.src, alt: img.label })}
                className={cn(
                  "rounded-md border border-border bg-background p-2 transition-colors hover:border-brand/60",
                  picked?.src === img.src && "border-brand ring-2 ring-brand/25",
                )}
              >
                <img src={img.src} alt={img.label} className="h-16 w-full object-contain" />
                <span className="mt-1 block text-[11px] text-muted-foreground">{img.label}</span>
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="brand"
            disabled={!picked}
            onClick={() => {
              if (!picked) return;
              onApply(picked.src, picked.alt);
              setPicked(null);
              onOpenChange(false);
            }}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
