"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { getLoginAccounts, setMemberAccount, updateProfileRole } from "@/lib/supabase/repositories/accounts-repository";
import { getMemberById } from "@/lib/supabase/repositories/members-repository";
import { createAdminClient } from "@/lib/supabase/admin";
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Buat akun login baru untuk anggota lalu langsung hubungkan. Kata sandi
 * sementara ditentukan admin dan disampaikan langsung ke anggota; anggota
 * menggantinya sendiri lewat menu "Ganti kata sandi". Akun dibuat sudah
 * terkonfirmasi dengan peran "anggota" (app_metadata, tidak bisa diubah
 * pengguna). Butuh env server SUPABASE_SERVICE_ROLE_KEY.
 */
export async function createMemberAccountAction(
  memberId: string,
  input: { email: string; password: string }
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Sesi tidak valid. Silakan login kembali." };
  if (profile.role !== "admin") return { error: "Hanya admin yang dapat membuat akun login." };

  const admin = createAdminClient();
  if (!admin) {
    return { error: "Fitur buat akun belum aktif: isi env SUPABASE_SERVICE_ROLE_KEY di Vercel, lalu redeploy." };
  }

  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!UUID_PATTERN.test(memberId)) return { error: "Data tidak valid." };
  if (!EMAIL_PATTERN.test(email) || email.length > 254) return { error: "Format email tidak valid." };
  if (password.length < 8 || password.length > 72) return { error: "Kata sandi sementara minimal 8 karakter." };

  const { data: member, error: memberError } = await admin
    .from("members")
    .select("id, name, avatar, profile_id")
    .eq("id", memberId)
    .maybeSingle();
  if (memberError) return { error: "Gagal memeriksa data anggota. Silakan coba lagi." };
  if (!member) return { error: "Anggota tidak ditemukan." };
  if (member.profile_id) return { error: "Anggota ini sudah punya akun login. Lepaskan dulu bila ingin membuat yang baru." };

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "anggota" },
    user_metadata: { name: member.name, avatar_initial: member.avatar ?? undefined },
  });
  if (createError || !created.user) {
    const message = createError?.message ?? "";
    if (/already|registered|exists/i.test(message)) {
      return { error: "Email ini sudah terdaftar. Pilih akun tersebut di daftar \"akun yang belum terhubung\"." };
    }
    if (/password/i.test(message)) return { error: "Kata sandi ditolak Supabase. Gunakan kata sandi yang lebih kuat." };
    return { error: "Gagal membuat akun. Silakan coba lagi." };
  }

  // Hubungkan; bila gagal, hapus lagi akunnya agar tidak ada akun yatim.
  const { data: linked, error: linkError } = await admin
    .from("members")
    .update({ profile_id: created.user.id })
    .eq("id", memberId)
    .is("profile_id", null)
    .select("id");
  if (linkError || !linked || linked.length === 0) {
    await admin.auth.admin.deleteUser(created.user.id).catch(() => undefined);
    return { error: "Akun dibuat tetapi gagal dihubungkan, sehingga dibatalkan. Silakan coba lagi." };
  }

  revalidatePath("/dashboard/anggota", "layout");
  return { success: true };
}

/**
 * Ubah peran akun (admin ↔ anggota). Hanya admin; admin tidak bisa
 * menurunkan perannya sendiri, dan minimal satu admin harus tersisa.
 */
export async function setAccountRoleAction(profileId: string, role: "admin" | "anggota"): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Sesi tidak valid. Silakan login kembali." };
  if (profile.role !== "admin") return { error: "Hanya admin yang dapat mengubah peran akun." };
  if (!UUID_PATTERN.test(profileId) || (role !== "admin" && role !== "anggota")) return { error: "Data tidak valid." };
  if (role === "anggota" && profileId === profile.id) {
    return { error: "Anda tidak bisa menurunkan peran akun Anda sendiri. Minta admin lain melakukannya." };
  }

  const accounts = await getLoginAccounts().catch(() => null);
  if (!accounts) return { error: "Gagal memuat daftar akun. Silakan coba lagi." };
  const target = accounts.find((account) => account.id === profileId);
  if (!target) return { error: "Akun tidak ditemukan." };
  if (role === "anggota" && accounts.filter((account) => account.role === "admin").length <= 1) {
    return { error: "Minimal harus ada satu admin." };
  }

  try {
    await updateProfileRole(profileId, role);
  } catch {
    return { error: "Gagal mengubah peran. Silakan coba lagi." };
  }
  // Samakan app_metadata (bila service role tersedia) agar konsisten dengan profil.
  await createAdminClient()?.auth.admin.updateUserById(profileId, { app_metadata: { role } }).catch(() => undefined);

  revalidatePath("/dashboard/anggota", "layout");
  return { success: true };
}
