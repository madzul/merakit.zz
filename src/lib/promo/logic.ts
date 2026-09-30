import type { Promo, PromoStatus } from "@/lib/types";

/** Pilihan asal pesanan — dipakai form pesanan & analisis pemasaran. */
export const ORDER_SOURCES = [
  "Langsung",
  "WhatsApp",
  "Katalog Online",
  "Instagram",
  "Bazar/Pameran",
  "Kunjungan Wisata",
  "Reseller",
  "Lainnya",
] as const;

export const PROMO_STATUS_LABELS: Record<PromoStatus, string> = {
  aktif: "Aktif",
  nonaktif: "Nonaktif",
  kedaluwarsa: "Kedaluwarsa",
};

export const PROMO_STATUS_BADGE: Record<PromoStatus, string> = {
  aktif: "bg-success-50 text-success-600",
  nonaktif: "bg-neutral-100 text-neutral-600",
  kedaluwarsa: "bg-warning-50 text-warning-600",
};

/**
 * Status efektif pada tanggal tertentu: promo "aktif" yang tanggal
 * berlakunya sudah lewat dianggap "kedaluwarsa" tanpa perlu diubah manual.
 */
export function effectivePromoStatus(promo: Pick<Promo, "status" | "validUntil">, onDate: string): PromoStatus {
  if (promo.status !== "aktif") return promo.status;
  if (promo.validUntil && promo.validUntil < onDate) return "kedaluwarsa";
  return "aktif";
}

/** Potongan (Rp, dibulatkan) untuk subtotal tertentu — tidak pernah melebihi subtotal. */
export function computeDiscount(promo: Pick<Promo, "discountType" | "discountValue">, subtotal: number): number {
  if (subtotal <= 0) return 0;
  const raw = promo.discountType === "persen" ? (subtotal * promo.discountValue) / 100 : promo.discountValue;
  return Math.round(Math.min(Math.max(raw, 0), subtotal));
}

export function formatPromoValue(promo: Pick<Promo, "discountType" | "discountValue">): string {
  return promo.discountType === "persen"
    ? `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(promo.discountValue)}%`
    : `Rp${new Intl.NumberFormat("id-ID").format(promo.discountValue)}`;
}

/** Normalisasi kode promo: huruf besar, tanpa spasi. */
export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function todayInJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}
