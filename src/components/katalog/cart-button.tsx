"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { cartCount, useCart } from "@/lib/penjualan/cart-store";

/** Tombol keranjang di header katalog, dengan jumlah barang. */
export function CartButton() {
  const count = cartCount(useCart());
  return (
    <Link
      href="/katalog/keranjang"
      aria-label={count > 0 ? `Keranjang, ${count} barang` : "Keranjang"}
      className="relative flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
    >
      <ShoppingCart className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Keranjang</span>
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-700 px-1 text-[11px] font-semibold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
