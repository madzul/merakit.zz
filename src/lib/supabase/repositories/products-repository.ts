import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
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

/** Hanya admin — ditegakkan RLS. */
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

export async function updateProduct(id: string, input: Omit<Product, "id" | "createdAt">): Promise<Product> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({
      name: input.name,
      category: input.category,
      description: input.description,
      price: input.price,
      stock: input.stock,
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
