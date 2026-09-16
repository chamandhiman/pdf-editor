import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (url: string) => void;
}

export function LinkModal({ open, onOpenChange, onApply }: Props) {
  const [url, setUrl] = useState("https://example.com");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Enter URL</DialogTitle>
          <DialogDescription>A clickable link area is placed on the current page.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="link-url" className="text-[12px] text-muted-foreground">
            Destination
          </Label>
          <Input
            id="link-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="brand"
            disabled={!url.trim()}
            onClick={() => {
              onApply(url.trim());
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
