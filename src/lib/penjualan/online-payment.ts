import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteOrigin } from "@/lib/katalog";
import type { Json } from "@/lib/supabase/database.types";
import {
  SNAP_EXPIRY_HOURS,
  createSnapTransaction,
  getMidtransStatus,
  isMidtransEnabled,
  mapMidtransStatus,
  type MidtransStatus,
  type SnapItem,
} from "@/lib/penjualan/midtrans";

/**
 * Alur pembayaran online — diadaptasi dari createSnapToken.js,
 * processPaymentUpdate.js & verifyPayment.js IOM-ITB. Perbedaan: MERAKIT
 * tidak memesan stok saat checkout (produk bisa dibuat dulu), jadi
 * pembayaran kedaluwarsa/gagal hanya menghapus sesi Snap — pembeli bisa
 * mencoba lagi atau beralih ke transfer manual.
 */

interface SaleForPayment {
  id: string;
  code: string;
  public_token: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  address: string | null;
  shipping_cost: number;
  shipping_zone: string | null;
  shipping_zone_label: string | null;
  shipping_billed_kg?: number | null;
  total_amount: number;
  payment_status: string;
  status: string;
  midtrans_order_id: string | null;
  midtrans_snap_token: string | null;
  midtrans_snap_expires_at: string | null;
  orders: { product_id: string | null; quantity: number; unit_price: number; products: { name: string } | null }[];
}

const SALE_SELECT = "*, orders(product_id, quantity, unit_price, products(name))";

async function logEvent(entry: {
  source: string;
  orderId?: string | null;
  saleId?: string | null;
  transactionStatus?: string | null;
  payload?: unknown;
  signatureValid?: boolean | null;
  processed: boolean;
  error?: string | null;
  ipAddress?: string | null;
}) {
  const supabase = createAdminClient();
  if (!supabase) return;
  await supabase
    .from("payment_events")
    .insert({
      source: entry.source,
      order_id: entry.orderId ?? null,
      sale_id: entry.saleId ?? null,
      transaction_status: entry.transactionStatus ?? null,
      payload: (entry.payload ?? null) as Json,
      signature_valid: entry.signatureValid ?? null,
      processed: entry.processed,
      error: entry.error ?? null,
      ip_address: entry.ipAddress ?? null,
    })
    .then(
      () => null,
      () => null
    );
}
export { logEvent as logPaymentEvent };

export type StartPaymentResult =
  | { kind: "snap"; snapToken: string }
  | { kind: "paid" }
  | { kind: "error"; message: string };

/** Buat (atau pakai ulang) sesi Snap untuk pesanan dengan token lacak ini. */
export async function startOnlinePayment(publicToken: string): Promise<StartPaymentResult> {
  if (!isMidtransEnabled()) return { kind: "error", message: "Pembayaran online belum diaktifkan." };
  const supabase = createAdminClient()!;

  const { data, error } = await supabase.from("online_sales").select(SALE_SELECT).eq("public_token", publicToken).maybeSingle();
  if (error || !data) return { kind: "error", message: "Pesanan tidak ditemukan." };
  const sale = data as unknown as SaleForPayment;
  if (sale.status === "Dibatalkan") return { kind: "error", message: "Pesanan sudah dibatalkan." };
  if (sale.payment_status === "lunas") return { kind: "paid" };

  // Sesi lama masih berlaku → lanjutkan (pembeli menutup popup lalu kembali).
  if (sale.midtrans_snap_token && sale.midtrans_snap_expires_at && new Date(sale.midtrans_snap_expires_at).getTime() > Date.now() + 60_000) {
    return { kind: "snap", snapToken: sale.midtrans_snap_token };
  }

  // Sesi lama kedaluwarsa: pastikan belum terbayar sebelum membuat yang baru.
  if (sale.midtrans_order_id) {
    const previous = await getMidtransStatus(sale.midtrans_order_id).catch(() => null);
    if (previous) {
      const result = await processMidtransStatus(previous, { source: "verify" });
      if (result.paid) return { kind: "paid" };
    }
  }

  const items: SnapItem[] = sale.orders.map((order, index) => ({
    id: (order.product_id ?? `item-${index + 1}`).slice(0, 50),
    price: Math.round(Number(order.unit_price)),
    quantity: order.quantity,
    name: order.products?.name ?? "Produk rajut MERAKIT",
  }));
  if (Number(sale.shipping_cost) > 0) {
    items.push({
      id: `ongkir-${sale.shipping_zone ?? "flat"}`,
      price: Math.round(Number(sale.shipping_cost)),
      quantity: 1,
      // Seperti IOM: "Ongkir <wilayah> N kg".
      name: [`Ongkir ${sale.shipping_zone_label ?? ""}`.trim(), sale.shipping_billed_kg ? `${sale.shipping_billed_kg} kg` : ""]
        .filter(Boolean)
        .join(" "),
    });
  }
  const grossAmount = Math.round(Number(sale.total_amount));
  const itemSum = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const snapItems = itemSum === grossAmount ? items : [{ id: sale.code, price: grossAmount, quantity: 1, name: `Pesanan ${sale.code}` }];

  // Order id Midtrans harus unik per sesi; kode pesanan + sufiks waktu.
  const orderId = `${sale.code}-${Date.now().toString(36).toUpperCase()}`;
  const { error: reserveError } = await supabase
    .from("online_sales")
    .update({ midtrans_order_id: orderId, midtrans_snap_token: null, midtrans_snap_expires_at: null, midtrans_status: "creating" })
    .eq("id", sale.id)
    .neq("payment_status", "lunas");
  if (reserveError) return { kind: "error", message: "Gagal menyiapkan pembayaran. Coba lagi." };

  const origin = siteOrigin();
  try {
    const snap = await createSnapTransaction({
      orderId,
      grossAmount,
      customer: { name: sale.customer_name, phone: sale.customer_phone, email: sale.customer_email, address: sale.address },
      items: snapItems,
      finishUrl: origin ? `${origin}/katalog/pesanan/${sale.public_token}` : null,
    });
    const expiresAt = new Date(Date.now() + SNAP_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
    await supabase
      .from("online_sales")
      .update({ midtrans_snap_token: snap.token, midtrans_snap_expires_at: expiresAt, midtrans_status: "pending" })
      .eq("id", sale.id);
    await logEvent({ source: "snap", orderId, saleId: sale.id, processed: true, payload: { gross_amount: grossAmount } });
    return { kind: "snap", snapToken: snap.token };
  } catch (snapError) {
    const message = snapError instanceof Error ? snapError.message : String(snapError);
    await supabase.from("online_sales").update({ midtrans_status: "snap_failed" }).eq("id", sale.id);
    await logEvent({ source: "snap", orderId, saleId: sale.id, processed: false, error: message });
    return { kind: "error", message: "Layanan pembayaran online sedang bermasalah. Coba lagi atau gunakan transfer manual." };
  }
}

export interface ProcessResult {
  saleId: string | null;
  paid: boolean;
  /** true bila pembayaran BARU saja tercatat lunas (pemicu notifikasi). */
  newlyPaid: boolean;
  message: string;
}

/**
 * Terapkan status Midtrans ke penjualan (dipakai webhook & verifikasi).
 * `status` harus berasal dari Midtrans (webhook bertanda tangan valid atau
 * hasil GET status dengan server key).
 */
export async function processMidtransStatus(
  status: MidtransStatus,
  meta: { source: "notification" | "verify"; signatureValid?: boolean; ipAddress?: string | null }
): Promise<ProcessResult> {
  const supabase = createAdminClient();
  if (!supabase) return { saleId: null, paid: false, newlyPaid: false, message: "Service role belum dikonfigurasi" };

  const { data: sale } = await supabase
    .from("online_sales")
    .select("id, total_amount, payment_status, status, midtrans_order_id")
    .eq("midtrans_order_id", status.order_id)
    .maybeSingle();

  const base = { source: meta.source, orderId: status.order_id, transactionStatus: status.transaction_status ?? null, payload: status, signatureValid: meta.signatureValid ?? null, ipAddress: meta.ipAddress };

  if (!sale) {
    await logEvent({ ...base, processed: false, error: "Penjualan tidak ditemukan" });
    return { saleId: null, paid: false, newlyPaid: false, message: "Order not found" };
  }

  const mapped = mapMidtransStatus(status.transaction_status, status.fraud_status);
  const common = {
    midtrans_status: status.transaction_status ?? null,
    midtrans_transaction_id: status.transaction_id ?? null,
    midtrans_payment_type: status.payment_type ?? null,
  };

  try {
    if (mapped === "paid") {
      if (Math.round(Number(status.gross_amount)) !== Math.round(Number(sale.total_amount))) {
        throw new Error(`Nominal tidak cocok: ${status.gross_amount} ≠ ${sale.total_amount}`);
      }
      // Update bersyarat agar webhook & verifikasi yang datang bersamaan hanya sekali menandai lunas.
      const { data: updated } = await supabase
        .from("online_sales")
        .update({
          ...common,
          payment_status: "lunas",
          payment_method: "midtrans",
          payment_note: null,
          paid_at: status.settlement_time ? new Date(`${status.settlement_time.replace(" ", "T")}+07:00`).toISOString() : new Date().toISOString(),
          midtrans_snap_token: null,
          midtrans_snap_expires_at: null,
          ...(sale.status === "Baru" && { status: "Diproses" as const }),
        })
        .eq("id", sale.id)
        .neq("payment_status", "lunas")
        .select("id");
      const newlyPaid = Boolean(updated && updated.length > 0);
      await logEvent({ ...base, saleId: sale.id, processed: true });
      return { saleId: sale.id, paid: true, newlyPaid, message: newlyPaid ? "Payment processed" : "Already paid" };
    }

    if (mapped === "failed") {
      // Hanya sesi yang masih aktif; pesanan tetap belum dibayar dan bisa dicoba lagi.
      await supabase
        .from("online_sales")
        .update({ ...common, midtrans_snap_token: null, midtrans_snap_expires_at: null })
        .eq("id", sale.id)
        .eq("midtrans_order_id", status.order_id)
        .neq("payment_status", "lunas");
    } else if (sale.payment_status !== "lunas") {
      await supabase.from("online_sales").update(common).eq("id", sale.id);
    }
    await logEvent({ ...base, saleId: sale.id, processed: true });
    return { saleId: sale.id, paid: sale.payment_status === "lunas", newlyPaid: false, message: `Payment status: ${mapped}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logEvent({ ...base, saleId: sale.id, processed: false, error: message });
    throw error;
  }
}

/** Tanya Midtrans langsung (setelah popup ditutup / tombol "Cek status" admin). */
export async function verifyOnlinePayment(where: { publicToken: string } | { saleId: string }): Promise<ProcessResult | null> {
  if (!isMidtransEnabled()) return null;
  const supabase = createAdminClient()!;
  const query = supabase.from("online_sales").select("id, midtrans_order_id");
  const { data } = await ("publicToken" in where ? query.eq("public_token", where.publicToken) : query.eq("id", where.saleId)).maybeSingle();
  if (!data?.midtrans_order_id) return null;
  const status = await getMidtransStatus(data.midtrans_order_id);
  if (!status) return { saleId: data.id, paid: false, newlyPaid: false, message: "Sesi pembayaran belum dimulai" };
  return processMidtransStatus(status, { source: "verify" });
}
