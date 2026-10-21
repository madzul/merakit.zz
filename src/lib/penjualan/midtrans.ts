import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { isServiceRoleConfigured } from "@/lib/supabase/admin";

/**
 * Klien Midtrans Snap + Core API (REST langsung, tanpa SDK) — mengikuti
 * utils/midtrans.js & services/payments IOM-ITB. Env server:
 *   MIDTRANS_ENABLED=true        saklar utama (bawaan mati)
 *   MIDTRANS_SERVER_KEY          rahasia, JANGAN diberi prefiks NEXT_PUBLIC_
 *   MIDTRANS_CLIENT_KEY          dipakai snap.js di browser (boleh publik)
 *   MIDTRANS_IS_PRODUCTION=true  pakai endpoint produksi (bawaan sandbox)
 * Butuh juga SUPABASE_SERVICE_ROLE_KEY: hasil bayar ditulis server, bukan pembeli.
 */

export const SNAP_EXPIRY_HOURS = 24;

export function isMidtransEnabled(): boolean {
  return (
    process.env.MIDTRANS_ENABLED === "true" &&
    Boolean(process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_CLIENT_KEY) &&
    isServiceRoleConfigured()
  );
}

export function isMidtransProduction(): boolean {
  return process.env.MIDTRANS_IS_PRODUCTION === "true";
}

export function midtransClientConfig() {
  return {
    clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
    snapScriptUrl: `${SNAP_BASE()}/snap/snap.js`,
  };
}

function authHeader() {
  return `Basic ${Buffer.from(`${process.env.MIDTRANS_SERVER_KEY ?? ""}:`).toString("base64")}`;
}

// MIDTRANS_SNAP_BASE_URL / MIDTRANS_API_BASE_URL hanya untuk pengujian (server tiruan); biarkan kosong.
const SNAP_BASE = () =>
  process.env.MIDTRANS_SNAP_BASE_URL || (isMidtransProduction() ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com");
const API_BASE = () =>
  process.env.MIDTRANS_API_BASE_URL || (isMidtransProduction() ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com");

/** "2026-10-21 14:05:00 +0700" — format start_time yang diminta Midtrans. */
export function formatMidtransTime(date: Date): string {
  const jakarta = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const iso = jakarta.toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)} +0700`;
}

export interface SnapItem {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export interface SnapRequest {
  orderId: string;
  grossAmount: number;
  customer: { name: string; phone: string; email: string | null; address: string | null };
  items: SnapItem[];
  finishUrl: string | null;
}

export async function createSnapTransaction(request: SnapRequest): Promise<{ token: string; redirectUrl: string }> {
  const response = await fetch(`${SNAP_BASE()}/snap/v1/transactions`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      transaction_details: { order_id: request.orderId, gross_amount: request.grossAmount },
      customer_details: {
        first_name: request.customer.name.slice(0, 50),
        phone: request.customer.phone,
        ...(request.customer.email && { email: request.customer.email }),
        ...(request.customer.address && { shipping_address: { address: request.customer.address.slice(0, 200) } }),
      },
      // Midtrans menolak bila jumlah item_details ≠ gross_amount; nama maks. 50 karakter.
      item_details: request.items.map((item) => ({ ...item, name: item.name.slice(0, 50) })),
      expiry: { start_time: formatMidtransTime(new Date()), unit: "hours", duration: SNAP_EXPIRY_HOURS },
      ...(request.finishUrl && { callbacks: { finish: request.finishUrl } }),
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await response.json().catch(() => ({}))) as { token?: string; redirect_url?: string; error_messages?: string[] };
  if (!response.ok || !body.token) {
    throw new Error(`Midtrans Snap ${response.status}: ${(body.error_messages ?? []).join("; ") || "tanpa token"}`);
  }
  return { token: body.token, redirectUrl: body.redirect_url ?? "" };
}

export interface MidtransStatus {
  order_id: string;
  transaction_id?: string;
  transaction_status?: string;
  fraud_status?: string;
  status_code?: string;
  gross_amount?: string;
  payment_type?: string;
  settlement_time?: string;
  signature_key?: string;
  [key: string]: unknown;
}

/** Status terkini dari Midtrans, atau null bila sesi belum pernah dimulai (404). */
export async function getMidtransStatus(orderId: string): Promise<MidtransStatus | null> {
  const response = await fetch(`${API_BASE()}/v2/${encodeURIComponent(orderId)}/status`, {
    headers: { Authorization: authHeader(), Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await response.json().catch(() => ({}))) as MidtransStatus & { status_message?: string };
  if (response.status === 404 || body.status_code === "404") return null;
  if (!response.ok) throw new Error(`Midtrans status ${response.status}: ${body.status_message ?? ""}`);
  return body;
}

/** sha512(order_id + status_code + gross_amount + server_key) — sama dengan verifySignature IOM. */
export function verifyMidtransSignature(body: { order_id?: string; status_code?: string; gross_amount?: string; signature_key?: string }): boolean {
  if (!body?.signature_key || !body.order_id || !body.status_code || !body.gross_amount) return false;
  const expected = createHash("sha512")
    .update(`${body.order_id}${body.status_code}${body.gross_amount}${process.env.MIDTRANS_SERVER_KEY ?? ""}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(body.signature_key));
  return a.length === b.length && timingSafeEqual(a, b);
}

export type MappedPayment = "paid" | "pending" | "failed" | "refunded";

/** Pemetaan status Midtrans → status kita (PaymentNotificationDto.mapPaymentStatus IOM). */
export function mapMidtransStatus(transactionStatus?: string, fraudStatus?: string): MappedPayment {
  switch (transactionStatus) {
    case "capture":
      return fraudStatus === "accept" ? "paid" : "pending";
    case "settlement":
      return "paid";
    case "expire":
    case "cancel":
    case "deny":
    case "failure":
      return "failed";
    case "refund":
    case "partial_refund":
      return "refunded";
    default:
      return "pending";
  }
}
