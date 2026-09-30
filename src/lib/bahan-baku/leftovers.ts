import type { LeftoverStatus, MaterialLeftover } from "@/lib/types";

export const LEFTOVER_STATUS_LABELS: Record<LeftoverStatus, string> = {
  disimpan: "Disimpan",
  dimanfaatkan: "Dimanfaatkan ulang",
  dibuang: "Dibuang",
};

export const LEFTOVER_STATUS_BADGE: Record<LeftoverStatus, string> = {
  disimpan: "bg-info-50 text-info-600",
  dimanfaatkan: "bg-success-50 text-success-600",
  dibuang: "bg-neutral-100 text-neutral-600",
};

export const LEFTOVER_UNITS = ["gram", "kg", "meter", "gulung", "potong"] as const;

export interface LeftoverSummaryRow {
  unit: string;
  total: number;
  disimpan: number;
  dimanfaatkan: number;
  dibuang: number;
  /** Proporsi sisa yang dimanfaatkan ulang (SDG 12), 1 desimal. */
  reusePercent: number;
}

/**
 * Ringkasan per satuan (angka dengan satuan berbeda tidak dijumlahkan).
 * Urut dari total terbesar.
 */
export function summarizeLeftovers(leftovers: MaterialLeftover[]): LeftoverSummaryRow[] {
  const byUnit = new Map<string, LeftoverSummaryRow>();
  for (const leftover of leftovers) {
    const row = byUnit.get(leftover.unit) ?? { unit: leftover.unit, total: 0, disimpan: 0, dimanfaatkan: 0, dibuang: 0, reusePercent: 0 };
    row.total += leftover.quantity;
    row[leftover.status] += leftover.quantity;
    byUnit.set(leftover.unit, row);
  }
  return Array.from(byUnit.values())
    .map((row) => ({ ...row, reusePercent: row.total > 0 ? Math.round((row.dimanfaatkan / row.total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.total - a.total);
}
