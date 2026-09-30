"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorState } from "@/components/error-state";
import { ProductFilters } from "@/components/produk/product-filters";
import { ProductGrid } from "@/components/produk/product-grid";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { deleteProductAction } from "@/lib/produk/actions";
import type { Product } from "@/lib/types";

const PAGE_SIZE = 8;

interface ProductPageClientProps {
  products: Product[];
  loadError: boolean;
  canManage: boolean;
}

/** Bagian interaktif Katalog Produk (filter, paginasi, hapus). Data dimuat di server. */
export function ProductPageClient({ products, loadError, canManage }: ProductPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast, showToast, dismissToast } = useToast();

  const [category, setCategory] = useState<string>("semua");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Toast setelah redirect dari form tambah/edit.
  useEffect(() => {
    const toastParam = searchParams.get("toast");
    if (toastParam === "created") {
      showToast("Produk baru berhasil ditambahkan.", "success");
    } else if (toastParam === "updated") {
      showToast("Data produk berhasil diperbarui.", "success");
    }
    if (toastParam) {
      router.replace("/dashboard/produk");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      if (category !== "semua" && product.category !== category) return false;
      if (query && !product.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [products, category, search]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedProducts = filteredProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasActiveFilters = category !== "semua" || search.trim() !== "";

  function handleFilterChange<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function handleResetFilters() {
    setCategory("semua");
    setSearch("");
    setPage(1);
  }

  async function handleDelete(product: Product) {
    const result = await deleteProductAction(product.id);
    if (result.error) {
      showToast(result.error, "danger");
      return;
    }
    showToast(`Produk "${product.name}" berhasil dihapus.`, "success");
    router.refresh();
  }

  return (
    <>
      {loadError ? (
        <ErrorState
          message="Gagal memuat data produk. Periksa koneksi Anda dan coba lagi."
          onRetry={() => router.refresh()}
        />
      ) : (
        <div className="space-y-4">
          <ProductFilters
            category={category}
            onCategoryChange={handleFilterChange(setCategory)}
            search={search}
            onSearchChange={handleFilterChange(setSearch)}
            onReset={handleResetFilters}
            hasActiveFilters={hasActiveFilters}
            canCreate={canManage}
          />

          <ProductGrid
            products={paginatedProducts}
            loading={false}
            page={safePage}
            totalPages={totalPages}
            totalProducts={filteredProducts.length}
            onPageChange={setPage}
            onDelete={handleDelete}
            canManage={canManage}
          />
        </div>
      )}

      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </>
  );
}
