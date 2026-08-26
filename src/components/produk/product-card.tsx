"use client";

import Link from "next/link";
import { AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import {
  PRODUCT_ACTIVE_BADGE_STYLES,
  PRODUCT_ACTIVE_LABELS,
  activeKey,
  isLowStock,
  isOutOfStock,
} from "@/lib/product-status";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

/** Kartu produk untuk tampilan katalog (grid), dipakai di halaman daftar produk. */
export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const lowStock = isLowStock(product.stock);
  const outOfStock = isOutOfStock(product.stock);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-card transition-shadow hover:shadow-card-hover">
      <Link href={`/dashboard/produk/${product.id}`} className="block">
        <div className="relative aspect-square w-full bg-neutral-50">
          {/* eslint-disable-next-line @next/next/no-img-element -- gambar placeholder lokal (SVG statis), tidak memerlukan optimisasi next/image */}
          <img
            src={product.imageUrl}
            alt={`Gambar placeholder produk ${product.name}`}
            className="absolute inset-0 h-full w-full object-contain p-6"
          />
          <span
            className={cn(
              "absolute left-2 top-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
              PRODUCT_ACTIVE_BADGE_STYLES[activeKey(product.isActive)]
            )}
          >
            {PRODUCT_ACTIVE_LABELS[activeKey(product.isActive)]}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-neutral-400">
            {product.category}
          </p>
          <Link href={`/dashboard/produk/${product.id}`}>
            <h3 className="truncate text-sm font-semibold text-neutral-800 hover:text-primary-700">
              {product.name}
            </h3>
          </Link>
        </div>

        <p className="text-base font-semibold text-primary-700">{formatCurrency(product.price)}</p>

        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>Stok: {product.stock}</span>
          {outOfStock ? (
            <span className="inline-flex items-center gap-1 font-medium text-danger-600">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              Stok habis
            </span>
          ) : lowStock ? (
            <span className="inline-flex items-center gap-1 font-medium text-warning-600">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              Stok menipis
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => onEdit(product)}
            aria-label={`Edit produk ${product.name}`}
            className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(product)}
            aria-label={`Hapus produk ${product.name}`}
            className="flex items-center gap-1.5 rounded-md border border-danger-200 px-2.5 py-1.5 text-xs font-medium text-danger-600 hover:bg-danger-50"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
