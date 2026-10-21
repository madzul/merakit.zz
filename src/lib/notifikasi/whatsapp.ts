import "server-only";
import type { SendResult } from "./mailer";

/**
 * Pengirim WhatsApp lewat HTTP gateway — port dari utils/whatsapp.js IOM-ITB
 * (POST {WA_API_URL}/api/v1/messages/whatsapp, Bearer WA_API_KEY,
 * header Idempotency-Key). Env server:
 *   WA_API_KEY   wajib untuk mengaktifkan WhatsApp otomatis
 *   WA_API_URL   alamat gateway (tanpa garis miring di akhir)
 */
export function isWhatsAppEnabled(): boolean {
  return Boolean(process.env.WA_API_KEY?.trim() && process.env.WA_API_URL?.trim());
}

/** "0812…", "62812…", "+62 812-…" → "+62812…" (E.164), atau null bila tidak valid. */
export function normalizeWhatsAppNumber(raw: string | null | undefined): string | null {
  const text = String(raw ?? "").trim().replace(/[^\d+]/g, "");
  if (!text) return null;
  let digits = text.startsWith("+") ? text.slice(1).replace(/\D/g, "") : text.replace(/\D/g, "");
  if (text.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith("8")) digits = `62${digits}`;
  const e164 = `+${digits}`;
  return /^\+[1-9]\d{7,14}$/.test(e164) ? e164 : null;
}

export async function sendWhatsApp(to: string, message: string, idempotencyKey: string, clientReference?: string): Promise<SendResult> {
  const apiKey = process.env.WA_API_KEY?.trim();
  const baseUrl = process.env.WA_API_URL?.trim().replace(/\/+$/, "");
  if (!apiKey || !baseUrl) return { ok: false, skipped: true, error: "WA_API_KEY/WA_API_URL belum diisi" };

  try {
    const response = await fetch(`${baseUrl}/api/v1/messages/whatsapp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Idempotency-Key": idempotencyKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, message, ...(clientReference && { client_reference: clientReference }) }),
      signal: AbortSignal.timeout(15_000),
    });
    if (response.ok) return { ok: true };
    const body = await response.text().catch(() => "");
    return { ok: false, error: `HTTP ${response.status}: ${body.slice(0, 200)}` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message.slice(0, 300) : "Gagal mengirim WhatsApp" };
  }
}
