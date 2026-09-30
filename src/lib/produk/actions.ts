"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { createProduct, deleteProduct, getProductById, updateProduct } from "@/lib/supabase/repositories/products-repository";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_IMAGE_BUCKET, isAllowedProductImage, storagePathFromUrl } from "@/lib/produk/images";
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
  if (typeof input.imageUrl !== "string" || !isAllowedProductImage(input.imageUrl)) return "Foto produk tidak valid.";
  return null;
}

/** Hapus foto lama di Storage (best-effort) bila sudah tidak dipakai produk. */
async function removeStoredImage(url: string | undefined): Promise<void> {
  const path = url ? storagePathFromUrl(url) : null;
  if (!path) return;
  try {
    const supabase = await createClient();
    await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);
  } catch {
    // Diabaikan: foto yatim tidak mengganggu fungsi aplikasi.
  }
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
  revalidatePath("/katalog", "layout");
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

  const previous = await getProductById(id).catch(() => null);
  try {
    await updateProduct(id, normalize(input));
  } catch {
    return { error: "Gagal memperbarui produk. Mungkin produk sudah dihapus." };
  }
  if (previous && previous.imageUrl !== input.imageUrl) await removeStoredImage(previous.imageUrl);

  revalidateProducts(id);
  return { success: true };
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const previous = await getProductById(id).catch(() => null);
  try {
    await deleteProduct(id);
    await removeStoredImage(previous?.imageUrl);
  } catch {
    return { error: "Gagal menghapus produk. Silakan coba lagi." };
  }

  revalidateProducts(id);
  return { success: true };
}
