import type { Material, MaterialMovementType, MaterialStockLevel, ProductMaterial } from "@/lib/types";

export const MATERIAL_UNITS = ["gulung", "gram", "kg", "meter", "pcs", "lembar", "set"] as const;

export const MOVEMENT_TYPE_LABELS: Record<MaterialMovementType, string> = {
  masuk: "Masuk (pembelian/terima)",
  keluar: "Keluar (pemakaian manual)",
  penyesuaian: "Penyesuaian (stok opname)",
};

export const MOVEMENT_TYPE_SHORT: Record<MaterialMovementType, string> = {
  masuk: "Masuk",
  keluar: "Keluar",
  penyesuaian: "Penyesuaian",
};

/** Status stok: habis (≤ 0), menipis (≤ stok minimum), aman. */
export function stockLevel(material: Pick<Material, "stock" | "minStock">): MaterialStockLevel {
  if (material.stock <= 0) return "habis";
  if (material.stock <= material.minStock) return "menipis";
  return "aman";
}

export const STOCK_LEVEL_LABELS: Record<MaterialStockLevel, string> = {
  aman: "Stok aman",
  menipis: "Stok menipis",
  habis: "Stok habis",
};

export const STOCK_LEVEL_BADGE: Record<MaterialStockLevel, string> = {
  aman: "bg-success-50 text-success-600",
  menipis: "bg-warning-50 text-warning-600",
  habis: "bg-danger-50 text-danger-600",
};

/** Angka stok ringkas ala Indonesia (maks. 2 desimal), mis. 12,5. */
export function formatQuantity(value: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value);
}

/** HPP bahan untuk 1 pcs = Σ (kebutuhan × harga satuan terakhir). */
export function materialCostPerUnit(recipe: Pick<ProductMaterial, "quantityPerUnit" | "unitCost">[]): number {
  return recipe.reduce((sum, row) => sum + row.quantityPerUnit * row.unitCost, 0);
}
