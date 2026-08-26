import { MEMBERS } from "@/lib/mock-data";
import type { Member } from "@/lib/types";

/**
 * Store data dummy in-memory untuk modul Data Anggota.
 *
 * Catatan: ini BUKAN state management global/backend sungguhan — hanya array
 * bertingkat modul (module-level) yang menyalin `MEMBERS` sebagai seed awal,
 * agar tambah/ubah/hapus data terasa nyata selama satu sesi pengguna tanpa
 * perlu database eksternal. Data akan kembali ke seed awal setiap kali
 * aplikasi di-reload penuh.
 */
let members: Member[] = [...MEMBERS];
let nextId = members.length + 1;

export function getMembers(): Member[] {
  return members;
}

export function getMemberById(id: string): Member | undefined {
  return members.find((member) => member.id === id);
}

export function addMember(input: Omit<Member, "id">): Member {
  const newMember: Member = { ...input, id: `mem-${nextId++}` };
  members = [newMember, ...members];
  return newMember;
}

export function updateMember(id: string, input: Omit<Member, "id">): Member | undefined {
  let updated: Member | undefined;
  members = members.map((member) => {
    if (member.id !== id) return member;
    updated = { ...input, id };
    return updated;
  });
  return updated;
}

export function deleteMember(id: string): void {
  members = members.filter((member) => member.id !== id);
}
