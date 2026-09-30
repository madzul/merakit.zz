"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import {
  createExpense,
  deleteExpense,
  getExpenseById,
  updateExpense,
  type TransactionInput,
} from "@/lib/supabase/repositories/expenses-repository";
import { isIsoDate, isNonEmptyString, isPositiveNumber, type ActionResult } from "@/lib/action-utils";

async function requireAdmin(): Promise<string | null> {
  const profile = await getCurrentProfile();
  if (!profile) return "Sesi tidak valid. Silakan login kembali.";
  if (profile.role !== "admin") return "Hanya admin yang dapat mengelola keuangan.";
  return null;
}

function validate(input: TransactionInput): string | null {
  if (input.type !== "pemasukan" && input.type !== "pengeluaran") return "Jenis transaksi tidak valid.";
  if (!isIsoDate(input.date)) return "Tanggal tidak valid.";
  if (!isNonEmptyString(input.description)) return "Keterangan wajib diisi.";
  if (input.description.trim().length > 200) return "Keterangan maksimal 200 karakter.";
  if (!isNonEmptyString(input.category)) return "Kategori wajib dipilih.";
  if (!isPositiveNumber(input.amount) || input.amount > 1_000_000_000_000) return "Jumlah harus lebih dari 0.";
  return null;
}

function normalize(input: TransactionInput): TransactionInput {
  return {
    ...input,
    description: input.description.trim(),
    category: input.category.trim(),
    amount: Math.round(input.amount),
  };
}

function revalidateFinance() {
  revalidatePath("/keuangan", "layout");
}

export async function createTransactionAction(input: TransactionInput): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  const validationError = validate(input);
  if (validationError) return { error: validationError };

  try {
    await createExpense(normalize(input));
  } catch {
    return { error: "Gagal menyimpan transaksi. Silakan coba lagi." };
  }

  revalidateFinance();
  return { success: true };
}

export async function updateTransactionAction(id: string, input: TransactionInput): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const existing = await getExpenseById(id).catch(() => null);
  if (!existing) return { error: "Transaksi tidak ditemukan. Mungkin sudah dihapus." };

  try {
    await updateExpense(id, normalize(input));
  } catch {
    return { error: "Gagal memperbarui transaksi. Silakan coba lagi." };
  }

  revalidateFinance();
  return { success: true };
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  try {
    await deleteExpense(id);
  } catch {
    return { error: "Gagal menghapus transaksi. Silakan coba lagi." };
  }

  revalidateFinance();
  return { success: true };
}
