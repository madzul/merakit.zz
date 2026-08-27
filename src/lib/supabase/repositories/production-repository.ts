import { createClient } from "@/lib/supabase/server";
import { getCurrentMemberId } from "@/lib/supabase/repositories/members-repository";
import type { ProductionRecord } from "@/lib/types";
import type { Tables } from "@/lib/supabase/database.types";

type ProductionRow = Tables<"production_records"> & {
  members: { name: string } | null;
  products: { name: string } | null;
};

function mapProductionRecord(row: ProductionRow): ProductionRecord {
  return {
    id: row.id,
    productionDate: row.production_date,
    memberName: row.members?.name ?? "-",
    productName: row.products?.name ?? "-",
    quantity: row.quantity,
    duration: row.duration,
    status: row.status,
    notes: row.notes ?? "",
  };
}

/** Admin: seluruh catatan. Anggota: hanya catatan miliknya sendiri (dibatasi RLS). */
export async function getProductionRecords(): Promise<ProductionRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("production_records")
    .select("*, members(name), products(name)")
    .order("production_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapProductionRecord(row as ProductionRow));
}

/** member_id diambil dari sesi login, BUKAN dari input pengguna — mencegah spoofing. */
export async function addProductionRecord(input: {
  productId: string;
  productionDate: string;
  quantity: number;
  duration: number;
  notes: string;
}): Promise<void> {
  const supabase = await createClient();
  const memberId = await getCurrentMemberId();
  if (!memberId) throw new Error("Akun ini belum terhubung ke data anggota manapun.");

  const { error } = await supabase.from("production_records").insert({
    member_id: memberId,
    product_id: input.productId,
    production_date: input.productionDate,
    quantity: input.quantity,
    duration: input.duration,
    notes: input.notes,
  });
  if (error) throw error;
}

export async function updateProductionRecord(
  id: string,
  input: { productId: string; productionDate: string; quantity: number; duration: number; notes: string }
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("production_records")
    .update({
      product_id: input.productId,
      production_date: input.productionDate,
      quantity: input.quantity,
      duration: input.duration,
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
