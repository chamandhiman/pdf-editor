import { useEffect, useState, useRef } from "react";
import type { EditorState, TextPresetKind } from "./useEditorState";
import {
  Type,
  Heading1,
  Heading2,
  AlignLeft,
  List,
  ListOrdered,
  ListTodo,
  ImageIcon,
  StickyNote,
} from "lucide-react";

interface EditorCursorFollowerProps {
  editor: EditorState;
}

const PRESET_CONFIG: Record<
  TextPresetKind,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  text: { label: "Text", icon: Type },
  heading: { label: "Heading", icon: Heading1 },
  subheading: { label: "Subheading", icon: Heading2 },
  paragraph: { label: "Paragraph", icon: AlignLeft },
  "bullet-list": { label: "Bullet List", icon: List },
  "numbered-list": { label: "Numbered List", icon: ListOrdered },
  checklist: { label: "Checklist", icon: ListTodo },
};

export function EditorCursorFollower({ editor }: EditorCursorFollowerProps) {
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  const isAddText = editor.tool === "add-text";
  const isPendingImage = editor.tool === "image" && !!editor.pendingImage;
  const isNote = editor.tool === "note";

  const isActive = isAddText || isPendingImage || isNote;

  useEffect(() => {
    if (!isActive) {
      setIsVisible(false);
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      animFrameRef.current = requestAnimationFrame(() => {
        setCoords({ x: e.clientX, y: e.clientY });
        setIsVisible(true);
      });
    };

    const handlePointerLeave = () => {
      setIsVisible(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        editor.setTool("select");
        if (editor.pendingImage) {
          editor.setPendingImage(null);
        }
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("mouseleave", handlePointerLeave);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActive, editor]);

  if (!isActive || !isVisible || !coords) return null;

  let label = "Text";
  let IconComponent: any = Type;

  if (isAddText) {
    const config = PRESET_CONFIG[editor.textPreset] ?? PRESET_CONFIG.text;
    label = config.label;
    IconComponent = config.icon;
  } else if (isPendingImage) {
    label = "Image";
    IconComponent = ImageIcon;
  } else if (isNote) {
    label = "Note";
    IconComponent = StickyNote;
  }

  // Prevent follower from clipping off right or bottom edges
  const offsetX = coords.x + 190 > window.innerWidth ? -170 : 16;
  const offsetY = coords.y + 60 > window.innerHeight ? -45 : 18;

  return (
    <div
      className="fixed pointer-events-none z-[99999] select-none will-change-transform flex items-center gap-2 px-3 py-1.5 rounded-full shadow-2xl border transition-opacity duration-150 animate-in fade-in zoom-in-95 bg-neutral-900/90 text-white dark:bg-neutral-100 dark:text-neutral-900 border-white/20 dark:border-black/20 backdrop-blur-md"
      style={{
        left: coords.x + offsetX,
        top: coords.y + offsetY,
      }}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/20 text-brand">
        <IconComponent className="h-3 w-3 stroke-[2.5]" />
      </span>
      <span className="text-xs font-semibold whitespace-nowrap">
        Click to place {label}
      </span>
      <span className="text-[10px] font-medium opacity-65 bg-white/15 dark:bg-black/10 px-1.5 py-0.5 rounded ml-0.5">
        Esc
      </span>
    </div>
  );
}
