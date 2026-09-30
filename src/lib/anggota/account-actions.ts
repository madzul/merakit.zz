"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { getLoginAccounts, setMemberAccount } from "@/lib/supabase/repositories/accounts-repository";
import { getMemberById } from "@/lib/supabase/repositories/members-repository";
import type { ActionResult } from "@/lib/action-utils";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Hubungkan akun login ke data anggota (atau lepaskan bila `profileId` null).
 * Setelah terhubung, anggota bisa login dan mencatat produksinya sendiri.
 * Hanya admin. Satu akun hanya boleh untuk satu anggota (dicek di sini dan
 * ditegakkan indeks unik members_profile_id_unique).
 */
export async function linkMemberAccountAction(memberId: string, profileId: string | null): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Sesi tidak valid. Silakan login kembali." };
  if (profile.role !== "admin") return { error: "Hanya admin yang dapat menghubungkan akun login." };
  if (!UUID_PATTERN.test(memberId) || (profileId !== null && !UUID_PATTERN.test(profileId))) {
    return { error: "Data tidak valid." };
  }

  try {
    const member = await getMemberById(memberId);
    if (!member) return { error: "Anggota tidak ditemukan." };

    if (profileId) {
      const accounts = await getLoginAccounts();
      const account = accounts.find((item) => item.id === profileId);
      if (!account) return { error: "Akun login tidak ditemukan. Muat ulang halaman lalu coba lagi." };
      if (account.linkedMemberId && account.linkedMemberId !== memberId) {
        return { error: `Akun ${account.email} sudah terhubung ke anggota ${account.linkedMemberName}. Lepaskan dulu dari sana.` };
      }
    }

    await setMemberAccount(memberId, profileId);
  } catch {
    return { error: "Gagal menyimpan. Silakan coba lagi." };
  }

  revalidatePath("/dashboard/anggota", "layout");
  return { success: true };
}
