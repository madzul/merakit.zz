"use client";

import { useActionState } from "react";
import { Search } from "lucide-react";
import { lookupOrderAction } from "@/lib/penjualan/public-actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40";

/** Cari pesanan dengan kode + nomor WhatsApp (keduanya harus cocok). */
export function OrderLookupForm() {
  const [state, formAction, pending] = useActionState(lookupOrderAction, {});
  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-sm font-medium text-neutral-700">
        Kode pesanan
        <input name="kode" required placeholder="MRK-261021-00001" autoCapitalize="characters" maxLength={30} className={inputClass} />
      </label>
      <label className="block text-sm font-medium text-neutral-700">
        Nomor WhatsApp saat memesan
        <input name="hp" required inputMode="tel" placeholder="08xxxxxxxxxx" maxLength={20} className={inputClass} />
      </label>
      {state.error && (
        <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-700 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        {pending ? "Mencari…" : "Lacak Pesanan"}
      </button>
    </form>
  );
}
