"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ProductCard } from "@/components/produk/product-card";
import type { Product } from "@/lib/types";

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalProducts: number;
  onPageChange: (page: number) => void;
  onDelete: (product: Product) => void;
}

/** Grid katalog produk (kartu), dengan skeleton loading, empty state, dan paginasi. */
export function ProductGrid({
  products,
  loading,
  page,
  totalPages,
  totalProducts,
  onPageChange,
  onDelete,
}: ProductGridProps) {
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  function handleEdit(product: Product) {
    router.push(`/dashboard/produk/tambah?id=${product.id}`);
  }

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    // Simulasi proses penghapusan (data dummy, belum terhubung backend/database).
    window.setTimeout(() => {
      onDelete(pendingDelete);
      setDeleting(false);
      setPendingDelete(null);
    }, 500);
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl bg-neutral-100" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-card">
        <EmptyState message="Tidak ada produk yang sesuai dengan pencarian/filter." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={handleEdit}
            onDelete={(p) => setPendingDelete(p)}
          />
        ))}
      </div>

      {totalProducts > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-card sm:flex-row">
          <p className="text-xs text-neutral-500">
            Menampilkan halaman {page} dari {totalPages} ({totalProducts} produk)
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label="Halaman sebelumnya"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium",
                  p === page
                    ? "bg-primary-700 text-white"
                    : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                )}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              aria-label="Halaman berikutnya"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Hapus produk?"
        description={
          pendingDelete
            ? `Produk "${pendingDelete.name}" akan dihapus dari katalog dan tidak dapat dikembalikan.`
            : undefined
        }
        confirmLabel="Ya, Hapus"
        tone="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />
    </div>
  );
}
