import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Bold, Italic, Underline,
  Palette, Minus, Plus, ChevronDown,
  Copy, PenLine, Trash2, Layers, ChevronsUp, ChevronUp, ChevronsDown,
} from "lucide-react";
import type { PDFObject, TextStyleOverride } from "@/types/pdf";
import type { EditorState } from "./useEditorState";

export const GOOGLE_FONTS = [
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Inter",
  "Nunito",
  "Raleway",
  "Oswald",
  "Merriweather",
] as const;

export const COLOR_PALETTE = [
  "#000000",
  "#334155",
  "#64748b",
  "#dc2626",
  "#ea580c",
  "#d97706",
  "#16a34a",
  "#0d9488",
  "#0284c7",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ffffff",
];

const COMMON_SIZES = [9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64];

interface StandaloneProps {
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
  align: "left" | "center" | "right" | "justify";
  detectedFont?: string | null;
  onChange: (updates: Partial<TextStyleOverride>) => void;
  position: { top: number; left: number };
}

interface ObjectProps {
  object: PDFObject;
  editor: EditorState;
}

export type FloatingTextToolbarProps = StandaloneProps | ObjectProps;

// ── Custom portal dropdown ──────────────────────────────────────────────────
interface DDOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  style?: React.CSSProperties;
  group?: string;
}

function CustomDropdown({
  trigger, options, onSelect, width = 192,
}: { trigger: React.ReactNode; options: DDOption[]; onSelect: (v: string) => void; width?: number }) {
  const [open, setOpen] = useState(false);
  const trigRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const openMenu = useCallback(() => {
    if (!trigRef.current) return;
    const r = trigRef.current.getBoundingClientRect();
    const h = Math.min(options.length * 30 + 16, 288);
    const top = (window.innerHeight - r.bottom) >= h ? r.bottom + 4 : r.top - h - 4;
    const left = Math.max(4, Math.min(r.left, window.innerWidth - width - 4));
    setPos({ top, left });
    setOpen(true);
  }, [options.length, width]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node) || trigRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close, true);
    return () => document.removeEventListener("mousedown", close, true);
  }, [open]);

  const groups: { name: string; items: DDOption[] }[] = [];
  let cur: string | null = null;
  for (const opt of options) {
    const g = opt.group ?? "";
    if (g !== cur) { cur = g; groups.push({ name: g, items: [] }); }
    groups[groups.length - 1]!.items.push(opt);
  }


  return (
    <>
      <button
        ref={trigRef}
        type="button"
        data-floating-toolbar="true"
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); open ? setOpen(false) : openMenu(); }}
        className="flex h-7 items-center gap-1 rounded px-2 text-xs font-medium hover:bg-accent/70 cursor-pointer select-none"
      >
        {trigger}
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          data-floating-toolbar="true"
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          style={{ position: "fixed", top: pos.top, left: pos.left, width, zIndex: 99999, maxHeight: 288, overflowY: "auto" }}
          className="rounded-lg border border-border bg-popover py-1 shadow-xl text-popover-foreground"
        >
          {groups.map((group) => (
            <div key={group.name}>
              {group.name && (
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.name}
                </div>
              )}
              {group.items.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  data-floating-toolbar="true"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelect(opt.value); setOpen(false); }}
                  style={opt.style}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-accent cursor-pointer"
                >
                  {opt.icon && <opt.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

// ── Color picker ────────────────────────────────────────────────────────────
function ColorPicker({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  const trigRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const openPanel = () => {
    if (!trigRef.current) return;
    const r = trigRef.current.getBoundingClientRect();
    const top = (window.innerHeight - r.bottom) >= 140 ? r.bottom + 4 : r.top - 144;
    const left = Math.max(4, Math.min(r.left - 40, window.innerWidth - 200));
    setPos({ top, left }); setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node) || trigRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close, true);
    return () => document.removeEventListener("mousedown", close, true);
  }, [open]);

  return (
    <>
      <button
        ref={trigRef}
        type="button"
        data-floating-toolbar="true"
        title="Text Color"
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); open ? setOpen(false) : openPanel(); }}
        className="flex h-7 items-center gap-1 rounded px-1.5 hover:bg-accent/70 cursor-pointer"
      >
        <Palette className="h-3.5 w-3.5" />
        <span className="h-3 w-3 rounded-full border border-border shadow-sm" style={{ backgroundColor: color }} />
      </button>
      {open && createPortal(
        <div
          ref={panelRef}
          data-floating-toolbar="true"
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 99999 }}
          className="rounded-lg border border-border bg-popover p-2 shadow-xl"
        >
          <div className="grid grid-cols-7 gap-1">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                data-floating-toolbar="true"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(c); setOpen(false); }}
                className="h-6 w-6 rounded border border-border transition-transform hover:scale-110"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1.5 border-t border-border pt-2">
            <input
              type="color" value={color}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => onChange(e.target.value)}
              className="h-6 w-6 cursor-pointer rounded border border-border bg-transparent p-0"
              title="Custom Color"
            />
            <input
              type="text" value={color}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => onChange(e.target.value)}
              className="h-6 flex-1 rounded border border-input bg-transparent px-1.5 text-xs uppercase"
              placeholder="#000000"
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ── Small helpers ───────────────────────────────────────────────────────────
function ToolBtn({
  active,
  onClick,
  title,
  children,
  className = "",
}: {
  active?: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-floating-toolbar="true"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className={`flex h-7 w-7 items-center justify-center rounded cursor-pointer transition-colors ${
        active ? "bg-accent text-accent-foreground" : "hover:bg-accent/70 text-foreground/80 hover:text-foreground"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function VSep() {
  return <div className="mx-0.5 h-5 w-px bg-border/70 shrink-0" />;
}

// ── Main toolbar ────────────────────────────────────────────────────────────
export function FloatingTextToolbar(props: FloatingTextToolbarProps) {
  let fontFamily = "Arial", fontSize = 16, bold = false, italic = false, underline = false, color = "#000000";
  let align: "left" | "center" | "right" | "justify" = "left";
  let detectedFont: string | null | undefined = null;
  let position = { top: 0, left: 0 };
  let onChange: (updates: Partial<TextStyleOverride>) => void = () => {};

  if ("object" in props) {
    const t = props.object.text ?? { value: "", fontFamily: "Arial", fontSize: 16, bold: false, italic: false, underline: false, color: "#000000", align: "left" as const };
    fontFamily = t.fontFamily || "Arial"; fontSize = t.fontSize || 16; bold = !!t.bold; italic = !!t.italic; underline = !!t.underline; color = t.color || "#000000"; align = t.align || "left";
    position = { top: Math.max(8, props.object.y - 44), left: Math.max(8, props.object.x) };
    onChange = (updates) => props.editor.updateObjectText(props.object.id, updates);
  } else {
    fontFamily = props.fontFamily; fontSize = props.fontSize; bold = props.bold; italic = props.italic; underline = props.underline; color = props.color; align = props.align; detectedFont = props.detectedFont; position = props.position; onChange = props.onChange;
  }

  const hasDetected = Boolean(detectedFont && detectedFont.trim() && detectedFont !== "Unknown Font");
  const detectedLabel = hasDetected ? detectedFont!.trim() : "Unknown Font";

  const isGoogleFont = GOOGLE_FONTS.find((f) => fontFamily.toLowerCase().includes(f.toLowerCase()));
  const isArialExplicit = (fontFamily.toLowerCase() === "arial, sans-serif" || fontFamily.toLowerCase() === "arial") && !hasDetected;

  const displayFamily =
    isGoogleFont ||
    (isArialExplicit ? "Arial" : detectedLabel);

  const fontOptions: DDOption[] = [
    {
      label: detectedLabel,
      value: hasDetected ? `'${detectedLabel}', Arial, sans-serif` : "Arial, sans-serif",
      group: "Detected",
      style: { fontFamily: hasDetected ? `'${detectedLabel}', Arial, sans-serif` : "Arial, sans-serif" },
    },
    { label: "Arial", value: "Arial, sans-serif", group: "Default", style: { fontFamily: "Arial, sans-serif" } },
    ...GOOGLE_FONTS.map((f) => ({
      label: f,
      value: `'${f}', Arial, sans-serif`,
      group: "Google Fonts",
      style: { fontFamily: `'${f}', Arial, sans-serif` },
    })),
  ];

  const COMMON_SIZES = [8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36, 48, 64, 72];
  const roundedDisplaySize = Math.round(fontSize * 10) / 10;
  const intSize = Math.round(fontSize);
  const displaySizeLabel = String(roundedDisplaySize === intSize ? intSize : roundedDisplaySize);
  const allSizes = Array.from(new Set([...COMMON_SIZES, intSize])).sort((a, b) => a - b);
  const sizeOptions: DDOption[] = allSizes.map((s) => ({ label: String(s), value: String(s) }));

  const AlignIcon =
    align === "center"
      ? AlignCenter
      : align === "right"
      ? AlignRight
      : align === "justify"
      ? AlignJustify
      : AlignLeft;

  const alignOptions: DDOption[] = [
    { label: "Left", value: "left", icon: AlignLeft },
    { label: "Center", value: "center", icon: AlignCenter },
    { label: "Right", value: "right", icon: AlignRight },
    { label: "Justify", value: "justify", icon: AlignJustify },
  ];

  const layerOptions: DDOption[] = [
    { label: "Bring to Front ↑", value: "front", icon: ChevronsUp },
    { label: "Bring Forward ↑", value: "forward", icon: ChevronUp },
    { label: "Send Backward ↓", value: "backward", icon: ChevronDown },
    { label: "Send to Back ↓", value: "back", icon: ChevronsDown },
  ];

  return (
    <div
      data-floating-toolbar="true"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{ position: "absolute", top: Math.max(8, position.top), left: Math.max(8, position.left), zIndex: 9999 }}
      className="flex items-center gap-0.5 rounded-lg border border-border bg-card/95 px-1 py-1 shadow-xl backdrop-blur-md select-none animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Font Family */}
      <CustomDropdown
        trigger={<><span className="max-w-[85px] truncate text-xs">{displayFamily}</span><ChevronDown className="h-3 w-3 shrink-0 opacity-60" /></>}
        options={fontOptions}
        onSelect={(val) => onChange({ fontFamily: val })}
        width={180}
      />

      <VSep />

      {/* Font Size */}
      <button
        type="button" data-floating-toolbar="true"
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange({ fontSize: Math.max(6, Math.round(fontSize - 1)) }); }}
        className="flex h-7 w-6 items-center justify-center rounded hover:bg-accent/70 cursor-pointer text-muted-foreground hover:text-foreground"
      ><Minus className="h-3 w-3" /></button>

      <CustomDropdown
        trigger={<span className="min-w-[20px] text-center text-xs">{displaySizeLabel}</span>}
        options={sizeOptions}
        onSelect={(val) => onChange({ fontSize: Number(val) })}
        width={70}
      />

      <button
        type="button" data-floating-toolbar="true"
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange({ fontSize: Math.min(144, Math.round(fontSize + 1)) }); }}
        className="flex h-7 w-6 items-center justify-center rounded hover:bg-accent/70 cursor-pointer text-muted-foreground hover:text-foreground"
      ><Plus className="h-3 w-3" /></button>

      <VSep />

      <ToolBtn active={bold} onClick={() => onChange({ bold: !bold })} title="Bold"><Bold className="h-3.5 w-3.5" /></ToolBtn>
      <ToolBtn active={italic} onClick={() => onChange({ italic: !italic })} title="Italic"><Italic className="h-3.5 w-3.5" /></ToolBtn>
      <ToolBtn active={underline} onClick={() => onChange({ underline: !underline })} title="Underline"><Underline className="h-3.5 w-3.5" /></ToolBtn>

      <VSep />

      <ColorPicker color={color} onChange={(c) => onChange({ color: c })} />

      <VSep />

      {/* Compact Text Alignment Dropdown */}
      <CustomDropdown
        trigger={
          <span className="flex h-7 items-center gap-1 rounded px-1.5 hover:bg-accent/70 cursor-pointer text-muted-foreground hover:text-foreground" title="Text Alignment">
            <AlignIcon className="h-3.5 w-3.5 text-foreground" />
            <ChevronDown className="h-2.5 w-2.5 opacity-60" />
          </span>
        }
        options={alignOptions}
        onSelect={(val) => onChange({ align: val as "left" | "center" | "right" | "justify" })}
        width={110}
      />

      {"object" in props && (
        <>
          <VSep />
          {/* Layer Order Dropdown */}
          <CustomDropdown
            trigger={
              <span className="flex h-7 items-center gap-1 rounded px-1.5 hover:bg-accent/70 cursor-pointer text-muted-foreground hover:text-foreground" title="Layer Order">
                <Layers className="h-3.5 w-3.5" />
                <ChevronDown className="h-2.5 w-2.5 opacity-60" />
              </span>
            }
            options={layerOptions}
            onSelect={(val) => {
              if (!("object" in props)) return;
              if (val === "front") props.editor.bringToFront(props.object.id);
              else if (val === "forward") props.editor.bringForward(props.object.id);
              else if (val === "backward") props.editor.sendBackward(props.object.id);
              else if (val === "back") props.editor.sendToBack(props.object.id);
            }}
            width={160}
          />
          <VSep />
          <ToolBtn
            active={props.editor.editingId === props.object.id}
            onClick={() => props.editor.setEditingId(props.object.id)}
            title="Edit text"
          >
            <PenLine className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn
            active={false}
            onClick={() => props.editor.duplicateObject(props.object.id)}
            title="Duplicate"
          >
            <Copy className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn
            active={false}
            onClick={() => props.editor.deleteObject(props.object.id)}
            title="Delete"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </ToolBtn>
        </>
      )}
    </div>
  );
}

