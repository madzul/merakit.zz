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
import {
  isIsoDate,
  isNonEmptyString,
  isNonNegativeNumber,
  isPositiveNumber,
  type ActionResult,
} from "@/lib/action-utils";
import type { OrderStatus } from "@/lib/types";

const VALID_STATUSES = new Set<string>(ORDER_STATUS_OPTIONS.map((option) => option.value));

async function requireAdmin(): Promise<string | null> {
  const profile = await getCurrentProfile();
  if (!profile) return "Sesi tidak valid. Silakan login kembali.";
  if (profile.role !== "admin") return "Hanya admin yang dapat mengelola pesanan.";
  return null;
}

function validate(input: OrderInput): string | null {
  if (!isIsoDate(input.orderDate)) return "Tanggal pesanan tidak valid.";
  if (!isNonEmptyString(input.customerName)) return "Nama pemesan wajib diisi.";
  if (!/^\d{8,15}$/.test(input.customerPhone)) return "Nomor telepon tidak valid.";
  if (!isNonEmptyString(input.productId)) return "Produk wajib dipilih.";
  if (!isPositiveNumber(input.quantity) || !Number.isInteger(input.quantity)) return "Jumlah harus bilangan bulat lebih dari 0.";
  if (!isNonNegativeNumber(input.unitPrice)) return "Harga satuan tidak valid.";
  if (!VALID_STATUSES.has(input.status)) return "Status pesanan tidak valid.";
  return null;
}

function normalize(input: OrderInput): OrderInput {
  return { ...input, customerName: input.customerName.trim(), notes: input.notes.trim() };
}

function revalidateOrders(id?: string) {
  revalidatePath("/dashboard/pesanan");
  revalidatePath("/dashboard");
  if (id) revalidatePath(`/dashboard/pesanan/${id}`);
}

export async function createOrderAction(input: OrderInput): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  const validationError = validate(input);
  if (validationError) return { error: validationError };

  try {
    await createOrder(normalize(input));
  } catch {
    return { error: "Gagal menyimpan pesanan. Silakan coba lagi." };
  }

  revalidateOrders();
  return { success: true };
}

export async function updateOrderAction(id: string, input: OrderInput): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const existing = await getOrderById(id).catch(() => null);
  if (!existing) return { error: "Pesanan tidak ditemukan. Mungkin sudah dihapus." };

  try {
    await updateOrder(id, normalize(input));
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
