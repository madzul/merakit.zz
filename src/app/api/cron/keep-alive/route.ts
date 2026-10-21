import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Keep-alive Supabase — dipanggil Vercel Cron sekali sehari (lihat vercel.json).
 *
 * Project Supabase gratis otomatis di-pause setelah ±7 hari tanpa aktivitas
 * database. Route ini menjalankan satu query baca ringan ke tabel products
 * supaya project selalu tercatat aktif, walau aplikasi sedang sepi.
 *
 * Keamanan: bila env CRON_SECRET diisi, Vercel mengirim header
 * "Authorization: Bearer <CRON_SECRET>" dan permintaan lain ditolak 401.
 * Query hanya membaca 1 id produk — tidak mengubah data apa pun.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ ok: false, message: "Supabase env belum diisi" }, { status: 500 });
  }

  const startedAt = Date.now();
  const supabase = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await supabase.from("products").select("id").limit(1);

  if (error) {
    // Status 500 → tercatat gagal di Vercel (Project → Cron Jobs / Logs).
    console.error("[keep-alive] query Supabase gagal:", error.message);
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, at: new Date().toISOString(), ms: Date.now() - startedAt });
}
