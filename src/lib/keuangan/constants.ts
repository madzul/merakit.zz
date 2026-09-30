import type { TransactionType } from "@/lib/types";

/**
 * Kategori transaksi yang disarankan. Kolom `category` di database berupa
 * teks bebas, jadi kategori lama/di luar daftar ini tetap tampil apa adanya.
 *
 * Catatan: penjualan dari pesanan berstatus "Selesai" dihitung OTOMATIS dari
 * modul Pesanan — jangan dicatat ulang di sini agar tidak terhitung dua kali.
 * "Penjualan Langsung" untuk penjualan di luar modul Pesanan (mis. bazar).
 */
export const TRANSACTION_CATEGORIES: Record<TransactionType, string[]> = {
  pemasukan: ["Penjualan Langsung", "Iuran Anggota", "Hibah/Bantuan", "Pendapatan Lain"],
  pengeluaran: [
    "Bahan Baku",
    "Peralatan",
    "Upah/Honor",
    "Transportasi",
    "Konsumsi",
    "Pemasaran",
    "Operasional",
    "Pengeluaran Lain",
  ],
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  pemasukan: "Pemasukan",
  pengeluaran: "Pengeluaran",
};

/** Label baris penjualan otomatis dari modul Pesanan pada ringkasan/laporan. */
export const ORDER_SALES_LABEL = "Penjualan (pesanan selesai)";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/** Bulan berjalan ("YYYY-MM") menurut WIB, bukan zona waktu server. */
export function currentMonthInJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date()).slice(0, 7);
}

/** Validasi parameter ?bulan=YYYY-MM; kembali ke bulan berjalan bila tidak valid. */
export function parseMonthParam(value: string | undefined): string {
  if (value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return value;
  return currentMonthInJakarta();
}

export function monthRange(month: string): { from: string; to: string } {
  const [year, monthIndex] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, "0")}` };
}

export function shiftMonth(month: string, delta: number): string {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthIndex - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** "2026-09" -> "September 2026". */
export function formatMonthLabel(month: string): string {
  const [year, monthIndex] = month.split("-").map(Number);
  return `${MONTH_NAMES[monthIndex - 1]} ${year}`;
}
