import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { createFetchWithTimeout } from "./fetch-with-timeout";

/**
 * Klien Supabase dengan service role — MELEWATI RLS. Hanya untuk server
 * action khusus admin yang sudah memeriksa peran pemanggil (lihat
 * src/lib/anggota/account-actions.ts). Jangan pernah diimpor dari komponen
 * client; paket "server-only" menggagalkan build bila itu terjadi.
 *
 * Mengembalikan null bila env SUPABASE_SERVICE_ROLE_KEY belum diisi, sehingga
 * fitur pembuatan akun dari aplikasi otomatis nonaktif.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: createFetchWithTimeout(10000) },
  });
}

export function isAccountCreationEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
