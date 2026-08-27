import { createClient } from "@/lib/supabase/server";
import type { Member } from "@/lib/types";
import type { Tables } from "@/lib/supabase/database.types";

function mapMember(row: Tables<"members">): Member {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    avatar: row.avatar ?? row.name.slice(0, 2).toUpperCase(),
    disabilityDescription: row.disability_description ?? "",
    monthlyProduction: row.monthly_production,
    status: row.status,
    joinedAt: row.joined_at,
    notes: row.notes ?? "",
  };
}

/** Admin: semua anggota. Anggota: hanya datanya sendiri (dibatasi RLS). */
export async function getMembers(): Promise<Member[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("members").select("*").order("joined_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapMember);
}

export async function getMemberById(id: string): Promise<Member | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("members").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapMember(data) : null;
}

/** Hanya admin — ditegakkan RLS (members_insert_admin_only, dst). */
export async function createMember(input: Omit<Member, "id">): Promise<Member> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .insert({
      name: input.name,
      phone: input.phone,
      avatar: input.avatar,
      disability_description: input.disabilityDescription,
      monthly_production: input.monthlyProduction,
      status: input.status,
      joined_at: input.joinedAt,
      notes: input.notes,
    })
    .select()
    .single();
  if (error) throw error;
  return mapMember(data);
}

export async function updateMember(id: string, input: Omit<Member, "id">): Promise<Member> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .update({
      name: input.name,
      phone: input.phone,
      avatar: input.avatar,
      disability_description: input.disabilityDescription,
      monthly_production: input.monthlyProduction,
      status: input.status,
      joined_at: input.joinedAt,
      notes: input.notes,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapMember(data);
}

export async function deleteMember(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) throw error;
}

/** Cari member_id milik pengguna yang sedang login (untuk modul produksi). */
export async function getCurrentMemberId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from("members").select("id").eq("profile_id", user.id).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}
