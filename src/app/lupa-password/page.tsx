import type { Metadata } from "next";
import { MerakitLogo } from "@/components/merakit-logo";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Lupa Password — Sistem Informasi MERAKIT",
};

export default function LupaPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <MerakitLogo size="lg" />
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-primary-50 p-5 sm:p-8">
          <div className="relative rounded-xl border border-neutral-200 bg-white p-6 shadow-card sm:p-7">
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
