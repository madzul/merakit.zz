"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import {
  createOrder,
  deleteOrder,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  type OrderInput,
} from "@/lib/supabase/repositories/orders-repository";
import { ORDER_STATUS_OPTIONS } from "@/lib/order-status";
import { getPromotionByCode } from "@/lib/supabase/repositories/promotions-repository";
import { ORDER_SOURCES, computeDiscount, effectivePromoStatus, formatPromoValue, normalizePromoCode } from "@/lib/promo/logic";
import {
  isIsoDate,
  isNonEmptyString,
  isNonNegativeNumber,
  isPositiveNumber,
  type ActionResult,
} from "@/lib/action-utils";
import type { OrderStatus } from "@/lib/types";

const VALID_STATUSES = new Set<string>(ORDER_STATUS_OPTIONS.map((option) => option.value));
const VALID_SOURCES = new Set<string>(ORDER_SOURCES);

/** Data dari form: diskon TIDAK dikirim klien — dihitung ulang di server dari kode promo. */
export type OrderFormInput = Omit<OrderInput, "promotionId" | "discountAmount"> & { promoCode: string };

/**
 * Terapkan kode promo: harus ada & aktif pada tanggal pesanan. Saat mengedit,
 * promo yang sama boleh tetap dipakai walau kini sudah kedaluwarsa/nonaktif
 * (pesanan dibuat saat promo masih berlaku).
 */
async function resolvePromotion(
  input: OrderFormInput,
  existingPromotionId: string | null = null
): Promise<{ promotionId: string | null; discountAmount: number; error?: string }> {
  const code = normalizePromoCode(input.promoCode ?? "");
  if (!code) return { promotionId: null, discountAmount: 0 };

  const promo = await getPromotionByCode(code).catch(() => null);
  if (!promo) return { promotionId: null, discountAmount: 0, error: `Kode promo "${code}" tidak ditemukan.` };

  const isSameAsBefore = existingPromotionId !== null && promo.id === existingPromotionId;
  const status = effectivePromoStatus(promo, input.orderDate);
  if (status !== "aktif" && !isSameAsBefore) {
    return {
      promotionId: null,
      discountAmount: 0,
      error:
        status === "kedaluwarsa"
          ? `Kode promo "${code}" sudah kedaluwarsa pada tanggal pesanan.`
          : `Kode promo "${code}" sedang nonaktif.`,
    };
  }

  return { promotionId: promo.id, discountAmount: computeDiscount(promo, input.unitPrice * input.quantity) };
}

export interface AppliedPromo {
  code: string;
  label: string;
  discountType: "persen" | "nominal";
  discountValue: number;
}

/** Pratinjau kode promo di form (server tetap menghitung ulang saat disimpan). */
export async function checkPromoCodeAction(code: string, orderDate: string): Promise<{ error?: string; promo?: AppliedPromo }> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  const normalized = normalizePromoCode(code ?? "");
  if (!normalized) return { error: "Masukkan kode promo." };
  const promo = await getPromotionByCode(normalized).catch(() => null);
  if (!promo) return { error: `Kode "${normalized}" tidak ditemukan.` };
  const status = effectivePromoStatus(promo, isIsoDate(orderDate) ? orderDate : "9999-12-31");
  if (status !== "aktif") return { error: status === "kedaluwarsa" ? "Kode promo sudah kedaluwarsa." : "Kode promo sedang nonaktif." };
  return {
    promo: {
      code: promo.code,
      label: `${promo.code} · ${formatPromoValue(promo)}`,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
    },
  };
}

async function requireAdmin(): Promise<string | null> {
  const profile = await getCurrentProfile();
  if (!profile) return "Sesi tidak valid. Silakan login kembali.";
  if (profile.role !== "admin") return "Hanya admin yang dapat mengelola pesanan.";
  return null;
}

function validate(input: OrderFormInput): string | null {
  if (!isIsoDate(input.orderDate)) return "Tanggal pesanan tidak valid.";
  if (!isNonEmptyString(input.customerName)) return "Nama pemesan wajib diisi.";
  if (!/^\d{8,15}$/.test(input.customerPhone)) return "Nomor telepon tidak valid.";
  if (!isNonEmptyString(input.productId)) return "Produk wajib dipilih.";
  if (!isPositiveNumber(input.quantity) || !Number.isInteger(input.quantity)) return "Jumlah harus bilangan bulat lebih dari 0.";
  if (!isNonNegativeNumber(input.unitPrice)) return "Harga satuan tidak valid.";
  if (!VALID_STATUSES.has(input.status)) return "Status pesanan tidak valid.";
  if (!VALID_SOURCES.has(input.source)) return "Sumber pesanan tidak valid.";
  return null;
}

function normalize(input: OrderFormInput, promotion: { promotionId: string | null; discountAmount: number }): OrderInput {
  return {
    orderDate: input.orderDate,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone,
    productId: input.productId,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    status: input.status,
    notes: input.notes.trim(),
    source: input.source,
    promotionId: promotion.promotionId,
    discountAmount: promotion.discountAmount,
  };
}

function revalidateOrders(id?: string) {
  revalidatePath("/dashboard/pesanan");
  revalidatePath("/dashboard");
  revalidatePath("/pemasaran");
  revalidatePath("/promo");
  revalidatePath("/keuangan", "layout");
  if (id) revalidatePath(`/dashboard/pesanan/${id}`);
}

export async function createOrderAction(input: OrderFormInput): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  const validationError = validate(input);
  if (validationError) return { error: validationError };
  const promotion = await resolvePromotion(input);
  if (promotion.error) return { error: promotion.error };

  try {
    await createOrder(normalize(input, promotion));
  } catch {
    return { error: "Gagal menyimpan pesanan. Silakan coba lagi." };
  }

  revalidateOrders();
  return { success: true };
}

export async function updateOrderAction(id: string, input: OrderFormInput): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const existing = await getOrderById(id).catch(() => null);
  if (!existing) return { error: "Pesanan tidak ditemukan. Mungkin sudah dihapus." };
  const promotion = await resolvePromotion(input, existing.promotionId);
  if (promotion.error) return { error: promotion.error };

  try {
    await updateOrder(id, normalize(input, promotion));
  } catch {
    return { error: "Gagal memperbarui pesanan. Silakan coba lagi." };
  }

  revalidateOrders(id);
  return { success: true };
}

export async function updateOrderStatusAction(id: string, status: OrderStatus): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  if (!VALID_STATUSES.has(status)) return { error: "Status pesanan tidak valid." };

  try {
    await updateOrderStatus(id, status);
  } catch {
    return { error: "Gagal mengubah status pesanan. Silakan coba lagi." };
  }

  revalidateOrders(id);
  return { success: true };
}

export async function deleteOrderAction(id: string): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  try {
    await deleteOrder(id);
  } catch {
    return { error: "Gagal menghapus pesanan. Silakan coba lagi." };
  }

  revalidateOrders(id);
  return { success: true };
}
