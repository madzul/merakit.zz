"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { createProduct, deleteProduct, updateProduct } from "@/lib/supabase/repositories/products-repository";
import { isNonEmptyString, isNonNegativeNumber, type ActionResult } from "@/lib/action-utils";
import type { Product } from "@/lib/types";

export type ProductInput = Omit<Product, "id" | "createdAt">;

async function requireAdmin(): Promise<string | null> {
  const profile = await getCurrentProfile();
  if (!profile) return "Sesi tidak valid. Silakan login kembali.";
  if (profile.role !== "admin") return "Hanya admin yang dapat mengelola katalog produk.";
  return null;
}

function validate(input: ProductInput): string | null {
  if (!isNonEmptyString(input.name)) return "Nama produk wajib diisi.";
  if (!isNonEmptyString(input.category)) return "Kategori wajib dipilih.";
  if (!isNonNegativeNumber(input.price)) return "Harga tidak valid.";
  if (!isNonNegativeNumber(input.stock) || !Number.isInteger(input.stock)) return "Stok harus bilangan bulat ≥ 0.";
  return null;
}

function normalize(input: ProductInput): ProductInput {
  return {
    ...input,
    name: input.name.trim(),
    category: input.category.trim(),
    description: input.description.trim(),
  };
}

function revalidateProducts(id?: string) {
  revalidatePath("/dashboard/produk");
  revalidatePath("/dashboard/pesanan/tambah");
  revalidatePath("/produksi/tambah");
  if (id) revalidatePath(`/dashboard/produk/${id}`);
}

export async function createProductAction(input: ProductInput): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  const validationError = validate(input);
  if (validationError) return { error: validationError };

  try {
    await createProduct(normalize(input));
  } catch {
    return { error: "Gagal menyimpan produk. Silakan coba lagi." };
  }

  revalidateProducts();
  return { success: true };
}

export async function updateProductAction(id: string, input: ProductInput): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  const validationError = validate(input);
  if (validationError) return { error: validationError };

  try {
    await updateProduct(id, normalize(input));
  } catch {
    return { error: "Gagal memperbarui produk. Mungkin produk sudah dihapus." };
  }

  revalidateProducts(id);
  return { success: true };
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  try {
    await deleteProduct(id);
  } catch {
    return { error: "Gagal menghapus produk. Silakan coba lagi." };
  }

  revalidateProducts(id);
  return { success: true };
}
