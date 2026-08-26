import type { LucideIcon } from "lucide-react";
import { Hammer } from "lucide-react";

interface ComingSoonProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
}

export function ComingSoon({
  title = "Modul sedang dikembangkan",
  description = "Fitur untuk halaman ini akan segera hadir pada pembaruan berikutnya.",
  icon: Icon = Hammer,
}: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center shadow-card">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-neutral-800">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-neutral-500">{description}</p>
    </div>
  );
}
