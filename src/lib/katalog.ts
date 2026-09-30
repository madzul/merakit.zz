import { formatRupiah } from "@/lib/utils";

/**
 * Nomor WhatsApp pemesanan untuk katalog publik (env MERAKIT_WHATSAPP_NUMBER,
 * format bebas mis. "0812-3456-7890"). Dibaca di server saja. Bila kosong,
 * tombol "Pesan via WhatsApp" tidak ditampilkan.
 */
export function getOrderWhatsAppNumber(): string | null {
  const digits = (process.env.MERAKIT_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
  if (digits.length < 9) return null;
  return digits.startsWith("62") ? digits : `62${digits.replace(/^0/, "")}`;
}

/** Tautan wa.me dengan pesan pemesanan yang sudah terisi. */
export function orderWhatsAppLink(number: string, product: { name: string; price: number }, pageUrl?: string): string {
  const lines = [
    `Halo MERAKIT, saya tertarik memesan *${product.name}* (${formatRupiah(product.price)}).`,
    "Apakah masih tersedia?",
  ];
  if (pageUrl) lines.push(pageUrl);
  return `https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`;
}

/** Origin situs untuk tautan absolut di pesan WhatsApp/metadata. */
export function siteOrigin(): string | undefined {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || undefined;
}
