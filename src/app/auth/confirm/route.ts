import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Route Handler untuk callback verifikasi email Supabase (link "lupa
 * password" & konfirmasi email mengarah ke sini via NEXT_PUBLIC_SITE_URL).
 *
 * PENTING: Route Handler App Router hanya dikenali bila berada di dalam
 * folder `src/app`. Sebelumnya berkas ini keliru diletakkan di
 * `src/lib/auth/confirm/route.ts` sehingga Next.js tidak pernah
 * mendaftarkannya sebagai endpoint `/auth/confirm` — tautan reset password
 * dari email akan selalu 404. Pastikan URL callback ini didaftarkan sebagai
 * Redirect URL di Supabase Auth settings (lihat README.md).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/reset-password";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      const redirectTo = request.nextUrl.clone();
      redirectTo.pathname = next;
      redirectTo.search = "";
      return NextResponse.redirect(redirectTo);
    }
  }

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = "/login";
  redirectTo.search = "";
  redirectTo.searchParams.set("error", "Tautan tidak valid atau sudah kedaluwarsa.");
  return NextResponse.redirect(redirectTo);
}
