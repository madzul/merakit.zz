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
import { detectShippingZone } from "@/lib/penjualan/shipping";
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
    }));
}

export interface CheckoutFormInput {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryMethod: "kirim" | "ambil";
  address: string;
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
  let shippingZone: string | null = null;
  if (deliveryMethod === "kirim") {
    const match = detectShippingZone(address);
    if (!match) return { error: "Kota/kabupaten pada alamat belum dikenali. Lengkapi sampai nama kota dan provinsi." };
    shippingZone = match.zone;
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
