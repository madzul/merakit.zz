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

export type PromoInput = Omit<Promo, "id">;

function toRow(input: PromoInput) {
  return {
    code: input.code,
    description: input.description || null,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    valid_until: input.validUntil || null,
    status: input.status,
  };
}

/** Admin & anggota bisa membaca; hanya admin bisa menulis (ditegakkan RLS). */
export async function getPromotions(): Promise<Promo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("promotions").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapPromo);
}

export async function getPromotionById(id: string): Promise<Promo | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("promotions").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapPromo(data) : null;
}

/** Kode promo disimpan huruf besar; pencarian tidak peka huruf besar/kecil. */
export async function getPromotionByCode(code: string): Promise<Promo | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("promotions").select("*").eq("code", code.trim().toUpperCase()).maybeSingle();
  if (error) throw error;
  return data ? mapPromo(data) : null;
}

export async function createPromotion(input: PromoInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("promotions").insert(toRow(input));
  if (error) throw error;
}

export async function updatePromotion(id: string, input: PromoInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("promotions").update(toRow(input)).eq("id", id);
  if (error) throw error;
}

export async function deletePromotion(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("promotions").delete().eq("id", id);
  if (error) throw error;
}

/** Ringkasan pemakaian tiap promo: jumlah pesanan & total potongan (pesanan tidak dibatalkan). */
export async function getPromotionUsage(): Promise<Map<string, { orders: number; discount: number }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("promotion_id, discount_amount, status")
    .not("promotion_id", "is", null);
  if (error) throw error;
  const usage = new Map<string, { orders: number; discount: number }>();
  for (const row of data ?? []) {
    if (!row.promotion_id || row.status === "Dibatalkan") continue;
    const entry = usage.get(row.promotion_id) ?? { orders: 0, discount: 0 };
    entry.orders += 1;
    entry.discount += Number(row.discount_amount ?? 0);
    usage.set(row.promotion_id, entry);
  }
  return usage;
}
