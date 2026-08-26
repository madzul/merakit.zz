import { AlertTriangle, CheckCircle2, PackageX, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import type { MaterialStockItem, MaterialStockStatus } from "@/lib/types";

const STATUS_STYLES: Record<MaterialStockStatus, { badge: string; icon: LucideIcon; label: string }> = {
  aman: { badge: "bg-success-50 text-success-600", icon: CheckCircle2, label: "Stok aman" },
  menipis: { badge: "bg-warning-50 text-warning-600", icon: AlertTriangle, label: "Stok menipis" },
  habis: { badge: "bg-danger-50 text-danger-600", icon: PackageX, label: "Stok habis" },
};

interface MaterialStockCardProps {
  items: MaterialStockItem[];
}

export function MaterialStockCard({ items }: MaterialStockCardProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
      <h2 className="text-sm font-semibold text-neutral-800">Ringkasan Stok Bahan Baku</h2>
      <p className="mt-1 text-xs text-neutral-500">Ketersediaan bahan baku rajut saat ini.</p>

      {items.length === 0 ? (
        <EmptyState className="mt-4" message="Belum ada data stok bahan baku." />
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => {
            const style = STATUS_STYLES[item.status];
            const Icon = style.icon;
            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-neutral-100 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-800">{item.name}</p>
                  <p className="text-xs text-neutral-500">
                    {item.quantity} {item.unit}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                    style.badge
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {style.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
