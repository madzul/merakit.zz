import { createClient } from "@/lib/supabase/server";

/** Akun login (profiles) beserta anggota yang sudah terhubung, bila ada. */
export interface LoginAccount {
  id: string;
  email: string;
  name: string;
  role: "admin" | "anggota";
  linkedMemberId: string | null;
  linkedMemberName: string | null;
}

/**
 * Semua akun login. Hanya admin yang bisa membaca seluruh baris profiles
 * (RLS profiles_select_own_or_admin); anggota biasa hanya mendapat akunnya
 * sendiri, jadi fungsi ini hanya dipakai di halaman khusus admin.
 */
export async function getLoginAccounts(): Promise<LoginAccount[]> {
  const supabase = await createClient();
  const [profilesResult, membersResult] = await Promise.all([
    supabase.from("profiles").select("id, email, name, role").order("email"),
    supabase.from("members").select("id, name, profile_id").not("profile_id", "is", null),
  ]);
  if (profilesResult.error) throw profilesResult.error;
  if (membersResult.error) throw membersResult.error;

  const memberByProfile = new Map((membersResult.data ?? []).map((member) => [member.profile_id, member]));
  return (profilesResult.data ?? []).map((profile) => {
    const member = memberByProfile.get(profile.id);
    return {
      id: profile.id,
      email: profile.email ?? "",
      name: profile.name ?? "",
      role: profile.role,
      linkedMemberId: member?.id ?? null,
      linkedMemberName: member?.name ?? null,
    };
  });
}

/** Menghubungkan (atau melepas, bila `profileId` null) akun login ke anggota. Hanya admin (RLS). */
export async function setMemberAccount(memberId: string, profileId: string | null): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .update({ profile_id: profileId })
    .eq("id", memberId)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Anggota tidak ditemukan atau tidak boleh diubah.");
}
