import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Underline } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PDFObject } from "@/types/pdf";
import type { EditorState } from "./useEditorState";

const FONTS = ["Inter", "Source Serif 4", "Helvetica", "Times New Roman", "Courier"];
const SIZES = [10, 12, 14, 16, 18, 24, 32, 48];

export function FloatingTextToolbar({
  object,
  editor,
}: {
  object: PDFObject;
  editor: EditorState;
}) {
  const t = object.text;
  if (!t) return null;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute z-30 flex items-center gap-1 rounded-lg border border-border bg-background/98 px-1.5 py-1 shadow-panel backdrop-blur"
      style={{ left: object.x, top: Math.max(0, object.y - 48) }}
    >
      <Select value={t.fontFamily} onValueChange={(v) => editor.updateObjectText(object.id, { fontFamily: v })}>
        <SelectTrigger className="h-7 w-[124px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONTS.map((f) => (
            <SelectItem key={f} value={f} className="text-xs">
              {f}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(t.fontSize)}
        onValueChange={(v) => editor.updateObjectText(object.id, { fontSize: Number(v) })}
      >
        <SelectTrigger className="h-7 w-[64px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SIZES.map((s) => (
            <SelectItem key={s} value={String(s)} className="text-xs">
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      <Mini active={t.bold} label="Bold" onClick={() => editor.updateObjectText(object.id, { bold: !t.bold })}>
        <Bold className="h-3.5 w-3.5" />
      </Mini>
      <Mini active={t.italic} label="Italic" onClick={() => editor.updateObjectText(object.id, { italic: !t.italic })}>
        <Italic className="h-3.5 w-3.5" />
      </Mini>
      <Mini
        active={t.underline}
        label="Underline"
        onClick={() => editor.updateObjectText(object.id, { underline: !t.underline })}
      >
        <Underline className="h-3.5 w-3.5" />
      </Mini>

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      <label className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-input">
        <input
          type="color"
          aria-label="Text color"
          value={t.color}
          onChange={(e) => editor.updateObjectText(object.id, { color: e.target.value })}
          className="h-3.5 w-3.5 cursor-pointer border-0 bg-transparent p-0"
        />
      </label>

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(
        ([align, Icon]) => (
          <Mini
            key={align}
            active={t.align === align}
            label={`Align ${align}`}
            onClick={() => editor.updateObjectText(object.id, { align })}
          >
            <Icon className="h-3.5 w-3.5" />
          </Mini>
        ),
      )}
    </div>
  );
}

function Mini({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="iconSm"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn("h-7 w-7 text-muted-foreground", active && "bg-brand-soft text-brand")}
    >
      {children}
    </Button>
  );
}
