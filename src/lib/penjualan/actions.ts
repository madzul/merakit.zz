"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { notifySaleEvent } from "@/lib/penjualan/notifications";
import { verifyOnlinePayment } from "@/lib/penjualan/online-payment";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { createClient } from "@/lib/supabase/server";
import {
  deleteOnlineSale,
  getOnlineSaleById,
  updateOnlineSale,
  updateShippingZone,
} from "@/lib/supabase/repositories/online-sales-repository";
import { PAYMENT_PROOF_BUCKET, SALE_STATUS_LABELS, STATUSES_REQUIRING_PAYMENT } from "@/lib/penjualan/constants";
import type { ActionResult } from "@/lib/action-utils";
import type { OnlineSaleStatus } from "@/lib/types";

const VALID_STATUSES = new Set<string>(Object.keys(SALE_STATUS_LABELS));

async function requireAdmin(): Promise<string | null> {
  const profile = await getCurrentProfile();
  if (!profile) return "Sesi tidak valid. Silakan login kembali.";
  if (profile.role !== "admin") return "Hanya admin yang dapat mengelola penjualan online.";
  return null;
}

function revalidateSale(id?: string) {
  revalidatePath("/penjualan");
  if (id) revalidatePath(`/penjualan/${id}`);
  // Status penjualan disalin ke pesanan → ikut memengaruhi modul berikut.
  revalidatePath("/dashboard/pesanan");
  revalidatePath("/dashboard");
  revalidatePath("/pemasaran");
  revalidatePath("/keuangan", "layout");
  revalidatePath("/dashboard/produk", "layout");
  revalidatePath("/katalog", "layout");
}

/** Tandai lunas setelah admin memeriksa bukti transfer (atau menerima tunai saat diambil). */
export async function confirmPaymentAction(id: string): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  const sale = await getOnlineSaleById(id).catch(() => null);
  if (!sale) return { error: "Penjualan tidak ditemukan." };
  if (sale.status === "Dibatalkan") return { error: "Penjualan sudah dibatalkan." };
  if (sale.paymentStatus === "lunas") return { success: true };

  try {
    await updateOnlineSale(id, {
      paymentStatus: "lunas",
      paidAt: new Date().toISOString(),
      paymentNote: null,
      ...(sale.status === "Baru" && { status: "Diproses" as const }),
    });
  } catch {
    return { error: "Gagal mengonfirmasi pembayaran. Silakan coba lagi." };
  }
  after(() => notifySaleEvent(id, { type: "paid" }));
  revalidateSale(id);
  return { success: true };
}

export async function rejectPaymentAction(id: string, reason: string): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  const note = (reason ?? "").trim().slice(0, 300);
  if (!note) return { error: "Tuliskan alasan penolakan agar pembeli tahu yang harus diperbaiki." };
  const sale = await getOnlineSaleById(id).catch(() => null);
  if (!sale) return { error: "Penjualan tidak ditemukan." };
  if (sale.paymentStatus === "lunas") return { error: "Pembayaran sudah dikonfirmasi lunas. Batalkan konfirmasi dulu." };

  try {
    await updateOnlineSale(id, { paymentStatus: "ditolak", paymentNote: note });
  } catch {
    return { error: "Gagal menolak bukti pembayaran. Silakan coba lagi." };
  }
  // Kunci per bukti: bukti baru yang ditolak lagi tetap dikabarkan.
  const rejectionKey = sale.paymentProofPath ?? sale.paymentProofUploadedAt ?? new Date().toISOString();
  after(() => notifySaleEvent(id, { type: "proof_rejected", key: rejectionKey }));
  revalidateSale(id);
  return { success: true };
}

/** Koreksi bila admin keliru menandai lunas. */
export async function undoPaymentAction(id: string): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  const sale = await getOnlineSaleById(id).catch(() => null);
  if (!sale) return { error: "Penjualan tidak ditemukan." };
  if (sale.paymentMethod === "midtrans" && sale.paymentStatus === "lunas") {
    return { error: "Pembayaran online dikonfirmasi otomatis oleh Midtrans dan tidak bisa dibatalkan di sini. Proses refund lewat Dashboard Midtrans." };
  }
  if (STATUSES_REQUIRING_PAYMENT.includes(sale.status)) {
    return { error: `Ubah status dari "${SALE_STATUS_LABELS[sale.status]}" ke tahap sebelumnya dulu.` };
  }

  try {
    await updateOnlineSale(id, {
      paymentStatus: sale.paymentProofPath ? "menunggu_verifikasi" : "belum_bayar",
      paidAt: null,
    });
  } catch {
    return { error: "Gagal membatalkan konfirmasi. Silakan coba lagi." };
  }
  revalidateSale(id);
  return { success: true };
}

export interface SaleStatusInput {
  status: OnlineSaleStatus;
  courier: string;
  trackingNumber: string;
}

export async function updateSaleStatusAction(id: string, input: SaleStatusInput): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  if (!VALID_STATUSES.has(input.status)) return { error: "Status tidak valid." };
  const sale = await getOnlineSaleById(id).catch(() => null);
  if (!sale) return { error: "Penjualan tidak ditemukan." };
  if (STATUSES_REQUIRING_PAYMENT.includes(input.status) && sale.paymentStatus !== "lunas") {
    return { error: "Konfirmasi pembayaran (lunas) dulu sebelum menandai dikirim/selesai." };
  }

  try {
    await updateOnlineSale(id, {
      status: input.status,
      courier: (input.courier ?? "").trim().slice(0, 60) || null,
      trackingNumber: (input.trackingNumber ?? "").trim().slice(0, 60) || null,
    });
  } catch {
    return { error: "Gagal memperbarui status. Silakan coba lagi." };
  }
  if (input.status !== sale.status) {
    const status = input.status;
    after(() => notifySaleEvent(id, { type: "status", status }));
  }
  revalidateSale(id);
  return { success: true };
}

/** Hapus penjualan beserta baris pesanannya dan berkas bukti bayar. */
export async function deleteSaleAction(id: string): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  const sale = await getOnlineSaleById(id).catch(() => null);
  if (!sale) return { error: "Penjualan tidak ditemukan." };

  try {
    await deleteOnlineSale(id);
  } catch {
    return { error: "Gagal menghapus penjualan. Silakan coba lagi." };
  }
  if (sale.paymentProofPath) {
    const supabase = await createClient();
    await supabase.storage.from(PAYMENT_PROOF_BUCKET).remove([sale.paymentProofPath]).catch(() => null);
  }
  revalidateSale();
  return { success: true };
}

export async function updateShippingZoneAction(id: string, cost: number, isActive: boolean): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  if (!Number.isFinite(cost) || cost < 0 || cost > 10_000_000) return { error: "Tarif ongkir tidak valid." };

  try {
    await updateShippingZone(id, Math.round(cost), Boolean(isActive));
  } catch {
    return { error: "Gagal menyimpan tarif ongkir." };
  }
  revalidatePath("/penjualan");
  revalidatePath("/katalog/keranjang");
  return { success: true };
}

/** Tanya status pembayaran langsung ke Midtrans (bila webhook terlambat/belum dipasang). */
export async function checkMidtransStatusAction(id: string): Promise<ActionResult & { message?: string }> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  try {
    const result = await verifyOnlinePayment({ saleId: id });
    if (!result) return { error: "Penjualan ini belum punya sesi pembayaran online, atau Midtrans belum diaktifkan." };
    if (result.newlyPaid) after(() => notifySaleEvent(id, { type: "paid" }));
    revalidateSale(id);
    return { success: true, message: result.paid ? "Midtrans: pembayaran lunas." : `Midtrans: ${result.message}.` };
  } catch {
    return { error: "Gagal menghubungi Midtrans. Coba lagi." };
  }
}
