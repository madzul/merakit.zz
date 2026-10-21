import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Pengirim email via SMTP — port dari utils/mailer.js IOM-ITB (Gmail SMTP +
 * app password). Env server:
 *   MAIL_USER, MAIL_PASS   wajib untuk mengaktifkan email
 *   MAIL_HOST              bawaan smtp.gmail.com
 *   MAIL_PORT              bawaan 587 (STARTTLS); 465 = SSL
 *   MAIL_FROM_NAME         bawaan "MERAKIT"
 */
let transporter: Transporter | null = null;

export function isEmailEnabled(): boolean {
  return Boolean(process.env.MAIL_USER && process.env.MAIL_PASS);
}

function getTransporter(): Transporter {
  if (!transporter) {
    const port = Number(process.env.MAIL_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transporter;
}

export interface SendResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

export async function sendEmail(input: { to: string; subject: string; html: string; text: string }): Promise<SendResult> {
  if (!isEmailEnabled()) return { ok: false, skipped: true, error: "MAIL_USER/MAIL_PASS belum diisi" };
  try {
    await getTransporter().sendMail({
      from: `"${process.env.MAIL_FROM_NAME || "MERAKIT"}" <${process.env.MAIL_USER}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message.slice(0, 300) : "Gagal mengirim email" };
  }
}
