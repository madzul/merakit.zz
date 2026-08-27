import { createClient } from "@/lib/supabase/server";
import type { Transaction } from "@/lib/types";
import type { Tables } from "@/lib/supabase/database.types";

function mapExpense(row: Tables<"expenses">): Transaction {
  return {
    id: row.id,
    description: row.description,
    category: row.category,
    amount: Number(row.amount),
    type: row.type,
    date: row.date,
  };
}

/** Khusus admin — RLS menolak akses anggota sepenuhnya pada tabel ini. */
export async function getExpenses(): Promise<Transaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("expenses").select("*").order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapExpense);
}

export async function createExpense(input: Omit<Transaction, "id">): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert({
    description: input.description,
    category: input.category,
    amount: input.amount,
    type: input.type,
    date: input.date,
  });
  if (error) throw error;
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}
