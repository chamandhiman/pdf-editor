import { Copy, MoreVertical, RotateCcw, RotateCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { PDFPage } from "@/types/pdf";

export function ThumbnailItem({
  page,
  active,
  onSelect,
  onRotate,
  onDuplicate,
  onDelete,
}: {
  page: PDFPage;
  active: boolean;
  onSelect: () => void;
  onRotate: (delta: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onSelect}
        aria-current={active}
        className={cn(
          "block w-full rounded-md border bg-page p-0 text-left shadow-panel transition-all",
          "border-border hover:border-brand/50 hover:shadow-md",
          active && "border-brand ring-2 ring-brand/25",
        )}
      >
        <div className="aspect-[1/1.414] w-full overflow-hidden rounded-[5px] p-3">
          <MiniPage index={page.template} />
        </div>
      </button>

      <div className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              aria-label={`Page ${page.index + 1} options`}
              className="h-6 w-6 border border-border bg-background/95 shadow-sm"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={() => onRotate(90)}>
              <RotateCw className="mr-2 h-4 w-4" /> Rotate Clockwise
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onRotate(-90)}>
              <RotateCcw className="mr-2 h-4 w-4" /> Rotate Counter-clockwise
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onDuplicate}>
              <Copy className="mr-2 h-4 w-4" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p
        className={cn(
          "mt-1.5 text-center text-[11px] tabular-nums text-muted-foreground",
          active && "font-medium text-foreground",
        )}
      >
        {page.index + 1}
      </p>
    </div>
  );
}

function MiniPage({ index }: { index: number }) {
  const bar = "rounded-[1px] bg-muted-foreground/25";
  return (
    <div className="flex h-full w-full flex-col gap-[3px]">
      {index === 0 && <div className="mx-auto mb-1 h-1.5 w-3/5 rounded-[1px] bg-foreground/60" />}
      {index !== 0 && <div className={cn(bar, "mb-1 h-1 w-2/5 bg-foreground/45")} />}
      {Array.from({ length: index === 3 ? 6 : 11 }).map((_, i) => (
        <div key={i} className={cn(bar, "h-[3px]")} style={{ width: `${72 + ((i * 13) % 26)}%` }} />
      ))}
      {index === 1 && (
        <div className="mt-1.5 grid grid-cols-3 gap-[2px]">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-[5px] rounded-[1px] bg-muted-foreground/20" />
          ))}
        </div>
      )}
      {index === 3 && (
        <div className="mt-auto flex gap-2">
          <div className="flex-1 space-y-1">
            <div className="h-[6px] w-full rounded-[1px] bg-muted-foreground/15" />
            <div className="h-[2px] w-full bg-muted-foreground/40" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="h-[6px] w-full rounded-[1px] bg-muted-foreground/15" />
            <div className="h-[2px] w-full bg-muted-foreground/40" />
          </div>
        </div>
      )}
    </div>
  );
}
