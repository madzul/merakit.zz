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
