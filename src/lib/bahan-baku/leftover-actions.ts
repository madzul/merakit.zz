"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { createLeftover, deleteLeftover, updateLeftoverStatus, type LeftoverInput } from "@/lib/supabase/repositories/leftovers-repository";
import { LEFTOVER_STATUS_LABELS } from "@/lib/bahan-baku/leftovers";
import { isIsoDate, isNonEmptyString, isPositiveNumber, type ActionResult } from "@/lib/action-utils";
import type { LeftoverStatus } from "@/lib/types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isStatus = (value: unknown): value is LeftoverStatus => typeof value === "string" && value in LEFTOVER_STATUS_LABELS;

function revalidateLeftovers() {
  revalidatePath("/bahan-baku/sisa");
}

/** Semua pengguna login boleh mencatat sisa bahan (admin & anggota). */
export async function createLeftoverAction(input: LeftoverInput): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Sesi tidak valid. Silakan login kembali." };
  if (input.materialId !== null && !UUID_PATTERN.test(input.materialId)) return { error: "Bahan tidak valid." };
  if (!isPositiveNumber(input.quantity) || input.quantity > 1_000_000) return { error: "Jumlah sisa harus lebih dari 0." };
  if (!isNonEmptyString(input.unit) || input.unit.trim().length > 20) return { error: "Satuan wajib diisi." };
  if (!isIsoDate(input.date)) return { error: "Tanggal tidak valid." };
  if (!isStatus(input.status)) return { error: "Status tidak valid." };
  if (typeof input.notes !== "string" || input.notes.length > 300) return { error: "Keterangan maks. 300 karakter." };

  try {
    await createLeftover({ ...input, quantity: Math.round(input.quantity * 100) / 100, unit: input.unit.trim(), notes: input.notes.trim() });
  } catch {
    return { error: "Gagal menyimpan catatan sisa bahan. Silakan coba lagi." };
  }
  revalidateLeftovers();
  return { success: true };
}

/** Admin: semua catatan. Anggota: hanya catatannya sendiri (RLS). */
export async function updateLeftoverStatusAction(id: string, status: LeftoverStatus): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Sesi tidak valid. Silakan login kembali." };
  if (!UUID_PATTERN.test(id) || !isStatus(status)) return { error: "Data tidak valid." };
  try {
    await updateLeftoverStatus(id, status);
  } catch {
    return { error: "Gagal memperbarui. Anggota hanya bisa mengubah catatan yang ia buat sendiri." };
  }
  revalidateLeftovers();
  return { success: true };
}

export async function deleteLeftoverAction(id: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Sesi tidak valid. Silakan login kembali." };
  if (!UUID_PATTERN.test(id)) return { error: "Data tidak valid." };
  try {
    await deleteLeftover(id);
  } catch {
    return { error: "Gagal menghapus. Anggota hanya bisa menghapus catatan yang ia buat sendiri." };
  }
  revalidateLeftovers();
  return { success: true };
}
