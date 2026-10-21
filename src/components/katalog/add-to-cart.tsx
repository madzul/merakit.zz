"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { addToCart } from "@/lib/penjualan/cart-store";
import { MAX_LINE_QUANTITY } from "@/lib/penjualan/constants";

interface AddToCartProps {
  product: { id: string; name: string; price: number; imageUrl: string };
}

/** Pilih jumlah lalu masukkan produk ke keranjang (halaman detail katalog). */
export function AddToCart({ product }: AddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"idle" | "added" | "full">("idle");

  function handleAdd() {
    const ok = addToCart({ productId: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl }, quantity);
    setStatus(ok ? "added" : "full");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-stretch gap-3">
        <div className="inline-flex items-center rounded-xl border border-neutral-200 bg-white">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Kurangi jumlah"
            className="px-3 py-3 text-neutral-600 disabled:opacity-40"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="w-10 text-center text-base font-semibold text-neutral-800" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(MAX_LINE_QUANTITY, q + 1))}
            aria-label="Tambah jumlah"
            className="px-3 py-3 text-neutral-600"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-700 px-5 py-3.5 text-base font-semibold text-white hover:bg-primary-800"
        >
          <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          Tambah ke Keranjang
        </button>
      </div>

      {status === "added" && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-lg bg-success-50 px-4 py-2.5 text-sm text-success-600">
          <span className="flex items-center gap-1.5">
            <Check className="h-4 w-4" aria-hidden="true" />
            Masuk keranjang.
          </span>
          <Link href="/katalog/keranjang" className="font-semibold underline underline-offset-2">
            Lihat keranjang &amp; bayar
          </Link>
        </div>
      )}
      {status === "full" && (
        <p role="alert" className="rounded-lg bg-warning-50 px-4 py-2.5 text-sm text-warning-600">
          Keranjang sudah berisi 20 jenis produk. Selesaikan pesanan ini dulu.
        </p>
      )}
    </div>
  );
}
