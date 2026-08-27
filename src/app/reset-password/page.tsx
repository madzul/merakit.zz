import Link from "next/link";
import { MerakitLogo } from "@/components/merakit-logo";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <MerakitLogo size="lg" />
          <h1 className="mt-4 text-xl font-semibold text-neutral-800 sm:text-2xl">Atur Ulang Password</h1>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-primary-50 p-5 sm:p-8">
          <div className="relative rounded-xl border border-neutral-200 bg-white p-6 shadow-card sm:p-7">
            {user ? (
              <ResetPasswordForm />
            ) : (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <p className="text-sm text-neutral-500">
                  Tautan reset password tidak valid atau sudah kedaluwarsa.
                </p>
                <Link href="/lupa-password" className="text-sm font-semibold text-primary-700 hover:underline">
                  Minta tautan baru
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
