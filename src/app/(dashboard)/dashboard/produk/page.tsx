import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { ProductPageClient } from "@/components/produk/product-page-client";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { getProducts } from "@/lib/supabase/repositories/products-repository";
import type { Product } from "@/lib/types";

/** Katalog produk — tabel `products` (Supabase). Kelola (tambah/edit/hapus) khusus admin. */
export default async function ProdukPage() {
  let products: Product[] = [];
  let loadError = false;
  const [profileResult, productsResult] = await Promise.allSettled([getCurrentProfile(), getProducts()]);
  if (productsResult.status === "fulfilled") {
    products = productsResult.value;
  } else {
    loadError = true;
  }
  const isAdmin = profileResult.status === "fulfilled" && profileResult.value?.role === "admin";

  return (
    <div>
      <PageHeader
        title="Katalog Produk"
        description="Kelola katalog produk rajut, harga, stok, dan status aktif."
      />
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-neutral-100" />}>
        <ProductPageClient products={products} loadError={loadError} canManage={isAdmin} />
      </Suspense>
    </div>
  );
}
