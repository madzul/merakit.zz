"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, Link2, LoaderCircle, ShieldCheck, ShieldOff, Unlink, UserPlus } from "lucide-react";
import { createMemberAccountAction, linkMemberAccountAction, setAccountRoleAction } from "@/lib/anggota/account-actions";
import type { LoginAccount } from "@/lib/supabase/repositories/accounts-repository";

interface MemberAccountLinkProps {
  memberId: string;
  memberName: string;
  accounts: LoginAccount[];
  /** Id profil admin yang sedang login (tidak boleh menurunkan perannya sendiri). */
  currentProfileId: string;
  /** True bila env SUPABASE_SERVICE_ROLE_KEY terisi — admin bisa membuat akun dari sini. */
  canCreateAccount: boolean;
}

const inputClassName =
  "w-full rounded-lg border border-neutral-200 bg-white py-2.5 px-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40";

/**
 * Kartu "Akun Login" di detail anggota (khusus admin): buat akun baru, hubungkan
 * akun yang sudah ada, lepaskan, dan ubah peran admin/anggota.
 */
export function MemberAccountLink({ memberId, memberName, accounts, currentProfileId, canCreateAccount }: MemberAccountLinkProps) {
  const router = useRouter();
  const linked = accounts.find((account) => account.linkedMemberId === memberId) ?? null;
  const available = accounts.filter((account) => !account.linkedMemberId);
  const [selected, setSelected] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<null | "link" | "create" | "unlink" | "role">(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(kind: NonNullable<typeof busy>, action: () => Promise<{ error?: string }>, success: string) {
    setBusy(kind);
    setError(null);
    setMessage(null);
    const result = await action();
    setBusy(null);
    if (result.error) {
      setError(result.error);
      return false;
    }
    setMessage(success);
    router.refresh();
    return true;
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      setError("Kata sandi sementara minimal 8 karakter.");
      return;
    }
    const ok = await run(
      "create",
      () => createMemberAccountAction(memberId, { email, password }),
      `Akun ${email.trim().toLowerCase()} dibuat dan terhubung. Sampaikan kata sandi sementara langsung ke ${memberName}, lalu minta ia menggantinya lewat menu "Ganti kata sandi".`
    );
    if (ok) {
      setEmail("");
      setPassword("");
      setShowPassword(false);
    }
  }

  const isSelf = linked?.id === currentProfileId;

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-700" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-neutral-800">Akun Login</h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            Anggota yang terhubung ke akun bisa login, mencatat, dan melihat produksinya sendiri.
          </p>
        </div>
      </div>

      {linked ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg bg-success-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-800">Terhubung ke {linked.email}</p>
            <p className="text-xs text-neutral-500">Peran: {linked.role === "admin" ? "Admin (pengurus)" : "Anggota"}</p>
          </div>
          <div className="flex flex-shrink-0 flex-wrap gap-2">
            {!(isSelf && linked.role === "admin") && (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() =>
                  run(
                    "role",
                    () => setAccountRoleAction(linked.id, linked.role === "admin" ? "anggota" : "admin"),
                    linked.role === "admin" ? `${memberName} sekarang berperan anggota.` : `${memberName} sekarang berperan admin.`
                  )
                }
                className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
              >
                {busy === "role" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : linked.role === "admin" ? (
                  <ShieldOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                )}
                {linked.role === "admin" ? "Jadikan anggota" : "Jadikan admin"}
              </button>
            )}
            <button
              type="button"
              onClick={() => run("unlink", () => linkMemberAccountAction(memberId, null), "Akun dilepaskan.")}
              disabled={busy !== null}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              {busy === "unlink" ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Unlink className="h-4 w-4" aria-hidden="true" />}
              Lepaskan
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          {canCreateAccount ? (
            <form onSubmit={handleCreate} className="space-y-3" noValidate>
              <h3 className="text-sm font-semibold text-neutral-800">Buat akun baru</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-700">
                  Email
                  <input
                    type="email"
                    autoComplete="off"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="mis. nama@merakit.id"
                    required
                    className={inputClassName}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-700">
                  Kata sandi sementara
                  <span className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      minLength={8}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="minimal 8 karakter"
                      required
                      className={`${inputClassName} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-neutral-500 hover:text-neutral-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </span>
                </label>
              </div>
              <p className="text-xs text-neutral-500">
                Akun langsung aktif dengan peran anggota. Sampaikan kata sandi sementara langsung (bukan lewat grup), lalu minta
                anggota menggantinya lewat menu &ldquo;Ganti kata sandi&rdquo; setelah login pertama.
              </p>
              <button
                type="submit"
                disabled={busy !== null || !email.trim() || !password}
                className="flex items-center gap-1.5 rounded-lg bg-primary-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60"
              >
                {busy === "create" ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
                Buat & hubungkan
              </button>
            </form>
          ) : (
            <p className="rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
              Membuat akun dari aplikasi belum aktif (pengelola teknis perlu mengisi env <code>SUPABASE_SERVICE_ROLE_KEY</code> di
              Vercel). Sementara itu, buat akun di Supabase: <b>Authentication → Users → Add user</b>, lalu pilih di bawah.
            </p>
          )}

          {available.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-neutral-800">Atau hubungkan akun yang sudah ada</h3>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label htmlFor="account" className="sr-only">
                  Pilih akun login
                </label>
                <select id="account" value={selected} onChange={(event) => setSelected(event.target.value)} className={inputClassName}>
                  <option value="">Pilih akun yang belum terhubung…</option>
                  {available.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.email}
                      {account.role === "admin" ? " (admin)" : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    run("link", () => linkMemberAccountAction(memberId, selected), `Akun terhubung. ${memberName} sekarang bisa login dan mencatat produksinya sendiri.`).then(
                      (ok) => ok && setSelected("")
                    )
                  }
                  disabled={!selected || busy !== null}
                  className="flex flex-shrink-0 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                >
                  {busy === "link" ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
                  Hubungkan
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger-600">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-3 text-sm text-success-600">
          {message}
        </p>
      )}
    </section>
  );
}
