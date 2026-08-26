"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ProductDetail } from "@/components/produk/product-detail";
import { getProductById } from "@/lib/product-store";

export default function ProdukDetailPage() {
  const params = useParams<{ id: string }>();
  const product = getProductById(params.id);

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
        <ProductDetail product={product} />
      ) : (
        <EmptyState message="Data produk tidak ditemukan. Mungkin sudah dihapus atau tautan tidak valid." />
      )}
    </div>
  );
}
