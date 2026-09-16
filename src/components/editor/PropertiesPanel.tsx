import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  FileText,
  Italic,
  Type,
  Underline,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { EditorState } from "./useEditorState";

export function PropertiesPanel({ editor }: { editor: EditorState }) {
  const selected = editor.selected;

  return (
    <div className="flex h-full w-full flex-col bg-toolbar">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-3">
        {selected ? <Type className="h-4 w-4 text-brand" /> : <FileText className="h-4 w-4 text-brand" />}
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">
          {selected ? "Text" : "Document"}
        </h2>
        {selected && (
          <Button
            variant="ghost"
            size="iconSm"
            aria-label="Clear selection"
            className="ml-auto text-muted-foreground"
            onClick={() => editor.setSelected(null)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {!selected ? (
          <div className="space-y-1 p-3">
            <Row label="Page Size" value={editor.document.pageSize} />
            <Row label="Pages" value={String(editor.document.pages.length)} />
            <Row label="Zoom" value={`${editor.zoom}%`} />
            <Row label="Orientation" value={editor.document.orientation} />
            <Separator className="my-3" />
            <Row label="File size" value="248 KB" />
            <Row label="Created" value="14 Sep 2026" />
            <Row label="Producer" value="PDF Studio" />
            <p className="pt-4 text-[12px] leading-relaxed text-muted-foreground">
              Select any element on the page to edit its properties.
            </p>
          </div>
        ) : (
          <div className="space-y-4 p-3">
            <Group label="Typography">
              <Field label="Font">
                <Select
                  value={selected.text?.fontFamily ?? "Inter"}
                  onValueChange={(v) => editor.updateSelectedText({ fontFamily: v })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Inter", "Source Serif 4", "Helvetica", "Times New Roman", "Courier"].map(
                      (f) => (
                        <SelectItem key={f} value={f} className="text-xs">
                          {f}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Font Size">
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={selected.text?.fontSize ?? 16}
                  onChange={(e) => editor.updateSelectedText({ fontSize: Number(e.target.value) })}
                />
              </Field>
              <div className="col-span-2 flex items-center gap-1.5">
                <Toggle
                  active={!!selected.text?.bold}
                  label="Bold"
                  onClick={() => editor.updateSelectedText({ bold: !selected.text?.bold })}
                >
                  <Bold className="h-3.5 w-3.5" />
                </Toggle>
                <Toggle
                  active={!!selected.text?.italic}
                  label="Italic"
                  onClick={() => editor.updateSelectedText({ italic: !selected.text?.italic })}
                >
                  <Italic className="h-3.5 w-3.5" />
                </Toggle>
                <Toggle
                  active={!!selected.text?.underline}
                  label="Underline"
                  onClick={() => editor.updateSelectedText({ underline: !selected.text?.underline })}
                >
                  <Underline className="h-3.5 w-3.5" />
                </Toggle>
                <Separator orientation="vertical" className="mx-1 h-6" />
                {(
                  [
                    ["left", AlignLeft],
                    ["center", AlignCenter],
                    ["right", AlignRight],
                  ] as const
                ).map(([align, Icon]) => (
                  <Toggle
                    key={align}
                    active={selected.text?.align === align}
                    label={`Align ${align}`}
                    onClick={() => editor.updateSelectedText({ align })}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </Toggle>
                ))}
              </div>
            </Group>

            <Group label="Appearance">
              <Field label="Text Color">
                <div className="flex h-8 items-center gap-2 rounded-md border border-input bg-background px-2">
                  <input
                    type="color"
                    aria-label="Text color"
                    value={selected.text?.color ?? "#1c2333"}
                    onChange={(e) => editor.updateSelectedText({ color: e.target.value })}
                    className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span className="text-xs uppercase tabular-nums text-muted-foreground">
                    {selected.text?.color}
                  </span>
                </div>
              </Field>
              <Field label={`Opacity — ${selected.opacity}%`}>
                <Slider
                  value={[selected.opacity]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(vals) => editor.updateSelected({ opacity: vals[0] ?? 0 })}
                  className="mt-2.5"
                />
              </Field>
            </Group>

            <Group label="Position">
              <Field label="X">
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={selected.x}
                  onChange={(e) => editor.updateSelected({ x: Number(e.target.value) })}
                />
              </Field>
              <Field label="Y">
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={selected.y}
                  onChange={(e) => editor.updateSelected({ y: Number(e.target.value) })}
                />
              </Field>
            </Group>

            <Group label="Size">
              <Field label="Width">
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={selected.width}
                  onChange={(e) => editor.updateSelected({ width: Number(e.target.value) })}
                />
              </Field>
              <Field label="Height">
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={selected.height}
                  onChange={(e) => editor.updateSelected({ height: Number(e.target.value) })}
                />
              </Field>
            </Group>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/70 py-2 last:border-0">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className="text-[12.5px] font-medium tabular-nums">{value}</span>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </h3>
      <div className="grid grid-cols-2 gap-2.5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-normal text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Toggle({
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
      className={cn(
        "border border-transparent text-muted-foreground",
        active && "border-brand/30 bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand",
      )}
    >
      {children}
    </Button>
  );
}
