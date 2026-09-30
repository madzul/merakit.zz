import { Suspense } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
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
        actions={
          <Link
            href="/katalog"
            target="_blank"
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Lihat Katalog Publik
          </Link>
        }
      />
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-neutral-100" />}>
        <ProductPageClient products={products} loadError={loadError} canManage={isAdmin} />
      </Suspense>
    </div>
  );
}
