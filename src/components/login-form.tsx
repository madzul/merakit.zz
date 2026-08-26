"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Lock, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormErrors {
  identifier?: string;
  password?: string;
}

/**
 * Form login MERAKIT.
 * Autentikasi masih simulasi: tidak ada pemanggilan database/backend.
 * Jika kedua field terisi, pengguna diarahkan ke /dashboard.
 */
export function LoginForm() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};
    if (!identifier.trim()) {
      nextErrors.identifier = "Username atau email wajib diisi.";
    }
    if (!password) {
      nextErrors.password = "Password wajib diisi.";
    }
    return nextErrors;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    // Simulasi proses login — belum terhubung ke database/backend sungguhan.
    window.setTimeout(() => {
      router.push("/dashboard");
    }, 600);
  }

  return (
    <div>
      <h2 className="mb-5 text-lg font-semibold text-neutral-800">LOGIN</h2>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="identifier" className="sr-only">
            Username atau Email
          </label>
          <div className="relative">
            <User
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden="true"
            />
            <input
              id="identifier"
              name="identifier"
              type="text"
              inputMode="email"
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              aria-invalid={Boolean(errors.identifier)}
              aria-describedby={errors.identifier ? "identifier-error" : undefined}
              placeholder="Username atau Email"
              className={cn(
                "w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-800 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40",
                errors.identifier ? "border-danger-500" : "border-neutral-200 focus:border-primary-500"
              )}
            />
          </div>
          {errors.identifier && (
            <p id="identifier-error" role="alert" className="text-xs text-danger-600">
              {errors.identifier}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden="true"
            />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              placeholder="Password"
              className={cn(
                "w-full rounded-lg border bg-white py-2.5 pl-10 pr-10 text-sm text-neutral-800 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40",
                errors.password ? "border-danger-500" : "border-neutral-200 focus:border-primary-500"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              aria-pressed={showPassword}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" role="alert" className="text-xs text-danger-600">
              {errors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Memproses...
            </>
          ) : (
            "LOGIN"
          )}
        </button>

        <Link
          href="/lupa-password"
          className="text-center text-sm font-medium text-primary-700 hover:text-primary-800 hover:underline"
        >
          Lupa Password?
        </Link>

        <p className="text-center text-sm text-neutral-500">
          Belum punya akun?{" "}
          <Link href="/daftar" className="font-semibold text-primary-700 hover:text-primary-800 hover:underline">
            Buat akun baru
          </Link>
        </p>
      </form>
    </div>
  );
}
