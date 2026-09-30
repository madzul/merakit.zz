"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { createExpense, deleteExpense } from "@/lib/supabase/repositories/expenses-repository";
import {
  countMaterialUsage,
  createMaterial,
  createMovement,
  deleteMaterial,
  deleteMovement,
  getMaterialById,
  getMovementById,
  replaceProductRecipe,
  updateMaterial,
  type MaterialInput,
} from "@/lib/supabase/repositories/materials-repository";
import { formatQuantity } from "@/lib/bahan-baku/constants";
import { isIsoDate, isNonEmptyString, isNonNegativeNumber, isPositiveNumber, type ActionResult } from "@/lib/action-utils";
import type { MaterialMovementType } from "@/lib/types";

async function requireAdmin(): Promise<string | null> {
  const profile = await getCurrentProfile();
  if (!profile) return "Sesi tidak valid. Silakan login kembali.";
  if (profile.role !== "admin") return "Hanya admin yang dapat mengelola bahan baku.";
  return null;
}

function revalidateMaterials(id?: string) {
  revalidatePath("/bahan-baku", "layout");
  revalidatePath("/dashboard");
  if (id) revalidatePath(`/bahan-baku/${id}`);
}

// ---------- bahan ----------

export type MaterialFormInput = MaterialInput & { initialStock: number };

function validateMaterial(input: MaterialInput): string | null {
  if (!isNonEmptyString(input.name) || input.name.trim().length > 100) return "Nama bahan wajib diisi (maks. 100 karakter).";
  if (!isNonEmptyString(input.unit) || input.unit.trim().length > 20) return "Satuan wajib diisi.";
  if (!isNonNegativeNumber(input.minStock)) return "Stok minimum tidak valid.";
  if (!isNonNegativeNumber(input.unitCost)) return "Harga satuan tidak valid.";
  return null;
}

function normalizeMaterial(input: MaterialInput): MaterialInput {
  return { ...input, name: input.name.trim(), unit: input.unit.trim(), notes: input.notes.trim() };
}

export async function createMaterialAction(input: MaterialFormInput): Promise<ActionResult & { id?: string }> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  const validationError = validateMaterial(input);
  if (validationError) return { error: validationError };
  if (!isNonNegativeNumber(input.initialStock)) return { error: "Stok awal tidak valid." };

  let id: string;
  try {
    id = await createMaterial(normalizeMaterial(input));
    if (input.initialStock > 0) {
      await createMovement({
        materialId: id,
        type: "penyesuaian",
        quantity: input.initialStock,
        unitCost: null,
        date: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date()),
        notes: "Stok awal",
        expenseId: null,
      });
    }
  } catch {
    return { error: "Gagal menyimpan bahan baku. Silakan coba lagi." };
  }

  revalidateMaterials();
  return { success: true, id };
}

export async function updateMaterialAction(id: string, input: MaterialInput): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  const validationError = validateMaterial(input);
  if (validationError) return { error: validationError };

  try {
    await updateMaterial(id, normalizeMaterial(input));
  } catch {
    return { error: "Gagal memperbarui bahan baku. Silakan coba lagi." };
  }

  revalidateMaterials(id);
  return { success: true };
}

/** Bahan yang sudah punya riwayat atau dipakai resep tidak dihapus — nonaktifkan saja. */
export async function deleteMaterialAction(id: string): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  try {
    const usage = await countMaterialUsage(id);
    if (usage.movements > 0 || usage.recipes > 0) {
      return {
        error: "Bahan ini sudah punya riwayat stok atau dipakai di resep produk. Nonaktifkan saja agar riwayatnya tetap tersimpan.",
      };
    }
    await deleteMaterial(id);
  } catch {
    return { error: "Gagal menghapus bahan baku. Silakan coba lagi." };
  }

  revalidateMaterials();
  return { success: true };
}

// ---------- pergerakan stok ----------

export interface MovementFormInput {
  materialId: string;
  type: MaterialMovementType;
  /** Untuk penyesuaian: nilai boleh negatif (koreksi berkurang). */
  quantity: number;
  unitCost: number | null;
  date: string;
  notes: string;
  /** Khusus "masuk" bernilai: catat juga sebagai pengeluaran (kategori Bahan Baku) di Keuangan. */
  recordExpense: boolean;
}

export async function recordMovementAction(input: MovementFormInput): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  if (!["masuk", "keluar", "penyesuaian"].includes(input.type)) return { error: "Jenis pergerakan tidak valid." };
  if (!isIsoDate(input.date)) return { error: "Tanggal tidak valid." };
  if (input.type === "penyesuaian") {
    if (typeof input.quantity !== "number" || !Number.isFinite(input.quantity) || input.quantity === 0) {
      return { error: "Jumlah penyesuaian tidak boleh 0." };
    }
  } else if (!isPositiveNumber(input.quantity)) {
    return { error: "Jumlah harus lebih dari 0." };
  }
  if (input.unitCost !== null && !isNonNegativeNumber(input.unitCost)) return { error: "Harga satuan tidak valid." };
  if (input.notes.trim().length > 200) return { error: "Catatan maksimal 200 karakter." };

  const material = await getMaterialById(input.materialId).catch(() => null);
  if (!material) return { error: "Bahan baku tidak ditemukan." };

  if (input.type === "keluar" && input.quantity > material.stock) {
    return {
      error: `Stok ${material.name} hanya ${formatQuantity(material.stock)} ${material.unit}. Periksa jumlahnya atau catat penyesuaian stok.`,
    };
  }

  const quantity = Math.round(input.quantity * 100) / 100;
  const unitCost = input.type === "masuk" ? input.unitCost : null;
  const shouldRecordExpense = input.type === "masuk" && input.recordExpense && unitCost !== null && unitCost > 0;

  let expenseId: string | null = null;
  try {
    if (shouldRecordExpense) {
      expenseId = await createExpense({
        type: "pengeluaran",
        category: "Bahan Baku",
        description: `Beli ${material.name} ${formatQuantity(quantity)} ${material.unit}`.slice(0, 200),
        amount: Math.round(quantity * (unitCost ?? 0)),
        date: input.date,
      });
    }
    await createMovement({
      materialId: material.id,
      type: input.type,
      quantity,
      unitCost,
      date: input.date,
      notes: input.notes.trim(),
      expenseId,
    });
  } catch {
    // Jangan tinggalkan pengeluaran yatim bila pencatatan stok gagal.
    if (expenseId) await deleteExpense(expenseId).catch(() => undefined);
    return { error: "Gagal mencatat pergerakan stok. Silakan coba lagi." };
  }

  revalidateMaterials(material.id);
  if (expenseId) revalidatePath("/keuangan", "layout");
  return { success: true };
}

/** Hanya pergerakan manual. Bila tertaut ke pengeluaran Keuangan, pengeluarannya ikut dihapus. */
export async function deleteMovementAction(id: string): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const movement = await getMovementById(id).catch(() => null);
  if (!movement) return { error: "Riwayat tidak ditemukan." };
  if (movement.productionRecordId) {
    return { error: "Pemakaian otomatis dari produksi hanya bisa diubah lewat catatan produksinya." };
  }

  try {
    await deleteMovement(id);
    if (movement.expenseId) await deleteExpense(movement.expenseId);
  } catch {
    return { error: "Gagal menghapus riwayat. Silakan coba lagi." };
  }

  revalidateMaterials(movement.materialId);
  if (movement.expenseId) revalidatePath("/keuangan", "layout");
  return { success: true };
}

// ---------- resep produk ----------

export async function saveProductRecipeAction(
  productId: string,
  rows: { materialId: string; quantityPerUnit: number }[]
): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  if (!isNonEmptyString(productId)) return { error: "Produk tidak valid." };
  if (rows.length > 30) return { error: "Maksimal 30 bahan per resep." };

  const seen = new Set<string>();
  for (const row of rows) {
    if (!isNonEmptyString(row.materialId)) return { error: "Setiap baris resep harus memilih bahan." };
    if (seen.has(row.materialId)) return { error: "Bahan yang sama tercantum lebih dari sekali." };
    seen.add(row.materialId);
    if (!isPositiveNumber(row.quantityPerUnit)) return { error: "Kebutuhan bahan per pcs harus lebih dari 0." };
  }

  try {
    await replaceProductRecipe(
      productId,
      rows.map((row) => ({ materialId: row.materialId, quantityPerUnit: Math.round(row.quantityPerUnit * 1000) / 1000 }))
    );
  } catch {
    return { error: "Gagal menyimpan resep. Silakan coba lagi." };
  }

  revalidatePath(`/dashboard/produk/${productId}`);
  return { success: true };
}
