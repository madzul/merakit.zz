"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Link2, LoaderCircle, Unlink } from "lucide-react";
import { linkMemberAccountAction } from "@/lib/anggota/account-actions";
import type { LoginAccount } from "@/lib/supabase/repositories/accounts-repository";

interface MemberAccountLinkProps {
  memberId: string;
  memberName: string;
  accounts: LoginAccount[];
}

/**
 * Kartu "Akun Login" di detail anggota (khusus admin): menampilkan akun yang
 * terhubung, dan memilih akun yang belum dipakai untuk dihubungkan.
 */
export function MemberAccountLink({ memberId, memberName, accounts }: MemberAccountLinkProps) {
  const router = useRouter();
  const linked = accounts.find((account) => account.linkedMemberId === memberId) ?? null;
  const available = accounts.filter((account) => !account.linkedMemberId);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function save(profileId: string | null) {
    setSaving(true);
    setError(null);
    setMessage(null);
    const result = await linkMemberAccountAction(memberId, profileId);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSelected("");
    setMessage(profileId ? `Akun terhubung. ${memberName} sekarang bisa login dan mencatat produksinya sendiri.` : "Akun dilepaskan.");
    router.refresh();
  }

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
            <p className="text-sm font-medium text-neutral-800">Terhubung ke {linked.email}</p>
            <p className="text-xs text-neutral-500">Peran: {linked.role === "admin" ? "Admin" : "Anggota"}</p>
          </div>
          <button
            type="button"
            onClick={() => save(null)}
            disabled={saving}
            className="flex flex-shrink-0 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
          >
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Unlink className="h-4 w-4" aria-hidden="true" />}
            Lepaskan
          </button>
        </div>
      ) : available.length > 0 ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="account" className="sr-only">
            Pilih akun login
          </label>
          <select
            id="account"
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 px-3 text-sm text-neutral-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          >
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
            onClick={() => save(selected)}
            disabled={!selected || saving}
            className="flex flex-shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60"
          >
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
            Hubungkan
          </button>
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
          Belum ada akun login yang bisa dihubungkan. Buat akunnya dulu di Supabase: <b>Authentication → Users → Add user</b>{" "}
          (isi email, lalu kirim undangan atau buat kata sandi), kemudian muat ulang halaman ini.
        </p>
      )}

      {!linked && available.length > 0 && (
        <p className="mt-2 text-xs text-neutral-500">
          Akun baru dibuat di Supabase: Authentication → Users → Add user. Setelah itu akun muncul di daftar ini.
        </p>
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
