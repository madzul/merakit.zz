import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ProductDetail } from "@/components/produk/product-detail";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { getProductById } from "@/lib/supabase/repositories/products-repository";
import { getMaterials, getProductRecipe } from "@/lib/supabase/repositories/materials-repository";
import { ProductRecipe } from "@/components/produk/product-recipe";

interface ProdukDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProdukDetailPage({ params }: ProdukDetailPageProps) {
  const { id } = await params;
  const [product, profile, recipe] = await Promise.all([
    getProductById(id).catch(() => null),
    getCurrentProfile(),
    getProductRecipe(id).catch(() => []),
  ]);
  const isAdmin = profile?.role === "admin";
  const materials = isAdmin ? await getMaterials().catch(() => []) : null;

  return (
    <div>
      <PageHeader
        title={product ? product.name : "Produk Tidak Ditemukan"}
        description="Detail informasi, harga, dan stok produk."
        actions={
          <Link
            href="/dashboard/produk"
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Kembali
          </Link>
        }
      />

      {product ? (
        <div className="space-y-4">
          <ProductDetail product={product} canManage={isAdmin} />
          <ProductRecipe key={recipe.map((row) => `${row.materialId}:${row.quantityPerUnit}`).join("|")} productId={product.id} price={product.price} recipe={recipe} materials={materials} />
        </div>
      ) : (
        <EmptyState message="Data produk tidak ditemukan. Mungkin sudah dihapus atau tautan tidak valid." />
      )}
    </div>
  );
}
