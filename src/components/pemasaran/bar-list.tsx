import { EmptyState } from "@/components/empty-state";

export interface BarListItem {
  key: string;
  label: string;
  value: number;
  /** Teks nilai di kanan, mis. "12 pcs". */
  valueLabel: string;
  detail?: string;
}

interface BarListProps {
  title: string;
  description?: string;
  items: BarListItem[];
  emptyMessage: string;
  limit?: number;
}

/** Daftar dengan batang proporsi sederhana (tanpa library grafik). */
export function BarList({ title, description, items, emptyMessage, limit = 8 }: BarListProps) {
  const shown = items.slice(0, limit);
  const max = Math.max(...shown.map((item) => item.value), 0);
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
      <h2 className="text-sm font-semibold text-neutral-800">{title}</h2>
      {description && <p className="mt-1 text-xs text-neutral-500">{description}</p>}
      {shown.length === 0 ? (
        <EmptyState className="mt-4" message={emptyMessage} />
      ) : (
        <ul className="mt-4 space-y-3">
          {shown.map((item) => (
            <li key={item.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-neutral-700">
                  {item.label}
                  {item.detail && <span className="ml-1.5 text-xs text-neutral-400">{item.detail}</span>}
                </span>
                <span className="flex-shrink-0 font-medium text-neutral-800">{item.valueLabel}</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100" aria-hidden="true">
                <div className="h-full rounded-full bg-primary-500" style={{ width: `${max > 0 ? Math.max((item.value / max) * 100, 2) : 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
