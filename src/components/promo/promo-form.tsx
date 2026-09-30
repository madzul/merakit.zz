"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircle, Save, X } from "lucide-react";
import { createPromoAction, updatePromoAction } from "@/lib/promo/actions";
import { normalizePromoCode } from "@/lib/promo/logic";
import { cn } from "@/lib/utils";
import type { Promo } from "@/lib/types";

const inputClassName =
  "w-full rounded-lg border border-neutral-200 bg-white py-2.5 px-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40";

export function PromoForm({ promo }: { promo?: Promo }) {
  const router = useRouter();
  const [code, setCode] = useState(promo?.code ?? "");
  const [description, setDescription] = useState(promo?.description ?? "");
  const [discountType, setDiscountType] = useState<"persen" | "nominal">(promo?.discountType ?? "persen");
  const [discountValue, setDiscountValue] = useState(promo ? String(promo.discountValue) : "");
  const [validUntil, setValidUntil] = useState(promo?.validUntil ?? "");
  const [active, setActive] = useState(promo ? promo.status === "aktif" : true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const value = Number(discountValue.replace(",", "."));
    if (!/^[A-Z0-9-]{3,20}$/.test(normalizePromoCode(code))) return setError("Kode promo 3–20 karakter: huruf, angka, atau tanda hubung.");
    if (!Number.isFinite(value) || value <= 0) return setError("Nilai diskon harus lebih dari 0.");
    if (discountType === "persen" && value > 100) return setError("Diskon persen maksimal 100%.");

    setSaving(true);
    const payload = {
      code,
      description,
      discountType,
      discountValue: value,
      validUntil,
      status: active ? ("aktif" as const) : ("nonaktif" as const),
    };
    const result = promo ? await updatePromoAction(promo.id, payload) : await createPromoAction(payload);
    setSaving(false);
    if (result.error) return setError(result.error);
    router.push("/promo");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-xl border border-neutral-200 bg-white p-5 shadow-card sm:p-6">
      {error && (
        <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="code" className="text-sm font-medium text-neutral-700">Kode Promo</label>
          <input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={20} placeholder="mis. HARIRAJUT" className={cn(inputClassName, "font-mono uppercase")} />
          <p className="text-xs text-neutral-500">Dibagikan ke pelanggan, lalu diketik admin saat mencatat pesanan.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="validUntil" className="text-sm font-medium text-neutral-700">Berlaku sampai (opsional)</label>
          <input id="validUntil" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={inputClassName} />
          <p className="text-xs text-neutral-500">Setelah tanggal ini promo otomatis kedaluwarsa.</p>
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-neutral-700">Jenis Diskon</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:max-w-sm">
          {(["persen", "nominal"] as const).map((option) => (
            <label
              key={option}
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-semibold",
                discountType === option ? "border-primary-700 bg-primary-50 text-primary-700" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              )}
            >
              <input type="radio" name="discountType" value={option} checked={discountType === option} onChange={() => setDiscountType(option)} className="sr-only" />
              {option === "persen" ? "Persen (%)" : "Potongan (Rp)"}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5 sm:max-w-sm">
        <label htmlFor="discountValue" className="text-sm font-medium text-neutral-700">
          {discountType === "persen" ? "Besar diskon (%)" : "Besar potongan (Rp)"}
        </label>
        <input id="discountValue" type="number" min={0} step="any" inputMode="decimal" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountType === "persen" ? "mis. 10" : "mis. 15000"} className={inputClassName} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-neutral-700">Keterangan (opsional)</label>
        <input id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} placeholder="mis. Promo bazar Hari Batik di Binong" className={inputClassName} />
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 rounded border-neutral-300" />
        Promo aktif (bisa dipakai di pesanan baru)
      </label>

      <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-5 sm:flex-row sm:justify-end">
        <button type="button" onClick={() => router.back()} disabled={saving} className="flex items-center justify-center gap-2 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
          <X className="h-4 w-4" aria-hidden="true" />
          Batal
        </button>
        <button type="submit" disabled={saving} className="flex items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-70">
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </form>
  );
}
