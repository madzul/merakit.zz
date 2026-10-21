import { Check } from "lucide-react";
import { SALE_STATUS_FLOW, SALE_STATUS_LABELS } from "@/lib/penjualan/constants";
import { cn } from "@/lib/utils";
import type { DeliveryMethod, OnlineSaleStatus } from "@/lib/types";

/** Linimasa status penjualan online (Baru → Diproses → Dikirim → Selesai). */
export function SaleProgress({ status, deliveryMethod }: { status: OnlineSaleStatus; deliveryMethod: DeliveryMethod }) {
  if (status === "Dibatalkan") {
    return <p className="rounded-lg bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">Pesanan ini dibatalkan.</p>;
  }
  const current = SALE_STATUS_FLOW.indexOf(status);
  return (
    <ol className="grid grid-cols-4 gap-2">
      {SALE_STATUS_FLOW.map((step, index) => {
        const done = index <= current;
        const label = step === "Dikirim" ? (deliveryMethod === "ambil" ? "Siap Diambil" : "Dikirim") : SALE_STATUS_LABELS[step];
        return (
          <li key={step} className="flex flex-col items-center gap-1.5 text-center">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold",
                done ? "border-primary-700 bg-primary-700 text-white" : "border-neutral-200 bg-white text-neutral-400"
              )}
              aria-hidden="true"
            >
              {done ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span className={cn("text-[11px] leading-tight sm:text-xs", done ? "font-medium text-neutral-800" : "text-neutral-400")}>
              {label}
              {index === current && <span className="sr-only"> (status saat ini)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
