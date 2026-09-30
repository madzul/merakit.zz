import { Sparkles } from "lucide-react";

/** Label "Sobat Istimewa" — hanya dirender bila anggota sudah menyetujuinya (showInclusiveBadge). */
export function InclusiveBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-secondary-100 px-2.5 py-1 text-xs font-medium text-secondary-700 ${className}`}
    >
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      Sobat Istimewa
    </span>
  );
}
