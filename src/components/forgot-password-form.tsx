"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Mail, LoaderCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { requestPasswordReset } from "@/lib/auth/actions";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      setError("Email wajib diisi.");
      return;
    }

    setError(undefined);
    setIsSubmitting(true);
    const result = await requestPasswordReset({ email });
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setIsSent(true);
  }

  if (isSent) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="h-10 w-10 text-success-500" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-neutral-800">Periksa email Anda</h2>
        <p className="max-w-xs text-sm text-neutral-500">
          Jika email <span className="font-medium">{email}</span> terdaftar, kami telah mengirim tautan untuk mengatur ulang password.
        </p>
        <Link href="/login" className="mt-2 text-sm font-semibold text-primary-700 hover:text-primary-800 hover:underline">
          Kembali ke halaman login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-neutral-800">Lupa Password</h2>
      <p className="mb-5 text-sm text-neutral-500">
        Masukkan email akun Anda. Kami akan mengirimkan tautan untuk mengatur ulang password.
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="sr-only">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(error)}
              placeholder="Email terdaftar"
              className={cn(
                "w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-800 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40",
                error ? "border-danger-500" : "border-neutral-200 focus:border-primary-500"
              )}
            />
          </div>
          {error && <p role="alert" className="text-xs text-danger-600">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Mengirim...
            </>
          ) : (
            "Kirim Tautan Reset"
          )}
        </button>

        <Link href="/login" className="text-center text-sm font-medium text-primary-700 hover:text-primary-800 hover:underline">
          Kembali ke Login
        </Link>
      </form>
    </div>
  );
}
