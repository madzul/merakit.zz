"use client";

import { useSyncExternalStore } from "react";
import { MAX_CART_LINES, MAX_LINE_QUANTITY } from "@/lib/penjualan/constants";

/**
 * Keranjang katalog publik — disimpan di localStorage (tanpa login), seperti
 * keranjang merchandise IOM-ITB. Harga di sini hanya untuk tampilan; harga
 * final selalu dihitung ulang database saat checkout.
 */
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  /** Berat per pcs (gram) untuk pratinjau ongkir; null = belum diisi (500 g). */
  weightGrams?: number | null;
}

const STORAGE_KEY = "merakit_cart_v1";
const EMPTY: CartItem[] = [];

let cache: CartItem[] | null = null;
const listeners = new Set<() => void>();

function read(): CartItem[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    cache = Array.isArray(parsed)
      ? parsed
          .filter((item) => item && typeof item.productId === "string" && Number.isInteger(item.quantity) && item.quantity > 0)
          .slice(0, MAX_CART_LINES)
      : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function write(items: CartItem[]) {
  cache = items;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Penyimpanan diblokir/penuh: keranjang tetap jalan selama tab terbuka.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const clampQuantity = (quantity: number) => Math.min(MAX_LINE_QUANTITY, Math.max(1, Math.round(quantity) || 1));

/** Tambah produk; mengembalikan false bila keranjang sudah penuh. */
export function addToCart(item: Omit<CartItem, "quantity">, quantity: number): boolean {
  const items = read();
  const existing = items.find((line) => line.productId === item.productId);
  if (existing) {
    write(items.map((line) => (line === existing ? { ...item, quantity: clampQuantity(line.quantity + quantity) } : line)));
    return true;
  }
  if (items.length >= MAX_CART_LINES) return false;
  write([...items, { ...item, quantity: clampQuantity(quantity) }]);
  return true;
}

export function setCartQuantity(productId: string, quantity: number) {
  write(read().map((line) => (line.productId === productId ? { ...line, quantity: clampQuantity(quantity) } : line)));
}

export function removeFromCart(productId: string) {
  write(read().filter((line) => line.productId !== productId));
}

/** Ganti data tampilan (nama/harga/foto) dengan data terbaru & buang produk yang tidak tersedia. */
export function refreshCart(fresh: { id: string; name: string; price: number; imageUrl: string; weightGrams: number | null }[]) {
  const byId = new Map(fresh.map((product) => [product.id, product]));
  write(
    read()
      .filter((line) => byId.has(line.productId))
      .map((line) => {
        const product = byId.get(line.productId)!;
        return { ...line, name: product.name, price: product.price, imageUrl: product.imageUrl, weightGrams: product.weightGrams };
      })
  );
}

export function clearCart() {
  write([]);
}

export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
