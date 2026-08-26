import type { ProductionStatus } from "@/lib/types";

export const PRODUCTION_STATUS_LABELS: Record<ProductionStatus, string> = {
  diajukan: "Diajukan",
  diproses: "Diproses",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

export const PRODUCTION_STATUS_BADGE_STYLES: Record<ProductionStatus, string> = {
  diajukan: "bg-info-50 text-info-600",
  diproses: "bg-warning-50 text-warning-600",
  selesai: "bg-success-50 text-success-600",
  dibatalkan: "bg-danger-50 text-danger-600",
};

export const PRODUCTION_STATUS_OPTIONS: { value: ProductionStatus; label: string }[] = (
  Object.keys(PRODUCTION_STATUS_LABELS) as ProductionStatus[]
).map((value) => ({ value, label: PRODUCTION_STATUS_LABELS[value] }));

export type ProductionPeriod = "semua" | "7hari" | "30hari" | "bulan-ini" | "bulan-lalu";

export const PRODUCTION_PERIOD_OPTIONS: { value: ProductionPeriod; label: string }[] = [
  { value: "semua", label: "Semua Periode" },
  { value: "7hari", label: "7 Hari Terakhir" },
  { value: "30hari", label: "30 Hari Terakhir" },
  { value: "bulan-ini", label: "Bulan Ini" },
  { value: "bulan-lalu", label: "Bulan Lalu" },
];

/** Cek apakah sebuah tanggal ISO ("YYYY-MM-DD") termasuk dalam periode yang dipilih. */
export function isWithinPeriod(isoDate: string, period: ProductionPeriod, referenceDate: Date): boolean {
  if (period === "semua") return true;

  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;

  if (period === "7hari" || period === "30hari") {
    const days = period === "7hari" ? 7 : 30;
    const from = new Date(referenceDate);
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - days);
    return date >= from && date <= referenceDate;
  }

  if (period === "bulan-ini") {
    return date.getFullYear() === referenceDate.getFullYear() && date.getMonth() === referenceDate.getMonth();
  }

  // bulan-lalu
  const lastMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);
  return date.getFullYear() === lastMonth.getFullYear() && date.getMonth() === lastMonth.getMonth();
}
