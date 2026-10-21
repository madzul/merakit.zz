import { after, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getMidtransStatus, isMidtransEnabled, verifyMidtransSignature, type MidtransStatus } from "@/lib/penjualan/midtrans";
import { logPaymentEvent, processMidtransStatus } from "@/lib/penjualan/online-payment";
import { notifySaleEvent } from "@/lib/penjualan/notifications";

/**
 * Webhook "Payment Notification URL" Midtrans — port dari
 * handleNotification.js IOM-ITB. Isi di Midtrans Dashboard → Settings →
 * Payment → Notification URL: https://<domain>/api/midtrans/notification
 *
 * 1. Tanda tangan sha512 diverifikasi (tolak 401 bila salah).
 * 2. Status diambil ulang dari API Midtrans (bukan dipercaya dari body).
 * 3. Penjualan ditandai lunas + notifikasi email/WA dikirim setelah respons.
 * Error → 500 supaya Midtrans mengulang pengiriman.
 */
export const dynamic = "force-dynamic";

function clientIp(request: Request): string | null {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
}

export async function POST(request: Request) {
  if (!isMidtransEnabled()) {
    return NextResponse.json({ message: "Midtrans disabled" }, { status: 503 });
  }

  const ip = clientIp(request);
  const allowed = (process.env.MIDTRANS_ALLOWED_IPS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (allowed.length > 0 && (!ip || !allowed.includes(ip.replace(/^::ffff:/, "")))) {
    return NextResponse.json({ message: "Source IP not allowed" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as MidtransStatus | null;
  if (!body?.order_id) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  if (!verifyMidtransSignature(body)) {
    await logPaymentEvent({ source: "notification", orderId: body.order_id, payload: body, signatureValid: false, processed: false, error: "Invalid signature", ipAddress: ip });
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  try {
    // Seperti coreApi.transaction.notification() di IOM: status otoritatif dari API Midtrans.
    const status = (await getMidtransStatus(body.order_id)) ?? body;
    const result = await processMidtransStatus(status, { source: "notification", signatureValid: true, ipAddress: ip });
    if (result.saleId) {
      const saleId = result.saleId;
      after(async () => {
        if (result.newlyPaid) await notifySaleEvent(saleId, { type: "paid" });
      });
      revalidatePath("/penjualan", "layout");
      revalidatePath("/dashboard/pesanan");
      revalidatePath("/keuangan", "layout");
    }
    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error("[midtrans] notifikasi gagal diproses:", error instanceof Error ? error.message : error);
    return NextResponse.json({ message: "Processing failed" }, { status: 500 });
  }
}
