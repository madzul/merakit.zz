import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import type { LeftoverStatus, MaterialLeftover } from "@/lib/types";

type LeftoverRow = Tables<"material_leftovers"> & {
  materials: { name: string } | null;
  profiles: { name: string } | null;
};

const SELECT_WITH_RELATIONS = "*, materials(name), profiles(name)";

function mapLeftover(row: LeftoverRow): MaterialLeftover {
  return {
    id: row.id,
    materialId: row.material_id,
    materialName: row.materials?.name ?? "Campuran",
    quantity: Number(row.quantity),
    unit: row.unit,
    date: row.leftover_date,
    status: row.status,
    notes: row.notes ?? "",
    createdBy: row.created_by,
    createdByName: row.profiles?.name ?? "",
  };
}

export interface LeftoverInput {
  materialId: string | null;
  quantity: number;
  unit: string;
  date: string;
  status: LeftoverStatus;
  notes: string;
}

/** Sisa bahan dalam rentang tanggal (inklusif), terbaru di atas. Semua staf bisa membaca (RLS). */
export async function getLeftoversBetween(from: string, to: string): Promise<MaterialLeftover[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("material_leftovers")
    .select(SELECT_WITH_RELATIONS)
    .gte("leftover_date", from)
    .lte("leftover_date", to)
    .order("leftover_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as LeftoverRow[]).map(mapLeftover);
}

export async function getLeftoverById(id: string): Promise<MaterialLeftover | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("material_leftovers").select(SELECT_WITH_RELATIONS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapLeftover(data as unknown as LeftoverRow) : null;
}

/** created_by diisi otomatis oleh database (auth.uid()). */
export async function createLeftover(input: LeftoverInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("material_leftovers").insert({
    material_id: input.materialId,
    quantity: input.quantity,
    unit: input.unit,
    leftover_date: input.date,
    status: input.status,
    notes: input.notes || null,
  });
  if (error) throw error;
}

/** RLS: admin semua baris, anggota hanya catatannya sendiri. */
export async function updateLeftoverStatus(id: string, status: LeftoverStatus): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("material_leftovers").update({ status }).eq("id", id).select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Catatan tidak ditemukan atau bukan milik Anda.");
}

export async function deleteLeftover(id: string): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("material_leftovers").delete().eq("id", id).select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Catatan tidak ditemukan atau bukan milik Anda.");
}
