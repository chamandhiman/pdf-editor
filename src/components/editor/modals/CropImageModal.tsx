import { useState, useRef, useEffect, useCallback } from "react";
import {
  Crop,
  RotateCw,
  RotateCcw,
  Check,
  Undo2,
  Maximize2,
  Sparkles,
  Square,
  RectangleHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  originalSrc?: string;
  currentWidth: number;
  currentHeight: number;
  onApplyCrop: (croppedSrc: string, newWidth: number, newHeight: number) => void;
  onResetOriginal?: () => void;
}

type AspectRatioPreset = "free" | "1:1" | "4:3" | "16:9" | "3:2";

export function CropImageModal({
  open,
  onOpenChange,
  imageSrc,
  originalSrc,
  currentWidth,
  currentHeight,
  onApplyCrop,
  onResetOriginal,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [activeSrc, setActiveSrc] = useState(imageSrc);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 400, height: 300 });
  const [displayedSize, setDisplayedSize] = useState({ width: 400, height: 300 });
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, width: 300, height: 200 });
  const [aspectPreset, setAspectPreset] = useState<AspectRatioPreset>("free");
  const [rotation, setRotation] = useState(0);

  // Initialize image on open
  useEffect(() => {
    if (open) {
      setActiveSrc(imageSrc);
      setImageLoaded(false);
      setRotation(0);
      setAspectPreset("free");
    }
  }, [open, imageSrc]);

  const handleImageLoad = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    const nw = img.naturalWidth || 400;
    const nh = img.naturalHeight || 300;
    setNaturalSize({ width: nw, height: nh });

    const dw = img.clientWidth || 400;
    const dh = img.clientHeight || 300;
    setDisplayedSize({ width: dw, height: dh });

    // Initial crop: 90% centered
    const marginX = Math.round(dw * 0.05);
    const marginY = Math.round(dh * 0.05);
    setCrop({
      x: marginX,
      y: marginY,
      width: dw - marginX * 2,
      height: dh - marginY * 2,
    });
    setImageLoaded(true);
  };

  // Adjust aspect ratio preset
  const applyPreset = (preset: AspectRatioPreset) => {
    setAspectPreset(preset);
    if (!displayedSize.width || !displayedSize.height) return;

    let targetRatio: number | null = null;
    if (preset === "1:1") targetRatio = 1;
    if (preset === "4:3") targetRatio = 4 / 3;
    if (preset === "16:9") targetRatio = 16 / 9;
    if (preset === "3:2") targetRatio = 3 / 2;

    if (!targetRatio) return; // freeform

    const maxW = displayedSize.width * 0.9;
    const maxH = displayedSize.height * 0.9;

    let w = maxW;
    let h = w / targetRatio;
    if (h > maxH) {
      h = maxH;
      w = h * targetRatio;
    }

    const x = Math.max(0, Math.round((displayedSize.width - w) / 2));
    const y = Math.max(0, Math.round((displayedSize.height - h) / 2));

    setCrop({
      x,
      y,
      width: Math.round(w),
      height: Math.round(h),
    });
  };

  // Dragging crop handles
  const handleDragStart = (
    mode: "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w"
  ) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const origCrop = { ...crop };
    const dw = displayedSize.width;
    const dh = displayedSize.height;

    const onPointerMove = (ev: PointerEvent) => {
      ev.preventDefault();
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      setCrop((prev) => {
        let { x, y, width, height } = origCrop;

        if (mode === "move") {
          x = Math.max(0, Math.min(dw - width, origCrop.x + dx));
          y = Math.max(0, Math.min(dh - height, origCrop.y + dy));
          return { x, y, width, height };
        }

        if (mode.includes("e")) {
          width = Math.max(30, Math.min(dw - origCrop.x, origCrop.width + dx));
        }
        if (mode.includes("s")) {
          height = Math.max(30, Math.min(dh - origCrop.y, origCrop.height + dy));
        }
        if (mode.includes("w")) {
          const newW = Math.max(30, origCrop.width - dx);
          const maxLeft = origCrop.x + origCrop.width - 30;
          x = Math.min(maxLeft, Math.max(0, origCrop.x + dx));
          width = origCrop.x + origCrop.width - x;
        }
        if (mode.includes("n")) {
          const newH = Math.max(30, origCrop.height - dy);
          const maxTop = origCrop.y + origCrop.height - 30;
          y = Math.min(maxTop, Math.max(0, origCrop.y + dy));
          height = origCrop.y + origCrop.height - y;
        }

        return { x, y, width, height };
      });
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Perform crop on HTML5 Canvas
  const handleApply = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;

    const scaleX = naturalSize.width / displayedSize.width;
    const scaleY = naturalSize.height / displayedSize.height;

    const cropSourceX = Math.round(crop.x * scaleX);
    const cropSourceY = Math.round(crop.y * scaleY);
    const cropSourceW = Math.round(crop.width * scaleX);
    const cropSourceH = Math.round(crop.height * scaleY);

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, cropSourceW);
    canvas.height = Math.max(1, cropSourceH);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (rotation !== 0) {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(
        img,
        cropSourceX,
        cropSourceY,
        cropSourceW,
        cropSourceH,
        -canvas.width / 2,
        -canvas.height / 2,
        canvas.width,
        canvas.height
      );
      ctx.restore();
    } else {
      ctx.drawImage(
        img,
        cropSourceX,
        cropSourceY,
        cropSourceW,
        cropSourceH,
        0,
        0,
        canvas.width,
        canvas.height
      );
    }

    const croppedDataUrl = canvas.toDataURL("image/png");

    // Compute proportional new layout width and height
    const ratio = crop.width / crop.height;
    const newWidth = Math.round(Math.min(currentWidth, currentHeight * ratio));
    const newHeight = Math.round(newWidth / ratio);

    onApplyCrop(croppedDataUrl, newWidth, newHeight);
    onOpenChange(false);
  };

  const handleResetCrop = () => {
    if (originalSrc) {
      setActiveSrc(originalSrc);
      onResetOriginal?.();
    }
    const marginX = Math.round(displayedSize.width * 0.05);
    const marginY = Math.round(displayedSize.height * 0.05);
    setCrop({
      x: marginX,
      y: marginY,
      width: displayedSize.width - marginX * 2,
      height: displayedSize.height - marginY * 2,
    });
    setAspectPreset("free");
    setRotation(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <Crop className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>Crop Image</DialogTitle>
              <DialogDescription>
                Drag the crop handles or select an aspect ratio to crop your canvas image.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Aspect Ratio Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-muted-foreground mr-1">Aspect Ratio:</span>
            {(
              [
                { id: "free", label: "Freeform" },
                { id: "1:1", label: "1:1 Square" },
                { id: "4:3", label: "4:3 Standard" },
                { id: "16:9", label: "16:9 Wide" },
                { id: "3:2", label: "3:2 Photo" },
              ] as const
            ).map((p) => (
              <Button
                key={p.id}
                type="button"
                variant={aspectPreset === p.id ? "brand" : "outline"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => applyPreset(p.id)}
              >
                {p.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              title="Rotate 90°"
            >
              <RotateCw className="h-3 w-3" />
              <span>Rotate</span>
            </Button>
            {originalSrc && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                onClick={handleResetCrop}
                title="Reset to original uncropped image"
              >
                <Undo2 className="h-3 w-3" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </div>

        {/* Image Cropping Workspace */}
        <div
          ref={containerRef}
          className="relative flex h-[360px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-slate-900/90 select-none"
        >
          <img
            ref={imageRef}
            src={activeSrc}
            alt="Crop preview"
            onLoad={handleImageLoad}
            style={{
              maxHeight: "340px",
              maxWidth: "100%",
              transform: rotation ? `rotate(${rotation}deg)` : undefined,
            }}
            className="pointer-events-none select-none object-contain"
          />

          {imageLoaded && (
            <div
              className="absolute pointer-events-auto"
              style={{
                width: displayedSize.width,
                height: displayedSize.height,
              }}
            >
              {/* Darkened mask outside crop area */}
              <div
                className="absolute inset-0 bg-black/60 pointer-events-none"
                style={{
                  clipPath: `polygon(
                    0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
                    ${crop.x}px ${crop.y}px,
                    ${crop.x + crop.width}px ${crop.y}px,
                    ${crop.x + crop.width}px ${crop.y + crop.height}px,
                    ${crop.x}px ${crop.y + crop.height}px,
                    ${crop.x}px ${crop.y}px
                  )`,
                }}
              />

              {/* Draggable Crop Box */}
              <div
                onPointerDown={handleDragStart("move")}
                style={{
                  left: crop.x,
                  top: crop.y,
                  width: crop.width,
                  height: crop.height,
                }}
                className="absolute border-2 border-brand shadow-2xl cursor-move touch-none select-none"
              >
                {/* 3x3 Grid Lines (Rule of Thirds) */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                  <div className="border-r border-b border-brand" />
                  <div className="border-r border-b border-brand" />
                  <div className="border-b border-brand" />
                  <div className="border-r border-b border-brand" />
                  <div className="border-r border-b border-brand" />
                  <div className="border-b border-brand" />
                  <div className="border-r border-brand" />
                  <div className="border-r border-brand" />
                  <div />
                </div>

                {/* Corner Resize Handles */}
                <div
                  onPointerDown={handleDragStart("nw")}
                  className="absolute -left-2 -top-2 h-4 w-4 bg-brand border-2 border-white rounded-full cursor-nwse-resize shadow-md"
                />
                <div
                  onPointerDown={handleDragStart("ne")}
                  className="absolute -right-2 -top-2 h-4 w-4 bg-brand border-2 border-white rounded-full cursor-nesw-resize shadow-md"
                />
                <div
                  onPointerDown={handleDragStart("sw")}
                  className="absolute -left-2 -bottom-2 h-4 w-4 bg-brand border-2 border-white rounded-full cursor-nesw-resize shadow-md"
                />
                <div
                  onPointerDown={handleDragStart("se")}
                  className="absolute -right-2 -bottom-2 h-4 w-4 bg-brand border-2 border-white rounded-full cursor-nwse-resize shadow-md"
                />

                {/* Edge Resize Handles */}
                <div
                  onPointerDown={handleDragStart("n")}
                  className="absolute left-1/2 -top-1.5 -translate-x-1/2 h-3 w-6 bg-brand/80 border border-white rounded-sm cursor-ns-resize"
                />
                <div
                  onPointerDown={handleDragStart("s")}
                  className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 h-3 w-6 bg-brand/80 border border-white rounded-sm cursor-ns-resize"
                />
                <div
                  onPointerDown={handleDragStart("w")}
                  className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-6 bg-brand/80 border border-white rounded-sm cursor-ew-resize"
                />
                <div
                  onPointerDown={handleDragStart("e")}
                  className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-6 bg-brand/80 border border-white rounded-sm cursor-ew-resize"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="text-xs text-muted-foreground">
            Crop: {Math.round(crop.width)} × {Math.round(crop.height)} px
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="brand" onClick={handleApply} className="gap-1.5">
              <Check className="h-4 w-4" />
              <span>Apply Crop</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
