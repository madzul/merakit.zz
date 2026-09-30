"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMemberId } from "@/lib/supabase/repositories/members-repository";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import {
  createProductionRecord,
  deleteProductionRecord,
  getProductionRecordById,
  updateProductionRecord,
  type ProductionInput,
} from "@/lib/supabase/repositories/production-repository";
import { PRODUCTION_STATUS_LABELS } from "@/lib/production-status";
import { isIsoDate, isNonEmptyString, isPositiveNumber, type ActionResult } from "@/lib/action-utils";

export type ProductionFormInput = Omit<ProductionInput, "memberId"> & {
  /** Hanya dipakai bila pengguna admin; anggota biasa selalu memakai member_id miliknya sendiri. */
  memberId?: string;
};

function validate(input: ProductionFormInput): string | null {
  if (!isIsoDate(input.productionDate)) return "Tanggal produksi tidak valid.";
  if (!isNonEmptyString(input.productId)) return "Produk wajib dipilih.";
  if (!isPositiveNumber(input.quantity) || !Number.isInteger(input.quantity)) return "Jumlah harus bilangan bulat lebih dari 0.";
  if (!Number.isInteger(input.rejectQuantity) || input.rejectQuantity < 0) return "Jumlah cacat harus bilangan bulat 0 atau lebih.";
  if (input.rejectQuantity > input.quantity) return "Jumlah cacat tidak boleh melebihi jumlah produksi.";
  if (!isPositiveNumber(input.duration) || !Number.isInteger(input.duration)) return "Durasi harus bilangan bulat lebih dari 0.";
  if (!(input.status in PRODUCTION_STATUS_LABELS)) return "Status produksi tidak valid.";
  return null;
}

/**
 * Tentukan member_id yang boleh dipakai: admin memilih bebas (wajib diisi),
 * anggota biasa dikunci ke member_id miliknya sendiri — mencegah spoofing.
 */
async function resolveMemberId(input: ProductionFormInput): Promise<{ memberId?: string; error?: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Sesi tidak valid. Silakan login kembali." };

  if (profile.role === "admin") {
    if (!isNonEmptyString(input.memberId)) return { error: "Anggota wajib dipilih." };
    return { memberId: input.memberId };
  }

  const ownMemberId = await getCurrentMemberId();
  if (!ownMemberId) return { error: "Akun ini belum terhubung ke data anggota. Hubungi admin." };
  return { memberId: ownMemberId };
}

function revalidateProduction() {
  revalidatePath("/produksi");
  revalidatePath("/dashboard");
  // Pemakaian bahan dicatat otomatis oleh trigger database dari resep produk.
  revalidatePath("/bahan-baku", "layout");
  // Produksi "selesai" menambah stok produk (trigger database).
  revalidatePath("/dashboard/produk", "layout");
  revalidatePath("/katalog", "layout");
  revalidatePath("/pemasaran");
  revalidatePath("/dashboard/anggota", "layout");
}

export async function createProductionAction(input: ProductionFormInput): Promise<ActionResult> {
  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const { memberId, error } = await resolveMemberId(input);
  if (error || !memberId) return { error: error ?? "Anggota tidak valid." };

  try {
    await createProductionRecord({ ...input, memberId, notes: input.notes.trim() });
  } catch {
    return { error: "Gagal menyimpan catatan produksi. Silakan coba lagi." };
  }

  revalidateProduction();
  return { success: true };
}

export async function updateProductionAction(id: string, input: ProductionFormInput): Promise<ActionResult> {
  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const { memberId, error } = await resolveMemberId(input);
  if (error || !memberId) return { error: error ?? "Anggota tidak valid." };

  // RLS mengembalikan null bila baris tidak ada ATAU bukan milik anggota ini.
  const existing = await getProductionRecordById(id).catch(() => null);
  if (!existing) return { error: "Catatan produksi tidak ditemukan. Mungkin sudah dihapus." };

  try {
    await updateProductionRecord(id, { ...input, memberId, notes: input.notes.trim() });
  } catch {
    return { error: "Gagal memperbarui catatan produksi. Silakan coba lagi." };
  }

  revalidateProduction();
  return { success: true };
}

export async function deleteProductionAction(id: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Sesi tidak valid. Silakan login kembali." };

  const existing = await getProductionRecordById(id).catch(() => null);
  if (!existing) return { error: "Catatan produksi tidak ditemukan atau bukan milik Anda." };

  try {
    await deleteProductionRecord(id);
  } catch {
    return { error: "Gagal menghapus catatan produksi. Silakan coba lagi." };
  }

  revalidateProduction();
  return { success: true };
}

