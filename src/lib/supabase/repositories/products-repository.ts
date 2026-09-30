import { createClient } from "@/lib/supabase/server";
import type { Product, ProductStockMovement } from "@/lib/types";
import type { Tables } from "@/lib/supabase/database.types";

function mapProduct(row: Tables<"products">): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description ?? "",
    price: Number(row.price),
    stock: row.stock,
    imageUrl: row.image_url ?? "",
    isActive: row.is_active,
    createdAt: row.created_at.slice(0, 10),
  };
}

/** Dipakai halaman publik — RLS membatasi hasil hanya produk aktif untuk peran anon. */
export async function getActiveProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

/** Dipakai dashboard (admin & anggota) — melihat seluruh produk termasuk nonaktif. */
export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data) : null;
}

/**
 * Hanya admin — ditegakkan RLS. `stock` di sini adalah stok awal: trigger
 * database mencatatnya sebagai "penyesuaian" di riwayat stok.
 */
export async function createProduct(input: Omit<Product, "id" | "createdAt">): Promise<Product> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: input.name,
      category: input.category,
      description: input.description,
      price: input.price,
      stock: input.stock,
      image_url: input.imageUrl,
      is_active: input.isActive,
    })
    .select()
    .single();
  if (error) throw error;
  return mapProduct(data);
}

export async function updateProduct(id: string, input: Omit<Product, "id" | "createdAt" | "stock">): Promise<Product> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({
      name: input.name,
      category: input.category,
      description: input.description,
      price: input.price,
      // `stock` sengaja tidak ditulis: stok dihitung otomatis dari riwayat
      // (produksi selesai, pesanan selesai, penyesuaian). Ubah lewat setProductStock.
      image_url: input.imageUrl,
      is_active: input.isActive,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapProduct(data);
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Hitung fisik (stok opname): menyamakan stok sistem dengan `targetStock`.
 * Selisihnya dicatat sebagai "penyesuaian". Hanya admin (dicek di fungsi
 * database set_product_stock + RLS).
 */
export async function setProductStock(id: string, targetStock: number, note?: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_product_stock", {
    target_product_id: id,
    target_stock: targetStock,
    note: note ?? null,
  });
  if (error) throw error;
}

type StockMovementRow = Tables<"product_stock_movements"> & {
  production_records: { members: { name: string } | null } | null;
  orders: { customer_name: string } | null;
};

/** Riwayat stok terbaru sebuah produk (maks. `limit` baris). */
export async function getProductStockMovements(productId: string, limit = 20): Promise<ProductStockMovement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_stock_movements")
    .select("*, production_records(members(name)), orders(customer_name)")
    .eq("product_id", productId)
    .order("movement_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as unknown as StockMovementRow[]).map((row) => ({
    id: row.id,
    type: row.type,
    quantity: row.quantity,
    date: row.movement_date,
    source: row.production_record_id ? "produksi" : row.order_id ? "pesanan" : "manual",
    reference: row.production_record_id
      ? `Produksi ${row.production_records?.members?.name ?? ""}`.trim()
      : row.order_id
        ? `Pesanan ${row.orders?.customer_name ?? ""}`.trim()
        : "",
    notes: row.notes ?? "",
  }));
}
