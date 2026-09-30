import { createClient } from "@/lib/supabase/server";
import type { ProductionRecord, ProductionStatus } from "@/lib/types";
import type { Tables } from "@/lib/supabase/database.types";

type ProductionRow = Tables<"production_records"> & {
  members: { name: string } | null;
  products: { name: string } | null;
};

const SELECT_WITH_RELATIONS = "*, members(name), products(name)";

function mapProductionRecord(row: ProductionRow): ProductionRecord {
  return {
    id: row.id,
    productionDate: row.production_date,
    memberId: row.member_id,
    memberName: row.members?.name ?? "-",
    productId: row.product_id,
    productName: row.products?.name ?? "-",
    quantity: row.quantity,
    duration: row.duration,
    status: row.status,
    notes: row.notes ?? "",
  };
}

export interface ProductionInput {
  memberId: string;
  productId: string;
  productionDate: string;
  quantity: number;
  duration: number;
  status: ProductionStatus;
  notes: string;
}

/** Admin: seluruh catatan. Anggota: hanya catatan miliknya sendiri (dibatasi RLS). */
export async function getProductionRecords(): Promise<ProductionRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("production_records")
    .select(SELECT_WITH_RELATIONS)
    .order("production_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapProductionRecord(row as ProductionRow));
}

/** Catatan produksi dalam rentang tanggal (inklusif) — dipakai dashboard. */
export async function getProductionRecordsBetween(from: string, to: string): Promise<ProductionRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("production_records")
    .select(SELECT_WITH_RELATIONS)
    .gte("production_date", from)
    .lte("production_date", to)
    .order("production_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapProductionRecord(row as ProductionRow));
}

export async function getProductionRecordsByMember(memberId: string): Promise<ProductionRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("production_records")
    .select(SELECT_WITH_RELATIONS)
    .eq("member_id", memberId)
    .order("production_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapProductionRecord(row as ProductionRow));
}

export async function getProductionRecordById(id: string): Promise<ProductionRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("production_records")
    .select(SELECT_WITH_RELATIONS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProductionRecord(data as ProductionRow) : null;
}

/**
 * `memberId` WAJIB sudah divalidasi pemanggil (server action): anggota biasa
 * hanya boleh memakai member_id miliknya sendiri. RLS
 * production_insert_admin_or_own menegakkan hal yang sama di database.
 */
export async function createProductionRecord(input: ProductionInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("production_records").insert({
    member_id: input.memberId,
    product_id: input.productId,
    production_date: input.productionDate,
    quantity: input.quantity,
    duration: input.duration,
    status: input.status,
    notes: input.notes,
  });
  if (error) throw error;
}

export async function updateProductionRecord(id: string, input: ProductionInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("production_records")
    .update({
      member_id: input.memberId,
      product_id: input.productId,
      production_date: input.productionDate,
      quantity: input.quantity,
      duration: input.duration,
      status: input.status,
      notes: input.notes,
    })
    .eq("id", id); // RLS memastikan anggota hanya bisa mengubah baris miliknya sendiri.
  if (error) throw error;
}

export async function deleteProductionRecord(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("production_records").delete().eq("id", id);
  if (error) throw error;
}
