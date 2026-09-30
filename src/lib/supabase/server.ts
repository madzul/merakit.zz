import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { createFetchWithTimeout } from "./fetch-with-timeout";

const SUPABASE_TIMEOUT_MS = 10000;

/** Dipakai di Server Component, Server Action, atau Route Handler. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: createFetchWithTimeout(SUPABASE_TIMEOUT_MS) },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Diabaikan bila dipanggil dari Server Component (read-only).
            // Sesi tetap ter-refresh oleh middleware.ts pada setiap request.
          }
        },
      },
    }
  );
}
