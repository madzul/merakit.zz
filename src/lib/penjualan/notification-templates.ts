import "server-only";
import { formatRupiah } from "@/lib/utils";
import { shippingDetail } from "@/lib/penjualan/shipping";
import type { DeliveryMethod, OnlineSaleStatus } from "@/lib/types";

/**
 * Isi notifikasi email & WhatsApp penjualan online — mengikuti alur pesan
 * IOM-ITB (pesanan/bukti diterima, pembayaran berhasil, status pengiriman),
 * ditambah pesanan dibuat & bukti ditolak.
 */

export type SaleEvent =
  | { type: "created" }
  | { type: "proof_received"; key: string }
  | { type: "proof_rejected"; key: string }
  | { type: "paid" }
  | { type: "status"; status: OnlineSaleStatus };

export interface SaleSnapshot {
  code: string;
  customerName: string;
  deliveryMethod: DeliveryMethod;
  address: string | null;
  shippingCost: number;
  shippingZoneLabel: string | null;
  /** Kg ongkir yang ditagih (null untuk pesanan lama / ambil sendiri). */
  shippingBilledKg: number | null;
  totalAmount: number;
  notes: string | null;
  paymentNote: string | null;
  paymentMethod: "manual" | "midtrans";
  paymentType: string | null;
  courier: string | null;
  trackingNumber: string | null;
  items: { name: string; quantity: number; unitPrice: number; total: number }[];
}

export interface TemplateContext {
  trackingUrl: string | null;
  bankLines: string[];
  hasQris: boolean;
  midtransEnabled: boolean;
}

export interface BuiltMessage {
  subject: string;
  /** Kalimat pembuka utama (dipakai email & WA). */
  headline: string;
  /** Paragraf tambahan. */
  body: string[];
}

const PICKUP_ADDRESS = "Kampung Wisata Rajut Binong, Jl. Binong Jati No. 124, Bandung";

/** Event yang dikirim ke pembeli. Status "Baru"/"Diproses" tidak dikirim (sudah tercakup pesan lunas). */
export function shouldNotifyBuyer(event: SaleEvent): boolean {
  return event.type !== "status" || ["Dikirim", "Selesai", "Dibatalkan"].includes(event.status);
}

/** Event yang juga dikabarkan ke admin MERAKIT (bila ADMIN_NOTIFY_* diisi). */
export function shouldNotifyAdmin(event: SaleEvent, sale: SaleSnapshot): boolean {
  return event.type === "created" || event.type === "proof_received" || (event.type === "paid" && sale.paymentMethod === "midtrans");
}

export function eventKey(event: SaleEvent): string {
  switch (event.type) {
    case "proof_received":
    case "proof_rejected":
      return `${event.type}:${event.key}`;
    case "status":
      return `status:${event.status}`;
    default:
      return event.type;
  }
}

function paymentInstructions(ctx: TemplateContext, sale: SaleSnapshot): string[] {
  const lines: string[] = [];
  if (ctx.midtransEnabled) {
    lines.push("Bayar online (QRIS, virtual account, e-wallet, kartu) langsung dari halaman status pesanan — pembayaran terkonfirmasi otomatis.");
  }
  if (ctx.bankLines.length > 0) {
    lines.push(`${ctx.midtransEnabled ? "Atau transfer" : "Transfer"} ${formatRupiah(sale.totalAmount)} ke ${ctx.bankLines.join(", ")}, lalu unggah bukti di halaman status pesanan.`);
  } else if (ctx.hasQris) {
    lines.push(`${ctx.midtransEnabled ? "Atau scan" : "Scan"} QRIS di halaman status pesanan dengan nominal ${formatRupiah(sale.totalAmount)}, lalu unggah buktinya.`);
  } else if (!ctx.midtransEnabled) {
    lines.push("Admin MERAKIT akan mengirimkan instruksi pembayaran lewat WhatsApp.");
  }
  return lines;
}

export function buildBuyerMessage(event: SaleEvent, sale: SaleSnapshot, ctx: TemplateContext): BuiltMessage {
  switch (event.type) {
    case "created":
      return {
        subject: `Pesanan ${sale.code} diterima — MERAKIT`,
        headline: "Terima kasih, pesanan Anda sudah kami terima.",
        body: paymentInstructions(ctx, sale),
      };
    case "proof_received":
      return {
        subject: `Bukti pembayaran ${sale.code} diterima — MERAKIT`,
        headline: "Bukti pembayaran Anda sudah kami terima.",
        body: ["Tim MERAKIT akan memverifikasi pembayaran dalam 1×24 jam."],
      };
    case "proof_rejected":
      return {
        subject: `Bukti pembayaran ${sale.code} perlu diperbaiki — MERAKIT`,
        headline: "Mohon maaf, bukti pembayaran Anda belum dapat kami terima.",
        body: [
          sale.paymentNote ? `Alasan: ${sale.paymentNote}` : "",
          "Silakan unggah ulang bukti pembayaran lewat halaman status pesanan.",
        ].filter(Boolean),
      };
    case "paid":
      return {
        subject: `Pembayaran ${sale.code} berhasil — MERAKIT`,
        headline: "Pembayaran pesanan Anda berhasil dikonfirmasi.",
        body: [
          sale.paymentMethod === "midtrans" && sale.paymentType ? `Metode: ${paymentTypeLabel(sale.paymentType)}.` : "",
          "Pesanan Anda sedang dibuat/dikemas oleh perajin kami. Kami kabari lagi saat pesanan dikirim atau siap diambil.",
        ].filter(Boolean),
      };
    case "status":
      if (event.status === "Dikirim") {
        return sale.deliveryMethod === "ambil"
          ? {
              subject: `Pesanan ${sale.code} siap diambil — MERAKIT`,
              headline: "Pesanan Anda sudah siap diambil.",
              body: [`Silakan ambil di ${PICKUP_ADDRESS}. Sebutkan kode pesanan saat mengambil.`],
            }
          : {
              subject: `Pesanan ${sale.code} dikirim — MERAKIT`,
              headline: "Pesanan Anda sudah dikirim.",
              body: [
                sale.courier || sale.trackingNumber
                  ? `Kurir: ${sale.courier ?? "-"}${sale.trackingNumber ? ` · No. resi: ${sale.trackingNumber}` : ""}`
                  : "",
              ].filter(Boolean),
            };
      }
      if (event.status === "Selesai") {
        return {
          subject: `Pesanan ${sale.code} selesai — MERAKIT`,
          headline: "Pesanan Anda sudah selesai.",
          body: ["Terima kasih telah mendukung perajin perempuan, pemuda, dan sobat istimewa MERAKIT. Semoga suka dengan karyanya!"],
        };
      }
      return {
        subject: `Pesanan ${sale.code} dibatalkan — MERAKIT`,
        headline: "Pesanan Anda dibatalkan.",
        body: ["Bila sudah membayar, admin MERAKIT akan menghubungi Anda untuk pengembalian dana. Hubungi kami via WhatsApp bila ada pertanyaan."],
      };
  }
}

export function buildAdminMessage(event: SaleEvent, sale: SaleSnapshot): BuiltMessage {
  const items = sale.items.map((item) => `${item.name} ×${item.quantity}`).join(", ");
  if (event.type === "created") {
    return {
      subject: `[MERAKIT] Pesanan online baru ${sale.code}`,
      headline: `Pesanan online baru dari ${sale.customerName}.`,
      body: [`${items} — total ${formatRupiah(sale.totalAmount)}.`, sale.deliveryMethod === "ambil" ? "Ambil sendiri." : `Kirim ke: ${sale.address ?? "-"}`],
    };
  }
  if (event.type === "proof_received") {
    return {
      subject: `[MERAKIT] Bukti bayar ${sale.code} perlu diverifikasi`,
      headline: `${sale.customerName} mengunggah bukti pembayaran ${formatRupiah(sale.totalAmount)}.`,
      body: ["Periksa dan konfirmasi di menu Penjualan Online."],
    };
  }
  return {
    subject: `[MERAKIT] ${sale.code} lunas via Midtrans`,
    headline: `${sale.customerName} membayar ${formatRupiah(sale.totalAmount)} via ${paymentTypeLabel(sale.paymentType)}.`,
    body: ["Pesanan siap diproses."],
  };
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  qris: "QRIS",
  gopay: "GoPay",
  shopeepay: "ShopeePay",
  bank_transfer: "Virtual Account",
  echannel: "Mandiri Bill",
  credit_card: "Kartu kredit/debit",
  cstore: "Gerai retail",
  akulaku: "Akulaku",
  kredivo: "Kredivo",
};

export function paymentTypeLabel(type: string | null): string {
  if (!type) return "pembayaran online";
  return PAYMENT_TYPE_LABELS[type] ?? type.replace(/_/g, " ");
}

// ---------- Format keluaran ----------

function itemsText(sale: SaleSnapshot): string {
  return sale.items.map((item) => `- ${item.name} × ${item.quantity} = ${formatRupiah(item.total)}`).join("\n");
}

export function renderWhatsApp(message: BuiltMessage, sale: SaleSnapshot, ctx: TemplateContext, forAdmin = false): string {
  const parts = forAdmin
    ? [message.headline, `Kode: ${sale.code}`, ...message.body]
    : [
        `Halo ${sale.customerName}!`,
        message.headline,
        `Kode pesanan: *${sale.code}*\n${itemsText(sale)}${sale.shippingCost > 0 ? `\nOngkir${shippingDetail(sale.shippingZoneLabel, sale.shippingBilledKg)}: ${formatRupiah(sale.shippingCost)}` : ""}\nTotal: ${formatRupiah(sale.totalAmount)}`,
        ...message.body,
        ctx.trackingUrl ? `Pantau pesanan:\n${ctx.trackingUrl}` : "",
        "Salam hangat,\nKomunitas Rajut Inklusif MERAKIT",
      ];
  return parts.filter(Boolean).join("\n\n");
}

export function renderText(message: BuiltMessage, sale: SaleSnapshot, ctx: TemplateContext, forAdmin = false): string {
  return renderWhatsApp(message, sale, ctx, forAdmin).replace(/\*/g, "");
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function renderEmailHtml(message: BuiltMessage, sale: SaleSnapshot, ctx: TemplateContext, forAdmin = false): string {
  const rows = sale.items
    .map(
      (item) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">${escapeHtml(item.name)} × ${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">${formatRupiah(item.total)}</td>
      </tr>`
    )
    .join("");
  const shippingRow =
    sale.shippingCost > 0
      ? `<tr><td style="padding:8px 0;color:#6b7280;">Ongkir${escapeHtml(shippingDetail(sale.shippingZoneLabel, sale.shippingBilledKg))}</td><td style="padding:8px 0;text-align:right;">${formatRupiah(sale.shippingCost)}</td></tr>`
      : "";
  const cta = ctx.trackingUrl && !forAdmin
    ? `<p style="margin:24px 0 8px;"><a href="${escapeHtml(ctx.trackingUrl)}" style="display:inline-block;background:#285f55;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;">Lihat Status Pesanan</a></p>
       <p style="margin:0;color:#6b7280;font-size:12px;word-break:break-all;">Atau buka: ${escapeHtml(ctx.trackingUrl)}</p>`
    : "";

  return `<!doctype html><html lang="id"><body style="margin:0;background:#f5f5f4;">
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#262626;max-width:560px;margin:0 auto;padding:24px 12px;">
    <div style="background:#285f55;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
      <p style="margin:0;font-size:18px;font-weight:700;letter-spacing:.5px;">MERAKIT</p>
      <p style="margin:2px 0 0;font-size:12px;opacity:.85;">Komunitas Rajut Inklusif · Binong, Bandung</p>
    </div>
    <div style="background:#fff;border:1px solid #e7e5e4;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
      ${forAdmin ? "" : `<p style="margin:0 0 12px;">Halo <strong>${escapeHtml(sale.customerName)}</strong>,</p>`}
      <p style="margin:0 0 16px;font-size:16px;font-weight:700;">${escapeHtml(message.headline)}</p>
      <p style="margin:0 0 8px;color:#6b7280;">Kode pesanan: <strong style="color:#285f55;">${escapeHtml(sale.code)}</strong></p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}${shippingRow}
        <tr><td style="padding:10px 0;font-weight:700;">Total</td><td style="padding:10px 0;text-align:right;font-weight:700;color:#285f55;">${formatRupiah(sale.totalAmount)}</td></tr>
      </table>
      ${message.body.map((paragraph) => `<p style="margin:12px 0 0;">${escapeHtml(paragraph)}</p>`).join("")}
      ${cta}
    </div>
    <p style="margin:16px 0 0;color:#a8a29e;font-size:12px;text-align:center;">Setiap produk dirajut tangan oleh anggota Komunitas MERAKIT.<br/>Email ini dikirim otomatis — balas via WhatsApp bila ada pertanyaan.</p>
  </div></body></html>`;
}
