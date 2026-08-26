import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format angka menjadi format Rupiah Indonesia, mis. 5600000 -> "Rp5.600.000".
 * Menggunakan Intl.NumberFormat("id-ID") untuk pemisah ribuan (titik) tanpa desimal.
 */
export function formatRupiah(value: number): string {
  return `Rp${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value)}`;
}

/**
 * Format angka Rupiah singkat untuk ruang terbatas (mis. sumbu grafik), contoh:
 * 5600000 -> "Rp5,6jt", 45000 -> "Rp45rb".
 */
export function formatRupiahShort(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `Rp${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })}jt`;
  }
  if (abs >= 1_000) {
    return `Rp${(value / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 0 })}rb`;
  }
  return formatRupiah(value);
}

/**
 * Format tanggal ISO ("YYYY-MM-DD") menjadi format tanggal Indonesia singkat,
 * mis. "2026-08-20" -> "20 Agu 2026".
 */
export function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

/** Format durasi pengerjaan (dalam jam) mis. 4 -> "4 jam". */
export function formatDuration(hours: number): string {
  return `${hours} jam`;
}

const AVATAR_PALETTE = [
  "bg-primary-100 text-primary-700",
  "bg-secondary-200 text-secondary-700",
  "bg-info-50 text-info-600",
  "bg-warning-50 text-warning-600",
  "bg-success-50 text-success-600",
];

/**
 * Warna latar avatar inisial yang konsisten untuk sebuah string (mis. id
 * anggota), tanpa foto/URL eksternal — cukup untuk kebutuhan data dummy.
 */
export function getAvatarColorClass(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % AVATAR_PALETTE.length;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

/** Format nomor telepon "628xxx" menjadi format tampilan "+62 8xx-xxxx-xxxx" (dummy, best-effort). */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "-";
  const withCountryCode = digits.startsWith("62") ? digits : `62${digits.replace(/^0/, "")}`;
  const rest = withCountryCode.slice(2);
  const parts = [rest.slice(0, 3), rest.slice(3, 7), rest.slice(7)].filter(Boolean);
  return `+62 ${parts.join("-")}`;
}

/** Tautan wa.me dari nomor telepon dummy. */
export function toWhatsAppLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const withCountryCode = digits.startsWith("62") ? digits : `62${digits.replace(/^0/, "")}`;
  return `https://wa.me/${withCountryCode}`;
}
