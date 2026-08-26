"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/produk/product-form";
import { getProductById } from "@/lib/product-store";

function TambahProdukContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const existingProduct = editId ? getProductById(editId) : undefined;
  const isEditMode = Boolean(editId);

  return (
    <div>
      <PageHeader
        title={isEditMode ? "Edit Produk" : "Tambah Produk"}
        description={
          isEditMode
            ? "Perbarui informasi produk pada katalog MERAKIT."
            : "Tambahkan produk baru ke katalog MERAKIT."
        }
      />
      <ProductForm product={existingProduct} />
    </div>
  );
}

export default function TambahProdukPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-neutral-100" />}>
      <TambahProdukContent />
    </Suspense>
  );
}
