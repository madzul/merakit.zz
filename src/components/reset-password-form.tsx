"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock, LoaderCircle } from "lucide-react";
import { updatePassword } from "@/lib/auth/actions";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setError(undefined);
    setIsSubmitting(true);
    const result = await updatePassword({ password });
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="rounded-lg bg-danger-50 p-3 text-center text-sm text-danger-600">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-password" className="sr-only">Password Baru</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password baru"
            className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-800 placeholder:text-neutral-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm-password" className="sr-only">Konfirmasi Password</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Konfirmasi password baru"
            className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-800 placeholder:text-neutral-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            Menyimpan...
          </>
        ) : (
          "Simpan Password Baru"
        )}
      </button>
    </form>
  );
}
