import "server-only";

export interface PaymentInfo {
  /** Baris instruksi transfer, mis. ["Bank BJB 0012345678", "a.n. Komunitas MERAKIT"]. */
  bankLines: string[];
  /** URL gambar QRIS statis (opsional). */
  qrisImageUrl: string | null;
}

/**
 * Info pembayaran untuk pembeli — dari env server:
 *   MERAKIT_PAYMENT_BANK      baris dipisah "|" mis. "Bank BJB 0012345678|a.n. Komunitas MERAKIT"
 *   MERAKIT_PAYMENT_QRIS_URL  URL gambar QRIS (mis. /qris-merakit.png di folder public/)
 * Bila keduanya kosong, pembeli diminta menunggu instruksi via WhatsApp.
 */
export function getPaymentInfo(): PaymentInfo {
  const bankLines = (process.env.MERAKIT_PAYMENT_BANK ?? "")
    .split("|")
    .map((line) => line.trim())
    .filter(Boolean);
  const qris = (process.env.MERAKIT_PAYMENT_QRIS_URL ?? "").trim();
  const qrisImageUrl = qris && (qris.startsWith("/") || qris.startsWith("https://")) ? qris : null;
  return { bankLines, qrisImageUrl };
}

export function hasPaymentInfo(info: PaymentInfo): boolean {
  return info.bankLines.length > 0 || info.qrisImageUrl !== null;
}
