import { createClient } from "@/lib/supabase/server";
import type { Promo } from "@/lib/types";
import type { Tables } from "@/lib/supabase/database.types";

function mapPromo(row: Tables<"promotions">): Promo {
  return {
    id: row.id,
    code: row.code,
    description: row.description ?? "",
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    validUntil: row.valid_until ?? "",
    status: row.status,
  };
}

/** Admin & anggota bisa membaca; hanya admin bisa menulis (ditegakkan RLS). */
export async function getPromotions(): Promise<Promo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("promotions").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapPromo);
}

export async function createPromotion(input: Omit<Promo, "id">): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("promotions").insert({
    code: input.code,
    description: input.description,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    valid_until: input.validUntil || null,
    status: input.status,
  });
  if (error) throw error;
}

export async function deletePromotion(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("promotions").delete().eq("id", id);
  if (error) throw error;
}
