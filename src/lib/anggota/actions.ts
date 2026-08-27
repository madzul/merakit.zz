"use server";

import { revalidatePath } from "next/cache";
import {
  createMember,
  deleteMember,
  getCurrentMemberId,
  updateMember,
} from "@/lib/supabase/repositories/members-repository";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import type { Member } from "@/lib/types";

type ActionResult = { error?: string; success?: boolean };

/**
 * Field yang boleh diubah anggota biasa untuk profilnya sendiri lewat mode
 * "self" pada MemberForm. Status keanggotaan, tanggal bergabung, dan
 * keterangan/catatan pendampingan (data sensitif — lihat catatan privasi di
 * src/lib/types.ts) tetap hanya bisa diubah admin.
 */
type SelfEditableInput = Pick<Omit<Member, "id">, "name" | "phone" | "avatar">;

/** Hanya admin — ditegakkan di sini (pesan error jelas) & RLS members_insert_admin_only. */
export async function createMemberAction(input: Omit<Member, "id">): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return { error: "Hanya admin yang dapat menambah anggota baru." };
  }

  try {
    await createMember(input);
  } catch {
    return { error: "Gagal menyimpan data anggota. Silakan coba lagi." };
  }

  revalidatePath("/dashboard/anggota");
  return { success: true };
}

/**
 * Admin bisa mengubah data anggota mana pun (semua field). Anggota biasa
 * hanya bisa mengubah datanya sendiri, dan hanya field pada
 * `SelfEditableInput` — field lain (status, tanggal bergabung, keterangan
 * kebutuhan dukungan, catatan pendampingan) dipertahankan dari data lama,
 * bukan dari input form self-edit (yang memang tidak menampilkan field itu).
 */
export async function updateMemberAction(
  id: string,
  input: Omit<Member, "id">
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) {
    return { error: "Sesi tidak valid. Silakan login kembali." };
  }

  if (profile.role !== "admin") {
    const ownMemberId = await getCurrentMemberId();
    if (!ownMemberId || ownMemberId !== id) {
      return { error: "Anda hanya dapat mengubah profil Anda sendiri." };
    }
  }

  try {
    await updateMember(id, input);
  } catch {
    return { error: "Gagal memperbarui data anggota. Silakan coba lagi." };
  }

  revalidatePath("/dashboard/anggota");
  revalidatePath(`/dashboard/anggota/${id}`);
  return { success: true };
}

/** Bantu form self-edit: hanya kirim field yang memang boleh diubah anggota biasa. */
export async function updateOwnMemberAction(
  id: string,
  input: SelfEditableInput,
  currentMember: Member
): Promise<ActionResult> {
  return updateMemberAction(id, {
    ...currentMember,
    name: input.name,
    phone: input.phone,
    avatar: input.avatar,
  });
}

/** Hanya admin — ditegakkan di sini & RLS members_delete_admin_only. */
export async function deleteMemberAction(id: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return { error: "Hanya admin yang dapat menghapus anggota." };
  }

  try {
    await deleteMember(id);
  } catch {
    return { error: "Gagal menghapus data anggota. Silakan coba lagi." };
  }

  revalidatePath("/dashboard/anggota");
  return { success: true };
}
