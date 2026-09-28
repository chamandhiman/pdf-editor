import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-extrabold tracking-tight text-white shadow-md",
        className,
      )}
      style={{
        background: "linear-gradient(135deg, #ff6b6b 0%, #e5383b 60%, #c0222a 100%)",
        boxShadow: "0 2px 8px rgba(229,56,59,0.35)",
      }}
      aria-hidden
    >
      PDF
    </span>
  );
}
