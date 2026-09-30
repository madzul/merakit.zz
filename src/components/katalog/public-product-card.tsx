import Link from "next/link";
import { ProductImage } from "@/components/produk/product-image";
import { formatRupiah } from "@/lib/utils";
import type { Product } from "@/lib/types";

/** Kartu produk untuk katalog publik — tanpa data internal (stok pasti, status admin). */
export function PublicProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/katalog/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-card transition-shadow hover:shadow-card-hover"
    >
      <div className="relative aspect-square w-full bg-neutral-50">
        <ProductImage src={product.imageUrl} name={product.name} />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{product.category}</p>
        <h2 className="line-clamp-2 text-sm font-semibold text-neutral-800 group-hover:text-primary-700">{product.name}</h2>
        <p className="mt-auto pt-1 text-base font-semibold text-primary-700">{formatRupiah(product.price)}</p>
        <p className="text-xs text-neutral-500">{product.stock > 0 ? "Siap kirim" : "Bisa dipesan (dibuat dulu)"}</p>
      </div>
    </Link>
  );
}
