import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  FileText,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link2,
  PenTool,
  Shapes,
  Signature,
  Stamp as StampIcon,
  StickyNote,
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
import { Textarea } from "@/components/ui/textarea";
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

const TITLES: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  text: { label: "Text", icon: Type },
  image: { label: "Image", icon: ImageIcon },
  signature: { label: "Signature", icon: Signature },
  drawing: { label: "Drawing", icon: PenTool },
  shape: { label: "Shape", icon: Shapes },
  highlight: { label: "Annotation", icon: Highlighter },
  note: { label: "Annotation", icon: StickyNote },
  link: { label: "Link", icon: Link2 },
  stamp: { label: "Stamp", icon: StampIcon },
};

export function PropertiesPanel({ editor }: { editor: EditorState }) {
  const selected = editor.selected;
  const meta = selected ? TITLES[selected.type] : null;
  const Icon = meta?.icon ?? FileText;

  return (
    <div className="flex h-full w-full flex-col bg-toolbar">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-3">
        <Icon className="h-4 w-4 text-brand" />
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">
          {meta?.label ?? "Document"}
        </h2>
        {selected && (
          <Button
            variant="ghost"
            size="iconSm"
            aria-label="Clear selection"
            className="ml-auto text-muted-foreground"
            onClick={() => editor.setSelectedId(null)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {!selected ? (
          <DocumentProps editor={editor} />
        ) : (
          <div className="space-y-4 p-3">
            <TypeSpecific object={selected} editor={editor} />

            <Group label="Appearance">
              <Field label={`Opacity — ${selected.opacity}%`} full>
                <Slider
                  value={[selected.opacity]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(v) => editor.updateSelected({ opacity: v[0] ?? 0 })}
                  className="mt-2.5"
                />
              </Field>
              <Field label={`Rotation — ${selected.rotation}°`} full>
                <Slider
                  value={[selected.rotation]}
                  min={-180}
                  max={180}
                  step={1}
                  onValueChange={(v) => editor.updateSelected({ rotation: v[0] ?? 0 })}
                  className="mt-2.5"
                />
              </Field>
            </Group>

            <Group label="Position">
              <NumberField label="X" value={selected.x} onChange={(x) => editor.updateSelected({ x })} />
              <NumberField label="Y" value={selected.y} onChange={(y) => editor.updateSelected({ y })} />
            </Group>

            <Group label="Size">
              <NumberField
                label="Width"
                value={selected.width}
                onChange={(width) => editor.updateSelected({ width })}
              />
              <NumberField
                label="Height"
                value={selected.height}
                onChange={(height) => editor.updateSelected({ height })}
              />
            </Group>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => editor.duplicateObject(selected.id)}
              >
                Duplicate
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-destructive hover:text-destructive"
                onClick={() => editor.deleteObject(selected.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function DocumentProps({ editor }: { editor: EditorState }) {
  return (
    <div className="space-y-1 p-3">
      <Row label="Page Size" value={editor.document.pageSize} />
      <Row label="Pages" value={String(editor.document.pages.length)} />
      <Row label="Zoom" value={`${editor.zoom}%`} />
      <Row label="Orientation" value={editor.document.orientation} />
      <Separator className="my-3" />
      <Row label="Objects" value={String(editor.document.pages.reduce((n, p) => n + p.objects.length, 0))} />
      <Row label="Annotations" value={String(editor.annotations.length)} />
      <Row label="Producer" value="PDF Studio" />
      <Separator className="my-3" />
      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Tool defaults
      </h3>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Stroke">
          <ColorInput
            value={editor.defaults.stroke}
            onChange={(stroke) => editor.setDefaults({ ...editor.defaults, stroke })}
          />
        </Field>
        <NumberField
          label="Thickness"
          value={editor.defaults.thickness}
          onChange={(thickness) => editor.setDefaults({ ...editor.defaults, thickness })}
        />
        <Field label="Highlight">
          <ColorInput
            value={editor.defaults.highlightColor}
            onChange={(highlightColor) => editor.setDefaults({ ...editor.defaults, highlightColor })}
          />
        </Field>
        <NumberField
          label="Highlight %"
          value={editor.defaults.highlightOpacity}
          onChange={(highlightOpacity) => editor.setDefaults({ ...editor.defaults, highlightOpacity })}
        />
      </div>
      <p className="pt-4 text-[12px] leading-relaxed text-muted-foreground">
        Select any element on the page to edit its properties.
      </p>
    </div>
  );
}

function TypeSpecific({ object, editor }: { object: PDFObject; editor: EditorState }) {
  if (object.type === "text" && object.text) {
    const t = object.text;
    return (
      <>
        <Group label="Typography">
          <Field label="Font">
            <Select value={t.fontFamily} onValueChange={(v) => editor.updateSelectedText({ fontFamily: v })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Inter", "Source Serif 4", "Helvetica", "Times New Roman", "Courier"].map((f) => (
                  <SelectItem key={f} value={f} className="text-xs">
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <NumberField
            label="Font Size"
            value={t.fontSize}
            onChange={(fontSize) => editor.updateSelectedText({ fontSize })}
          />
          <div className="col-span-2 flex items-center gap-1.5">
            <Toggle active={t.bold} label="Bold" onClick={() => editor.updateSelectedText({ bold: !t.bold })}>
              <Bold className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle active={t.italic} label="Italic" onClick={() => editor.updateSelectedText({ italic: !t.italic })}>
              <Italic className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle
              active={t.underline}
              label="Underline"
              onClick={() => editor.updateSelectedText({ underline: !t.underline })}
            >
              <Underline className="h-3.5 w-3.5" />
            </Toggle>
            <Separator orientation="vertical" className="mx-1 h-6" />
            {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(
              ([align, Icon]) => (
                <Toggle
                  key={align}
                  active={t.align === align}
                  label={`Align ${align}`}
                  onClick={() => editor.updateSelectedText({ align })}
                >
                  <Icon className="h-3.5 w-3.5" />
                </Toggle>
              ),
            )}
          </div>
          <Field label="Text Color" full>
            <ColorInput value={t.color} onChange={(color) => editor.updateSelectedText({ color })} />
          </Field>
          <Field label="Content" full>
            <Textarea
              value={t.value}
              rows={3}
              className="text-xs"
              onChange={(e) => editor.updateSelectedText({ value: e.target.value })}
            />
          </Field>
        </Group>
      </>
    );
  }

  if (object.type === "highlight") {
    return (
      <Group label="Highlight">
        <Field label="Color" full>
          <ColorInput
            value={object.highlight?.color ?? "#ffd84d"}
            onChange={(color) => editor.updateSelected({ highlight: { color } })}
          />
        </Field>
      </Group>
    );
  }

  if (object.type === "drawing" && object.drawing) {
    const d = object.drawing;
    return (
      <Group label="Stroke">
        <Field label="Color">
          <ColorInput value={d.stroke} onChange={(stroke) => editor.updateSelected({ drawing: { ...d, stroke } })} />
        </Field>
        <NumberField
          label="Thickness"
          value={d.thickness}
          onChange={(thickness) => editor.updateSelected({ drawing: { ...d, thickness } })}
        />
      </Group>
    );
  }

  if (object.type === "shape" && object.shape) {
    const s = object.shape;
    return (
      <Group label="Shape">
        <Field label="Stroke">
          <ColorInput value={s.stroke} onChange={(stroke) => editor.updateSelected({ shape: { ...s, stroke } })} />
        </Field>
        <NumberField
          label="Thickness"
          value={s.thickness}
          onChange={(thickness) => editor.updateSelected({ shape: { ...s, thickness } })}
        />
        <Field label="Fill" full>
          <div className="flex items-center gap-2">
            <ColorInput
              value={s.fill === "transparent" ? "#ffffff" : s.fill}
              onChange={(fill) => editor.updateSelected({ shape: { ...s, fill } })}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 shrink-0 text-[11px]"
              onClick={() => editor.updateSelected({ shape: { ...s, fill: "transparent" } })}
            >
              None
            </Button>
          </div>
        </Field>
      </Group>
    );
  }

  if (object.type === "note" && object.note) {
    const n = object.note;
    return (
      <Group label="Comment">
        <Field label="Message" full>
          <Textarea
            rows={4}
            className="text-xs"
            value={n.body}
            onChange={(e) => editor.updateSelected({ note: { ...n, body: e.target.value } })}
          />
        </Field>
        <Field label="Author" full>
          <Input
            className="h-8 text-xs"
            value={n.author}
            onChange={(e) => editor.updateSelected({ note: { ...n, author: e.target.value } })}
          />
        </Field>
      </Group>
    );
  }

  if (object.type === "link" && object.link) {
    return (
      <Group label="Link">
        <Field label="URL" full>
          <Input
            className="h-8 text-xs"
            value={object.link.url}
            onChange={(e) => editor.updateSelected({ link: { url: e.target.value } })}
          />
        </Field>
      </Group>
    );
  }

  if (object.type === "stamp" && object.stamp) {
    const s = object.stamp;
    return (
      <Group label="Stamp">
        <Field label="Label">
          <Input
            className="h-8 text-xs"
            value={s.label}
            onChange={(e) => editor.updateSelected({ stamp: { ...s, label: e.target.value } })}
          />
        </Field>
        <Field label="Color">
          <ColorInput value={s.color} onChange={(color) => editor.updateSelected({ stamp: { ...s, color } })} />
        </Field>
      </Group>
    );
  }

  if (object.type === "image" && object.image) {
    return (
      <Group label="Image">
        <Field label="Preview" full>
          <div className="rounded-md border border-border bg-background p-2">
            <img src={object.image.src} alt={object.image.alt} className="h-20 w-full object-contain" />
          </div>
        </Field>
        <Field label="Alt text" full>
          <Input
            className="h-8 text-xs"
            value={object.image.alt}
            onChange={(e) =>
              editor.updateSelected({ image: { src: object.image!.src, alt: e.target.value } })
            }
          />
        </Field>
      </Group>
    );
  }

  if (object.type === "signature" && object.signature) {
    return (
      <Group label="Signature">
        <Field label="Source" full>
          <p className="text-[12px] capitalize text-muted-foreground">{object.signature.kind}</p>
        </Field>
      </Group>
    );
  }

  return null;
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

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={cn("space-y-1", full && "col-span-2")}>
      <Label className="text-[11px] font-normal text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <Input
        type="number"
        className="h-8 text-xs"
        value={Math.round(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Field>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex h-8 w-full items-center gap-2 rounded-md border border-input bg-background px-2">
      <input
        type="color"
        aria-label="Colour"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
      />
      <span className="text-xs uppercase tabular-nums text-muted-foreground">{value}</span>
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
