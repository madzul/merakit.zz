import { ArrowDownRight, ArrowUpRight, History, SlidersHorizontal } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { ProductStockMovement } from "@/lib/types";

interface ProductStockHistoryProps {
  movements: ProductStockMovement[];
}

const SOURCE_LABELS: Record<ProductStockMovement["source"], string> = {
  produksi: "Produksi selesai",
  pesanan: "Pesanan selesai",
  manual: "Penyesuaian",
};

function signedQuantity(movement: ProductStockMovement): number {
  return movement.type === "keluar" ? -movement.quantity : movement.quantity;
}

/**
 * Riwayat stok produk jadi. Stok dihitung otomatis dari riwayat ini:
 * produksi selesai menambah, pesanan selesai mengurangi, dan hitung fisik
 * dicatat sebagai penyesuaian.
 */
export function ProductStockHistory({ movements }: ProductStockHistoryProps) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-start gap-3">
        <History className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-700" aria-hidden="true" />
        <div>
          <h2 className="text-base font-semibold text-neutral-800">Riwayat Stok</h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            Stok bertambah otomatis saat produksi berstatus Selesai dan berkurang saat pesanan berstatus Selesai.
          </p>
        </div>
      </div>

      {movements.length === 0 ? (
        <p className="mt-4 rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-500">Belum ada pergerakan stok.</p>
      ) : (
        <ul className="mt-4 divide-y divide-neutral-100">
          {movements.map((movement) => {
            const quantity = signedQuantity(movement);
            const Icon = movement.source === "manual" ? SlidersHorizontal : quantity > 0 ? ArrowUpRight : ArrowDownRight;
            return (
              <li key={movement.id} className="flex items-center gap-3 py-3">
                <span
                  className={cn(
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                    movement.source === "manual"
                      ? "bg-neutral-100 text-neutral-600"
                      : quantity > 0
                        ? "bg-success-50 text-success-600"
                        : "bg-danger-50 text-danger-600"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-800">
                    {movement.reference || SOURCE_LABELS[movement.source]}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {formatDate(movement.date)}
                    {movement.source === "manual" && movement.notes ? ` · ${movement.notes}` : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "flex-shrink-0 text-sm font-semibold tabular-nums",
                    quantity > 0 ? "text-success-600" : "text-danger-600"
                  )}
                >
                  {quantity > 0 ? "+" : "−"}
                  {Math.abs(quantity)} pcs
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
