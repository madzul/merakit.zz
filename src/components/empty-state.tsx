import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  message: string;
  className?: string;
}

/**
 * Empty state ringkas untuk seksi/daftar kecil di dalam kartu (mis. dashboard).
 * Untuk placeholder halaman penuh, gunakan `ComingSoon`.
 */
export function EmptyState({ message, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 px-4 py-8 text-center",
        className
      )}
    >
      <Inbox className="h-5 w-5 text-neutral-300" aria-hidden="true" />
      <p className="text-sm text-neutral-500">{message}</p>
    </div>
  );
}
