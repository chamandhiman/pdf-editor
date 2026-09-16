import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand text-[11px] font-bold tracking-tight text-brand-foreground",
        className,
      )}
      aria-hidden
    >
      PS
    </span>
  );
}
