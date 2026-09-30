import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PublicProductCard } from "@/components/katalog/public-product-card";
import { getActiveProducts } from "@/lib/supabase/repositories/products-repository";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "Katalog Produk Rajut — MERAKIT",
  description:
    "Katalog produk rajut buatan Komunitas Rajut Inklusif MERAKIT, Kampung Wisata Rajut Binong, Bandung. Pesan langsung via WhatsApp.",
};

interface KatalogPageProps {
  searchParams: Promise<{ kategori?: string; q?: string }>;
}

/**
 * Katalog publik — siapa pun bisa melihat tanpa login. Hanya produk aktif
 * yang tampil (difilter di query + RLS products_public_read_active untuk anon).
 */
export default async function KatalogPage({ searchParams }: KatalogPageProps) {
  const { kategori, q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase().slice(0, 100);

  let products: Product[] = [];
  let loadError = false;
  try {
    products = await getActiveProducts();
  } catch {
    loadError = true;
  }

  const categories = Array.from(new Set(products.map((product) => product.category))).sort((a, b) => a.localeCompare(b));
  const activeCategory = kategori && categories.includes(kategori) ? kategori : null;
  const filtered = products.filter((product) => {
    if (activeCategory && product.category !== activeCategory) return false;
    if (query && !`${product.name} ${product.description}`.toLowerCase().includes(query)) return false;
    return true;
  });

  function categoryHref(category: string | null) {
    const params = new URLSearchParams();
    if (category) params.set("kategori", category);
    if (query) params.set("q", query);
    const search = params.toString();
    return search ? `/katalog?${search}` : "/katalog";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-primary-50 px-5 py-6 sm:px-8 sm:py-8">
        <h1 className="text-2xl font-semibold text-neutral-800 sm:text-3xl">Rajut buatan tangan, dari Binong untuk Anda</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600 sm:text-base">
          Syal, tas, topi, dan aksesori rajut karya anggota Komunitas MERAKIT — perempuan, pemuda, dan sobat istimewa
          yang berkarya bersama di Kampung Wisata Rajut Binong, Bandung.
        </p>
      </section>

      <form action="/katalog" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" role="search">
        {activeCategory && <input type="hidden" name="kategori" value={activeCategory} />}
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <label htmlFor="cari-produk" className="sr-only">
            Cari produk
          </label>
          <input
            id="cari-produk"
            name="q"
            type="search"
            defaultValue={q ?? ""}
            placeholder="Cari produk, mis. syal"
            className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          />
        </div>
        {categories.length > 1 && (
          <nav aria-label="Kategori" className="flex flex-wrap gap-2">
            {[null, ...categories].map((category) => {
              const isActive = category === activeCategory;
              return (
                <Link
                  key={category ?? "semua"}
                  href={categoryHref(category)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    isActive ? "border-primary-700 bg-primary-700 text-white" : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                  )}
                >
                  {category ?? "Semua"}
                </Link>
              );
            })}
          </nav>
        )}
      </form>

      {loadError ? (
        <EmptyState message="Katalog sedang tidak dapat dimuat. Silakan coba beberapa saat lagi." />
      ) : filtered.length === 0 ? (
        <EmptyState message={products.length === 0 ? "Produk segera hadir." : "Tidak ada produk yang cocok dengan pencarian Anda."} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {filtered.map((product) => (
            <PublicProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
