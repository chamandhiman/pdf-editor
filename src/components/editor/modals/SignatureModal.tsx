import { useRef, useState } from "react";
import { Upload } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signatureFonts } from "@/lib/demo-document";
import { cn } from "@/lib/utils";
import type { PDFObject } from "@/types/pdf";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (signature: NonNullable<PDFObject["signature"]>) => void;
}

export function SignatureModal({ open, onOpenChange, onApply }: Props) {
  const [tab, setTab] = useState("draw");
  const [name, setName] = useState("Aarav Sharma");
  const [font, setFont] = useState(signatureFonts[0]!.family);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  const ctx = () => canvasRef.current?.getContext("2d") ?? null;

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * e.currentTarget.width,
      y: ((e.clientY - rect.top) / rect.height) * e.currentTarget.height,
    };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = ctx();
    if (!c) return;
    drawing.current = true;
    setHasInk(true);
    const p = pos(e);
    c.strokeStyle = "#14213d";
    c.lineWidth = 3;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(p.x, p.y);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const c = ctx();
    const p = pos(e);
    c?.lineTo(p.x, p.y);
    c?.stroke();
  };

  const clear = () => {
    const c = ctx();
    if (c && canvasRef.current)
      c.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasInk(false);
  };

  const apply = () => {
    if (tab === "draw" && canvasRef.current && hasInk) {
      onApply({ kind: "draw", src: canvasRef.current.toDataURL("image/png") });
    } else if (tab === "type" && name.trim()) {
      onApply({ kind: "type", name: name.trim(), font });
    } else if (tab === "upload" && uploaded) {
      onApply({ kind: "upload", src: uploaded });
    } else {
      return;
    }
    clear();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Add Signature</DialogTitle>
          <DialogDescription>Draw, type or upload a signature to place on the page.</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="draw">Draw</TabsTrigger>
            <TabsTrigger value="type">Type</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="mt-4">
            <canvas
              ref={canvasRef}
              width={960}
              height={300}
              onPointerDown={startDraw}
              onPointerMove={moveDraw}
              onPointerUp={() => (drawing.current = false)}
              className="h-[190px] w-full touch-none rounded-md border border-dashed border-border bg-muted/30"
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[12px] text-muted-foreground">Sign inside the box using a mouse, pen or finger.</p>
              <Button variant="ghost" size="sm" onClick={clear}>
                Clear
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="type" className="mt-4 space-y-3">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Type your full name" />
            <div className="grid gap-2">
              {signatureFonts.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFont(f.family)}
                  className={cn(
                    "flex items-center justify-between rounded-md border border-border px-4 py-3 text-left transition-colors hover:border-brand/60",
                    font === f.family && "border-brand bg-brand-soft",
                  )}
                >
                  <span className="text-[26px] leading-none text-[#14213d]" style={{ fontFamily: f.family }}>
                    {name || "Your name"}
                  </span>
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{f.label}</span>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <label className="flex h-[190px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/30 text-center">
              {uploaded ? (
                <img src={uploaded} alt="Signature preview" className="max-h-[150px] object-contain" />
              ) : (
                <>
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Upload signature image</span>
                  <span className="text-[12px] text-muted-foreground">PNG or JPG with a transparent background</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setUploaded(String(reader.result));
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="brand" onClick={apply}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
