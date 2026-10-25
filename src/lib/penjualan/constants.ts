import type { DeliveryMethod, OnlinePaymentStatus, OnlineSaleStatus } from "@/lib/types";

/** Alur status penjualan online (urutan dipakai di tampilan linimasa). */
export const SALE_STATUS_FLOW: OnlineSaleStatus[] = ["Baru", "Diproses", "Dikirim", "Selesai"];

export const SALE_STATUS_LABELS: Record<OnlineSaleStatus, string> = {
  Baru: "Pesanan Baru",
  Diproses: "Sedang Dibuat/Dikemas",
  Dikirim: "Dikirim / Siap Diambil",
  Selesai: "Selesai",
  Dibatalkan: "Dibatalkan",
};

export const SALE_STATUS_BADGE_STYLES: Record<OnlineSaleStatus, string> = {
  Baru: "bg-warning-50 text-warning-600",
  Diproses: "bg-info-50 text-info-600",
  Dikirim: "bg-primary-50 text-primary-700",
  Selesai: "bg-success-50 text-success-600",
  Dibatalkan: "bg-danger-50 text-danger-600",
};

export const PAYMENT_STATUS_LABELS: Record<OnlinePaymentStatus, string> = {
  belum_bayar: "Belum Bayar",
  menunggu_verifikasi: "Menunggu Verifikasi",
  lunas: "Lunas",
  ditolak: "Bukti Ditolak",
};

export const PAYMENT_STATUS_BADGE_STYLES: Record<OnlinePaymentStatus, string> = {
  belum_bayar: "bg-neutral-100 text-neutral-600",
  menunggu_verifikasi: "bg-warning-50 text-warning-600",
  lunas: "bg-success-50 text-success-600",
  ditolak: "bg-danger-50 text-danger-600",
};

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  kirim: "Dikirim ke alamat",
  ambil: "Ambil di Kampung Rajut Binong",
};

export const SALE_STATUS_OPTIONS = (Object.keys(SALE_STATUS_LABELS) as OnlineSaleStatus[]).map((value) => ({
  value,
  label: SALE_STATUS_LABELS[value],
}));

export const PAYMENT_STATUS_OPTIONS = (Object.keys(PAYMENT_STATUS_LABELS) as OnlinePaymentStatus[]).map((value) => ({
  value,
  label: PAYMENT_STATUS_LABELS[value],
}));

/** Status yang hanya boleh dipilih setelah pembayaran lunas. */
export const STATUSES_REQUIRING_PAYMENT: OnlineSaleStatus[] = ["Dikirim", "Selesai"];

export const PAYMENT_PROOF_BUCKET = "payment-proofs";

export const MAX_CART_LINES = 20;
export const MAX_LINE_QUANTITY = 99;

/** Sumber tarif ongkir (online_sales.shipping_provider). */
export const SHIPPING_PROVIDER_LABELS: Record<string, string> = {
  rajaongkir: "RajaOngkir",
  agenwebsite: "AgenWebsite",
  table: "Tabel zona",
};
