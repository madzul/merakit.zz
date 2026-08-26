import { PRODUCT_CATEGORIES } from "@/lib/types";

/** Ambang batas stok rendah — di bawah/pas nilai ini, produk dianggap stok menipis. */
export const LOW_STOCK_THRESHOLD = 5;

/** Cek apakah stok suatu produk tergolong rendah (tapi belum habis). */
export function isLowStock(stock: number): boolean {
  return stock > 0 && stock <= LOW_STOCK_THRESHOLD;
}

/** Cek apakah stok suatu produk habis. */
export function isOutOfStock(stock: number): boolean {
  return stock <= 0;
}

export const PRODUCT_ACTIVE_LABELS: Record<"aktif" | "nonaktif", string> = {
  aktif: "Aktif",
  nonaktif: "Nonaktif",
};

export const PRODUCT_ACTIVE_BADGE_STYLES: Record<"aktif" | "nonaktif", string> = {
  aktif: "bg-success-50 text-success-600",
  nonaktif: "bg-neutral-200 text-neutral-600",
};

/** Terjemahkan boolean `isActive` menjadi kunci label/style di atas. */
export function activeKey(isActive: boolean): "aktif" | "nonaktif" {
  return isActive ? "aktif" : "nonaktif";
}

export const PRODUCT_CATEGORY_OPTIONS: { value: string; label: string }[] = PRODUCT_CATEGORIES.map(
  (category) => ({ value: category, label: category })
);

export const PRODUCT_CATEGORY_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "semua", label: "Semua Kategori" },
  ...PRODUCT_CATEGORY_OPTIONS,
];

/**
 * Pilihan gambar placeholder lokal (disimpan di /public/products), dipakai
 * pada form tambah/edit produk. Bukan URL eksternal/upload sungguhan — cukup
 * untuk kebutuhan data dummy tahap 6.
 */
export const PRODUCT_IMAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "/products/placeholder-syal.svg", label: "Placeholder — Syal" },
  { value: "/products/placeholder-tas.svg", label: "Placeholder — Tas" },
  { value: "/products/placeholder-topi.svg", label: "Placeholder — Topi" },
  { value: "/products/placeholder-dekorasi.svg", label: "Placeholder — Dekorasi Rumah" },
  { value: "/products/placeholder-aksesoris.svg", label: "Placeholder — Aksesoris" },
];
