"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { notifySaleEvent, notifySaleEventByToken } from "@/lib/penjualan/notifications";
import { startOnlinePayment, verifyOnlinePayment } from "@/lib/penjualan/online-payment";
import { midtransClientConfig } from "@/lib/penjualan/midtrans";
import { getActiveProducts } from "@/lib/supabase/repositories/products-repository";
import {
  attachPaymentProof,
  createOnlineSale,
  findOnlineSaleToken,
} from "@/lib/supabase/repositories/online-sales-repository";
import { quoteOrderShipping, type OrderShippingQuote } from "@/lib/penjualan/shipping-quote";
import { normalizePostalCode } from "@/lib/penjualan/shipping-providers";

type CheckoutLive = { provider: string; service: string | null; cost: number; etd: string | null; billedKg: number };

const UNKNOWN_DESTINATION_MESSAGE =
  "Ongkir belum bisa dihitung. Isi kode pos tujuan (5 digit), atau lengkapi alamat sampai nama kota/kabupaten dan provinsi.";
import { MAX_CART_LINES, MAX_LINE_QUANTITY } from "@/lib/penjualan/constants";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_PATTERN = /^[0-9a-f]{64}$/;

/** Pesan dari RAISE EXCEPTION di fungsi database (errcode 22023) aman ditampilkan ke pembeli. */
function databaseMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "22023") {
    const message = (error as { message?: string }).message;
    if (message) return message;
  }
  return fallback;
}

export interface CartProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  inStock: boolean;
  /** Berat per pcs (gram); null = belum diisi admin. */
  weightGrams: number | null;
}

/**
 * Data terbaru produk di keranjang (harga bisa berubah sejak ditambahkan).
 * Produk yang dinonaktifkan/dihapus tidak dikembalikan. null = gagal memuat
 * (keranjang dibiarkan apa adanya, jangan dikosongkan).
 */
export async function getCartProductsAction(ids: string[]): Promise<CartProduct[] | null> {
  const wanted = new Set(ids.filter((id) => UUID_PATTERN.test(id)).slice(0, MAX_CART_LINES));
  if (wanted.size === 0) return [];
  const products = await getActiveProducts().catch(() => null);
  if (!products) return null;
  return products
    .filter((product) => wanted.has(product.id))
    .map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      imageUrl: product.imageUrl,
      inStock: product.stock > 0,
      weightGrams: product.weightGrams ?? null,
    }));
}

export interface CheckoutFormInput {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryMethod: "kirim" | "ambil";
  address: string;
  /** Kode pos tujuan (5 digit) untuk tarif live kurir; opsional. */
  postalCode?: string;
  notes: string;
  items: { productId: string; quantity: number }[];
}

/**
 * Buat penjualan online. Harga & ongkir dihitung di database; wilayah ongkir
 * ditentukan di server dari teks alamat (bukan dari pilihan browser).
 */
export async function checkoutAction(input: CheckoutFormInput): Promise<{ error?: string; token?: string; code?: string }> {
  const items = Array.isArray(input.items) ? input.items : [];
  if (items.length === 0) return { error: "Keranjang masih kosong." };
  if (items.length > MAX_CART_LINES) return { error: `Maksimal ${MAX_CART_LINES} produk per pesanan.` };
  for (const item of items) {
    if (!UUID_PATTERN.test(item.productId)) return { error: "Ada produk yang tidak valid di keranjang." };
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_LINE_QUANTITY) {
      return { error: `Jumlah tiap produk harus 1–${MAX_LINE_QUANTITY}.` };
    }
  }

  const deliveryMethod = input.deliveryMethod === "ambil" ? "ambil" : "kirim";
  const address = (input.address ?? "").trim();
  const rawPostal = (input.postalCode ?? "").trim();
  if (rawPostal && !normalizePostalCode(rawPostal)) return { error: "Kode pos harus 5 digit angka." };
  let shippingZone: string | null = null;
  let postalCode: string | null = deliveryMethod === "kirim" ? normalizePostalCode(rawPostal) : null;
  let liveShipping: CheckoutLive | null = null;
  if (deliveryMethod === "kirim") {
    // Seperti IOM: tarif live kurir dari kode pos, cadangan tabel zona dari alamat.
    const quote = await quoteOrderShipping({ address, postalCode }, items);
    if (!quote) return { error: UNKNOWN_DESTINATION_MESSAGE };
    postalCode = quote.postalCode;
    if (quote.provider === "table") {
      shippingZone = quote.zone;
    } else {
      liveShipping = { provider: quote.provider, service: quote.service, cost: quote.cost, etd: quote.etd, billedKg: quote.billedKg };
    }
  }

  try {
    const result = await createOnlineSale({
      customerName: (input.customerName ?? "").trim(),
      customerPhone: input.customerPhone ?? "",
      customerEmail: (input.customerEmail ?? "").trim() || null,
      deliveryMethod,
      address: address || null,
      shippingZone,
      notes: (input.notes ?? "").trim() || null,
      items,
      postalCode,
      liveShipping,
    });
    revalidatePath("/penjualan");
    revalidatePath("/dashboard/pesanan");
    revalidatePath("/dashboard");
    const token = result.publicToken;
    after(() => notifySaleEventByToken(token, { type: "created" }));
    return { token, code: result.code };
  } catch (error) {
    return { error: databaseMessage(error, "Pesanan gagal dibuat. Silakan coba lagi atau hubungi kami via WhatsApp.") };
  }
}

/** Form "Lacak pesanan": kode + nomor WhatsApp → halaman lacak. */
export async function lookupOrderAction(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const code = String(formData.get("kode") ?? "").trim().toUpperCase().slice(0, 30);
  const phone = String(formData.get("hp") ?? "").slice(0, 20);
  if (!code || !phone) return { error: "Isi kode pesanan dan nomor WhatsApp." };

  let token: string | null = null;
  try {
    token = await findOnlineSaleToken(code, phone);
  } catch {
    return { error: "Layanan sedang tidak tersedia. Coba lagi sebentar." };
  }
  if (!token) return { error: "Pesanan tidak ditemukan. Periksa kembali kode dan nomor WhatsApp." };
  redirect(`/katalog/pesanan/${token}`);
}

/** Dipanggil setelah browser mengunggah bukti ke bucket payment-proofs/<token>/. */
export async function attachPaymentProofAction(token: string, path: string): Promise<{ error?: string; success?: boolean }> {
  if (!TOKEN_PATTERN.test(token) || typeof path !== "string" || !path.startsWith(`${token}/`)) {
    return { error: "Berkas tidak valid." };
  }
  try {
    await attachPaymentProof(token, path);
  } catch (error) {
    return { error: databaseMessage(error, "Gagal menyimpan bukti pembayaran. Silakan coba lagi.") };
  }
  revalidatePath(`/katalog/pesanan/${token}`);
  revalidatePath("/penjualan", "layout");
  after(() => notifySaleEventByToken(token, { type: "proof_received", key: path }));
  return { success: true };
}

// ---------- Pembayaran online (Midtrans Snap) ----------

export type OnlinePaymentStart =
  | { snapToken: string; clientKey: string; snapScriptUrl: string }
  | { paid: true }
  | { error: string };

/** Siapkan popup Snap untuk pesanan ini (sesi lama dipakai ulang bila masih berlaku). */
export async function startOnlinePaymentAction(token: string): Promise<OnlinePaymentStart> {
  if (!TOKEN_PATTERN.test(token)) return { error: "Pesanan tidak ditemukan." };
  const result = await startOnlinePayment(token);
  if (result.kind === "error") return { error: result.message };
  if (result.kind === "paid") {
    revalidatePath(`/katalog/pesanan/${token}`);
    return { paid: true };
  }
  return { snapToken: result.snapToken, ...midtransClientConfig() };
}

/** Dipanggil setelah popup Snap selesai/ditutup — cek status langsung ke Midtrans. */
export async function verifyOnlinePaymentAction(token: string): Promise<{ paid: boolean }> {
  if (!TOKEN_PATTERN.test(token)) return { paid: false };
  try {
    const result = await verifyOnlinePayment({ publicToken: token });
    if (result?.saleId) {
      const saleId = result.saleId;
      if (result.newlyPaid) {
        after(() => notifySaleEvent(saleId, { type: "paid" }));
      }
      revalidatePath(`/katalog/pesanan/${token}`);
      revalidatePath("/penjualan", "layout");
    }
    return { paid: Boolean(result?.paid) };
  } catch {
    return { paid: false };
  }
}

/**
 * Pratinjau ongkir di keranjang (dipakai bila tarif live kurir aktif):
 * kode pos → tarif kurir termurah; selain itu tabel zona dari alamat.
 * Nilai final tetap dihitung ulang saat pesanan dibuat.
 */
export async function quoteShippingAction(input: {
  address: string;
  postalCode?: string;
  items: { productId: string; quantity: number }[];
}): Promise<{ quote: OrderShippingQuote | null }> {
  const items = (Array.isArray(input.items) ? input.items : [])
    .filter((item) => UUID_PATTERN.test(item.productId) && Number.isInteger(item.quantity) && item.quantity > 0)
    .slice(0, MAX_CART_LINES)
    .map((item) => ({ productId: item.productId, quantity: Math.min(item.quantity, MAX_LINE_QUANTITY) }));
  const address = String(input.address ?? "").slice(0, 500);
  const postalCode = normalizePostalCode(input.postalCode);
  if (items.length === 0 || (!address.trim() && !postalCode)) return { quote: null };
  try {
    return { quote: await quoteOrderShipping({ address, postalCode }, items) };
  } catch {
    return { quote: null };
  }
}
