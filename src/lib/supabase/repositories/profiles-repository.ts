import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export async function getCurrentProfile(): Promise<Tables<"profiles"> | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw error;
  return data;
}
