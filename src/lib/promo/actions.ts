"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import {
  createPromotion,
  deletePromotion,
  getPromotionByCode,
  getPromotionUsage,
  updatePromotion,
  type PromoInput,
} from "@/lib/supabase/repositories/promotions-repository";
import { normalizePromoCode } from "@/lib/promo/logic";
import { isIsoDate, isPositiveNumber, type ActionResult } from "@/lib/action-utils";

async function requireAdmin(): Promise<string | null> {
  const profile = await getCurrentProfile();
  if (!profile) return "Sesi tidak valid. Silakan login kembali.";
  if (profile.role !== "admin") return "Hanya admin yang dapat mengelola promo.";
  return null;
}

function validate(input: PromoInput): string | null {
  const code = normalizePromoCode(input.code ?? "");
  if (!/^[A-Z0-9-]{3,20}$/.test(code)) return "Kode promo 3–20 karakter: huruf, angka, atau tanda hubung.";
  if (input.discountType !== "persen" && input.discountType !== "nominal") return "Jenis diskon tidak valid.";
  if (!isPositiveNumber(input.discountValue)) return "Nilai diskon harus lebih dari 0.";
  if (input.discountType === "persen" && input.discountValue > 100) return "Diskon persen maksimal 100%.";
  if (input.validUntil && !isIsoDate(input.validUntil)) return "Tanggal berlaku tidak valid.";
  if (input.status !== "aktif" && input.status !== "nonaktif") return "Status tidak valid.";
  if ((input.description ?? "").length > 200) return "Keterangan maksimal 200 karakter.";
  return null;
}

function normalize(input: PromoInput): PromoInput {
  return {
    ...input,
    code: normalizePromoCode(input.code),
    description: input.description.trim(),
    discountValue: input.discountType === "nominal" ? Math.round(input.discountValue) : input.discountValue,
  };
}

function revalidatePromo() {
  revalidatePath("/promo", "layout");
  revalidatePath("/pemasaran");
}

export async function createPromoAction(input: PromoInput): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const normalized = normalize(input);
  if (await getPromotionByCode(normalized.code).catch(() => null)) {
    return { error: `Kode "${normalized.code}" sudah dipakai promo lain.` };
  }
  try {
    await createPromotion(normalized);
  } catch {
    return { error: "Gagal menyimpan promo. Silakan coba lagi." };
  }
  revalidatePromo();
  return { success: true };
}

export async function updatePromoAction(id: string, input: PromoInput): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const normalized = normalize(input);
  const sameCode = await getPromotionByCode(normalized.code).catch(() => null);
  if (sameCode && sameCode.id !== id) return { error: `Kode "${normalized.code}" sudah dipakai promo lain.` };
  try {
    await updatePromotion(id, normalized);
  } catch {
    return { error: "Gagal memperbarui promo. Silakan coba lagi." };
  }
  revalidatePromo();
  return { success: true };
}

/** Promo yang sudah dipakai pesanan tidak dihapus agar riwayat diskon tetap jelas — nonaktifkan saja. */
export async function deletePromoAction(id: string): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const usage = await getPromotionUsage().catch(() => new Map());
  if (usage.get(id)?.orders) {
    return { error: "Promo ini sudah dipakai pesanan. Nonaktifkan saja agar riwayatnya tetap tersimpan." };
  }
  try {
    await deletePromotion(id);
  } catch {
    return { error: "Gagal menghapus promo. Silakan coba lagi." };
  }
  revalidatePromo();
  return { success: true };
}
