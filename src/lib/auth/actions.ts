"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string; success?: boolean };

function mapAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "Email atau password salah.";
  }
  if (message.includes("Email not confirmed")) {
    return "Email belum dikonfirmasi. Periksa kotak masuk Anda.";
  }
  return "Terjadi kesalahan. Silakan coba lagi.";
}

/** Login email/password. */
export async function login(input: { email: string; password: string }): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }
  return { success: true };
}

/** Logout & arahkan kembali ke /login. */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Kirim email tautan reset password. */
export async function requestPasswordReset(input: { email: string }): Promise<ActionResult> {
  const supabase = await createClient();

  // Ambil origin dari header request agar tidak perlu env var tambahan
  // di luar NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  if (error) {
    return { error: "Gagal mengirim tautan reset password. Silakan coba lagi." };
  }
  return { success: true };
}

/** Set password baru (dipanggil dari halaman /reset-password setelah klik tautan email). */
export async function updatePassword(input: { password: string }): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi reset password tidak valid atau sudah kedaluwarsa. Silakan ulangi." };
  }

  const { error } = await supabase.auth.updateUser({ password: input.password });
  if (error) {
    return { error: "Gagal memperbarui password. Silakan coba lagi." };
  }
  return { success: true };
}
