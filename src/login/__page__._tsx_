import type { Metadata } from "next";
import { MerakitLogo } from "@/components/merakit-logo";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Masuk — Sistem Informasi MERAKIT",
  description: "Masuk ke Sistem Informasi MERAKIT.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <MerakitLogo size="lg" />
          <h1 className="mt-4 text-xl font-semibold text-neutral-800 sm:text-2xl">
            Sistem Informasi MERAKIT
          </h1>
          <p className="mt-2 max-w-sm text-sm text-neutral-500">
            Produksi, Manajemen Usaha, dan Pemasaran Produk Rajut Inklusif.
          </p>
        </div>

        {/* Panel dekoratif sage-green, meniru bingkai pada referensi desain */}
        <div className="relative overflow-hidden rounded-2xl bg-primary-50 p-5 sm:p-8">
          <svg
            className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 text-primary-200"
            viewBox="0 0 100 100"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M10 90C10 60 30 30 60 15"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path d="M25 55c6-4 14-4 20 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M40 32c6-4 14-4 20 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <svg
            className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 text-primary-200"
            viewBox="0 0 100 100"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M90 10C90 40 70 70 40 85"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path d="M75 45c-6-4-14-4-20 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M60 68c-6-4-14-4-20 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>

          <div className="relative rounded-xl border border-neutral-200 bg-white p-6 shadow-card sm:p-7">
            <LoginForm />
          </div>
        </div>

        <footer className="mt-6 text-center text-xs text-neutral-400">
          Sistem Informasi MERAKIT © 2024
        </footer>
      </div>
    </div>
  );
}
