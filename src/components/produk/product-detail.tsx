"use client";

import Link from "next/link";
import { AlertTriangle, CalendarDays, Pencil, Tag } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  PRODUCT_ACTIVE_BADGE_STYLES,
  PRODUCT_ACTIVE_LABELS,
  activeKey,
  isLowStock,
  isOutOfStock,
} from "@/lib/product-status";
import type { Product } from "@/lib/types";

interface ProductDetailProps {
  product: Product;
}

/** Detail produk katalog: gambar, deskripsi, harga, stok, dan status aktif. */
export function ProductDetail({ product }: ProductDetailProps) {
  const lowStock = isLowStock(product.stock);
  const outOfStock = isOutOfStock(product.stock);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-card lg:col-span-1">
        <div className="relative aspect-square w-full bg-neutral-50">
          {/* eslint-disable-next-line @next/next/no-img-element -- gambar placeholder lokal (SVG statis) */}
          <img
            src={product.imageUrl}
            alt={`Gambar placeholder produk ${product.name}`}
            className="absolute inset-0 h-full w-full object-contain p-8"
          />
        </div>
      </div>

      <div className="space-y-4 lg:col-span-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-neutral-400">
                <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                {product.category}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-neutral-800">{product.name}</h2>
              <span
                className={cn(
                  "mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                  PRODUCT_ACTIVE_BADGE_STYLES[activeKey(product.isActive)]
                )}
              >
                {PRODUCT_ACTIVE_LABELS[activeKey(product.isActive)]}
              </span>
            </div>

            <Link
              href={`/dashboard/produk/tambah?id=${product.id}`}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-primary-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-800"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
          </div>

          <p className="mt-4 text-sm text-neutral-600">{product.description}</p>

          <dl className="mt-4 flex items-center gap-1.5 text-xs text-neutral-500">
            <CalendarDays className="h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
            <dt className="sr-only">Tanggal dibuat</dt>
            <dd>Ditambahkan sejak {formatDate(product.createdAt)}</dd>
          </dl>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
            <p className="text-sm font-medium text-neutral-500">Harga</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-800">{formatCurrency(product.price)}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
            <p className="text-sm font-medium text-neutral-500">Stok</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-800">{product.stock} pcs</p>
            {outOfStock ? (
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-danger-600">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                Stok habis — segera tambah produksi.
              </p>
            ) : lowStock ? (
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-warning-600">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                Stok menipis, segera lakukan produksi ulang.
              </p>
            ) : (
              <p className="mt-1 text-xs text-neutral-400">Stok tersedia dengan aman.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
