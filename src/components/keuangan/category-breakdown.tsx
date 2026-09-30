import { EmptyState } from "@/components/empty-state";
import { cn, formatRupiah } from "@/lib/utils";
import type { CategoryTotal } from "@/lib/keuangan/report";

interface CategoryBreakdownProps {
  title: string;
  items: CategoryTotal[];
  total: number;
  tone: "income" | "expense";
}

/** Rincian per kategori dengan batang proporsi sederhana (tanpa library grafik, aman untuk cetak). */
export function CategoryBreakdown({ title, items, total, tone }: CategoryBreakdownProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card print:break-inside-avoid print:shadow-none">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-neutral-800">{title}</h2>
        <p className="text-sm font-semibold text-neutral-800">{formatRupiah(total)}</p>
      </div>

      {items.length === 0 ? (
        <EmptyState className="mt-4" message="Belum ada transaksi pada bulan ini." />
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => {
            const percent = total > 0 ? Math.round((item.total / total) * 100) : 0;
            return (
              <li key={item.category}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-neutral-700">
                    {item.category}
                    <span className="ml-1.5 text-xs text-neutral-400">({item.count}×)</span>
                  </span>
                  <span className="flex-shrink-0 font-medium text-neutral-800">
                    {formatRupiah(item.total)}
                    <span className="ml-1.5 text-xs font-normal text-neutral-400">{percent}%</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100" aria-hidden="true">
                  <div
                    className={cn("h-full rounded-full", tone === "income" ? "bg-success-500" : "bg-danger-500")}
                    style={{ width: `${Math.max(percent, 2)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
