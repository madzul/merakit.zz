"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/error-state";
import { ProductFilters } from "@/components/produk/product-filters";
import { ProductGrid } from "@/components/produk/product-grid";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { getProducts, deleteProduct } from "@/lib/product-store";
import type { Product } from "@/lib/types";

const PAGE_SIZE = 8;

function ProdukPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast, showToast, dismissToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [category, setCategory] = useState<string>("semua");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    // Simulasi pemanggilan data (data dummy, belum terhubung backend/database).
    // Sesekali disimulasikan gagal untuk mendemonstrasikan error state.
    const timeout = window.setTimeout(() => {
      const shouldFail = Math.random() < 0.15;
      if (shouldFail) {
        setLoadError(true);
        setLoading(false);
        return;
      }
      setProducts(getProducts());
      setLoading(false);
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [loadAttempt]);

  // Toast simulasi setelah redirect dari form tambah/edit.
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

  function handleDelete(product: Product) {
    deleteProduct(product.id);
    setProducts(getProducts());
    showToast(`Produk "${product.name}" berhasil dihapus.`, "danger");
  }

  function handleRetry() {
    setLoading(true);
    setLoadError(false);
    setLoadAttempt((attempt) => attempt + 1);
  }

  return (
    <div>
      <PageHeader
        title="Katalog Produk"
        description="Kelola katalog produk rajut, harga, stok, dan status aktif."
      />

      {loadError ? (
        <ErrorState message="Gagal memuat data produk. Periksa koneksi Anda dan coba lagi." onRetry={handleRetry} />
      ) : (
        <div className="space-y-4">
          <ProductFilters
            category={category}
            onCategoryChange={handleFilterChange(setCategory)}
            search={search}
            onSearchChange={handleFilterChange(setSearch)}
            onReset={handleResetFilters}
            hasActiveFilters={hasActiveFilters}
          />

          <ProductGrid
            products={paginatedProducts}
            loading={loading}
            page={safePage}
            totalPages={totalPages}
            totalProducts={filteredProducts.length}
            onPageChange={setPage}
            onDelete={handleDelete}
          />
        </div>
      )}

      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

export default function ProdukPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-neutral-100" />}>
      <ProdukPageContent />
    </Suspense>
  );
}
