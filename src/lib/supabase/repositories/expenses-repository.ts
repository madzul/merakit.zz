import { createClient } from "@/lib/supabase/server";
import type { Transaction, TransactionType } from "@/lib/types";
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

export interface TransactionInput {
  description: string;
  category: string;
  amount: number;
  type: TransactionType;
  date: string;
}

/** Khusus admin — RLS menolak akses anggota sepenuhnya pada tabel ini. */
export async function getExpenses(): Promise<Transaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapExpense);
}

/** Transaksi dalam rentang tanggal (inklusif), terbaru di atas. */
export async function getExpensesBetween(from: string, to: string): Promise<Transaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapExpense);
}

export async function getExpenseById(id: string): Promise<Transaction | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("expenses").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapExpense(data) : null;
}

export async function createExpense(input: TransactionInput): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("expenses").insert({
    description: input.description,
    category: input.category,
    amount: input.amount,
    type: input.type,
    date: input.date,
    created_by: user?.id ?? null,
  });
  if (error) throw error;
}

export async function updateExpense(id: string, input: TransactionInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("expenses")
    .update({
      description: input.description,
      category: input.category,
      amount: input.amount,
      type: input.type,
      date: input.date,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}
