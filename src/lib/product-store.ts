import { PRODUCT_CATALOG } from "@/lib/mock-data";
import type { Product } from "@/lib/types";

/**
 * Store data dummy in-memory untuk modul Katalog Produk (tahap 6).
 *
 * Catatan: ini BUKAN state management global/backend sungguhan — hanya array
 * bertingkat modul (module-level) yang menyalin `PRODUCT_CATALOG` sebagai
 * seed awal, agar tambah/ubah/hapus data terasa nyata selama satu sesi
 * pengguna tanpa perlu Supabase atau API eksternal. Data akan kembali ke seed
 * awal setiap kali aplikasi di-reload penuh.
 */
let products: Product[] = [...PRODUCT_CATALOG];
let nextId = products.length + 1;

export function getProducts(): Product[] {
  return products;
}

export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}

export function addProduct(input: Omit<Product, "id">): Product {
  const newProduct: Product = { ...input, id: `ktp-${nextId++}` };
  products = [newProduct, ...products];
  return newProduct;
}

export function updateProduct(id: string, input: Omit<Product, "id">): Product | undefined {
  let updated: Product | undefined;
  products = products.map((product) => {
    if (product.id !== id) return product;
    updated = { ...input, id };
    return updated;
  });
  return updated;
}

export function deleteProduct(id: string): void {
  products = products.filter((product) => product.id !== id);
}
