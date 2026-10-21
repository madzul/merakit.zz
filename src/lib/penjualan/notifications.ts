import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, isEmailEnabled, type SendResult } from "@/lib/notifikasi/mailer";
import { isWhatsAppEnabled, normalizeWhatsAppNumber, sendWhatsApp } from "@/lib/notifikasi/whatsapp";
import { getPaymentInfo } from "@/lib/penjualan/config";
import { isMidtransEnabled } from "@/lib/penjualan/midtrans";
import { siteOrigin } from "@/lib/katalog";
import {
  buildAdminMessage,
  buildBuyerMessage,
  eventKey,
  renderEmailHtml,
  renderText,
  renderWhatsApp,
  shouldNotifyAdmin,
  shouldNotifyBuyer,
  type SaleEvent,
  type SaleSnapshot,
  type TemplateContext,
} from "@/lib/penjualan/notification-templates";

type Channel = "email" | "whatsapp" | "admin_email" | "admin_whatsapp";

export function isNotificationEnabled(): boolean {
  return isEmailEnabled() || isWhatsAppEnabled();
}

interface SaleRowForNotify {
  id: string;
  code: string;
  public_token: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_method: "kirim" | "ambil";
  address: string | null;
  shipping_cost: number;
  shipping_zone_label: string | null;
  total_amount: number;
  notes: string | null;
  payment_note: string | null;
  payment_method: "manual" | "midtrans";
  midtrans_payment_type: string | null;
  courier: string | null;
  tracking_number: string | null;
  orders: { quantity: number; unit_price: number; total_amount: number; created_at: string; products: { name: string } | null }[];
}

/**
 * Kirim email & WhatsApp untuk satu kejadian penjualan (pola notify* IOM-ITB).
 * Idempoten: tiap (penjualan, kejadian, kanal) dicatat di sale_notifications
 * dengan kunci unik, jadi webhook Midtrans + verifikasi manual yang datang
 * bersamaan tidak mengirim pesan ganda. Tidak pernah melempar error —
 * dipanggil lewat after() agar tidak menahan respons.
 */
export async function notifySaleEvent(saleId: string, event: SaleEvent): Promise<void> {
  try {
    if (!isNotificationEnabled()) return;
    const supabase = createAdminClient();
    if (!supabase) {
      console.warn("[notifikasi] SUPABASE_SERVICE_ROLE_KEY kosong — notifikasi dilewati.");
      return;
    }

    const { data, error } = await supabase
      .from("online_sales")
      .select("*, orders(quantity, unit_price, total_amount, created_at, products(name))")
      .eq("id", saleId)
      .maybeSingle();
    if (error || !data) return;
    const row = data as unknown as SaleRowForNotify;

    const sale: SaleSnapshot = {
      code: row.code,
      customerName: row.customer_name,
      deliveryMethod: row.delivery_method,
      address: row.address,
      shippingCost: Number(row.shipping_cost),
      shippingZoneLabel: row.shipping_zone_label,
      totalAmount: Number(row.total_amount),
      notes: row.notes,
      paymentNote: row.payment_note,
      paymentMethod: row.payment_method ?? "manual",
      paymentType: row.midtrans_payment_type,
      courier: row.courier,
      trackingNumber: row.tracking_number,
      items: [...(row.orders ?? [])]
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((order) => ({
          name: order.products?.name ?? "Produk",
          quantity: order.quantity,
          unitPrice: Number(order.unit_price),
          total: Number(order.total_amount),
        })),
    };

    const payment = getPaymentInfo();
    const origin = siteOrigin();
    const ctx: TemplateContext = {
      trackingUrl: origin ? `${origin}/katalog/pesanan/${row.public_token}` : null,
      bankLines: payment.bankLines,
      hasQris: payment.qrisImageUrl !== null,
      midtransEnabled: isMidtransEnabled(),
    };
    const key = eventKey(event);

    const tasks: { channel: Channel; recipient: string | null; send: () => Promise<SendResult> }[] = [];

    if (shouldNotifyBuyer(event)) {
      const message = buildBuyerMessage(event, sale, ctx);
      const phone = normalizeWhatsAppNumber(row.customer_phone);
      tasks.push({
        channel: "whatsapp",
        recipient: phone,
        send: () =>
          phone
            ? sendWhatsApp(phone, renderWhatsApp(message, sale, ctx), `merakit-${row.id}-${key}`, `merakit-sale-${row.id}`)
            : Promise.resolve({ ok: false, error: "Nomor WhatsApp tidak valid" }),
      });
      if (row.customer_email) {
        const email = row.customer_email;
        tasks.push({
          channel: "email",
          recipient: email,
          send: () =>
            sendEmail({ to: email, subject: message.subject, html: renderEmailHtml(message, sale, ctx), text: renderText(message, sale, ctx) }),
        });
      }
    }

    if (shouldNotifyAdmin(event, sale)) {
      const message = buildAdminMessage(event, sale);
      const adminCtx = { ...ctx, trackingUrl: origin ? `${origin}/penjualan/${row.id}` : null };
      const adminPhone = normalizeWhatsAppNumber(process.env.ADMIN_NOTIFY_WHATSAPP);
      const adminEmail = process.env.ADMIN_NOTIFY_EMAIL?.trim();
      if (adminPhone) {
        tasks.push({
          channel: "admin_whatsapp",
          recipient: adminPhone,
          send: () =>
            sendWhatsApp(
              adminPhone,
              renderWhatsApp(message, sale, adminCtx, true) + (adminCtx.trackingUrl ? `\n\n${adminCtx.trackingUrl}` : ""),
              `merakit-admin-${row.id}-${key}`,
              `merakit-sale-${row.id}`
            ),
        });
      }
      if (adminEmail) {
        tasks.push({
          channel: "admin_email",
          recipient: adminEmail,
          send: () =>
            sendEmail({
              to: adminEmail,
              subject: message.subject,
              html: renderEmailHtml(message, sale, adminCtx, true),
              text: renderText(message, sale, adminCtx, true) + (adminCtx.trackingUrl ? `\n\n${adminCtx.trackingUrl}` : ""),
            }),
        });
      }
    }

    await Promise.allSettled(
      tasks.map(async (task) => {
        const enabled = task.channel.endsWith("email") ? isEmailEnabled() : isWhatsAppEnabled();
        // Klaim slot dulu — baris yang sudah ada berarti pesan ini pernah diproses.
        const { data: claimed } = await supabase
          .from("sale_notifications")
          .upsert(
            {
              sale_id: row.id,
              event_key: key,
              channel: task.channel,
              recipient: task.recipient,
              status: enabled ? "pending" : "skipped",
              error: enabled ? null : "Kanal belum dikonfigurasi",
            },
            { onConflict: "sale_id,event_key,channel", ignoreDuplicates: true }
          )
          .select("id");
        if (!claimed || claimed.length === 0 || !enabled) return;

        const result = await task.send();
        await supabase
          .from("sale_notifications")
          .update({
            status: result.ok ? "sent" : result.skipped ? "skipped" : "failed",
            error: result.ok ? null : (result.error ?? null),
            sent_at: result.ok ? new Date().toISOString() : null,
          })
          .eq("id", claimed[0].id);
        if (!result.ok) console.warn(`[notifikasi] ${task.channel} ${row.code} ${key}: ${result.error}`);
      })
    );
  } catch (error) {
    console.error("[notifikasi] gagal:", error instanceof Error ? error.message : error);
  }
}

/** Sama dengan notifySaleEvent, dicari dari token lacak (alur pembeli tanpa login). */
export async function notifySaleEventByToken(publicToken: string, event: SaleEvent): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase || !isNotificationEnabled()) return;
  const { data } = await supabase.from("online_sales").select("id").eq("public_token", publicToken).maybeSingle();
  if (data) await notifySaleEvent(data.id, event);
}
