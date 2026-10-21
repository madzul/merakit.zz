"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { updateShippingZoneAction } from "@/lib/penjualan/actions";
import type { ShippingZone } from "@/lib/types";

type Draft = { cost: string; extraPerKg: string; isActive: boolean };

/**
 * Ubah tarif ongkir per wilayah: tarif 1 kg pertama + tarif tiap kg
 * berikutnya, serta aktif/nonaktifkan pengiriman ke wilayah tertentu.
 */
export function ShippingZonesCard({ zones }: { zones: ShippingZone[] }) {
  const router = useRouter();
  const { toast, showToast, dismissToast } = useToast();
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(
      zones.map((zone) => [zone.id, { cost: String(zone.cost), extraPerKg: String(zone.extraPerKg), isActive: zone.isActive }])
    )
  );
  const [savingId, setSavingId] = useState<string | null>(null);

  function setDraft(id: string, patch: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  async function save(zone: ShippingZone) {
    const draft = drafts[zone.id];
    setSavingId(zone.id);
    const result = await updateShippingZoneAction(zone.id, Number(draft.cost), Number(draft.extraPerKg), draft.isActive);
    setSavingId(null);
    if (result.error) return showToast(result.error, "danger");
    showToast(`Tarif ${zone.label} disimpan.`, "success");
    router.refresh();
  }

  const moneyInput = (id: string, label: string, value: string, onChange: (value: string) => void) => (
    <label className="flex items-center rounded-lg border border-neutral-200 pl-2.5 text-sm">
      <span className="sr-only">{label}</span>
      <span className="text-neutral-400">Rp</span>
      <input
        id={id}
        type="number"
        min={0}
        step={1000}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 rounded-r-lg px-2 py-1.5 focus:outline-none"
      />
    </label>
  );

  return (
    <details className="rounded-xl border border-neutral-200 bg-white shadow-card">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-neutral-800">Tarif Ongkir per Wilayah</summary>
      <div className="border-t border-neutral-100 px-4 py-3">
        <p className="mb-3 text-xs text-neutral-500">
          Ongkir = tarif 1 kg pertama + (kg ditagih − 1) × tarif per kg berikutnya. Kg ditagih = total berat produk (kosong = 500
          g/pcs) dibulatkan ke atas bila sisa lebih dari 0,3 kg, minimal 1 kg. Wilayah ditentukan otomatis dari kota/kabupaten di
          alamat; alamat di luar daftar memakai wilayah terdekat. Nonaktifkan wilayah bila sementara tidak melayani pengiriman ke sana.
        </p>
        <div className="mb-1 hidden grid-cols-[1fr_auto_auto_auto_auto] gap-2 text-xs font-medium text-neutral-400 sm:grid">
          <span>Wilayah</span>
          <span className="w-[8.5rem]">1 kg pertama</span>
          <span className="w-[8.5rem]">Per kg berikutnya</span>
          <span className="w-14" />
          <span className="w-16" />
        </div>
        <ul className="divide-y divide-neutral-100">
          {zones.map((zone) => {
            const draft = drafts[zone.id];
            const changed =
              Number(draft.cost) !== zone.cost || Number(draft.extraPerKg) !== zone.extraPerKg || draft.isActive !== zone.isActive;
            return (
              <li key={zone.id} className="flex flex-col gap-2 py-2.5 sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-center">
                <span className="text-sm text-neutral-700">{zone.label}</span>
                {moneyInput(`ongkir-${zone.id}`, `Tarif 1 kg pertama ${zone.label}`, draft.cost, (value) => setDraft(zone.id, { cost: value }))}
                {moneyInput(`ongkir-kg-${zone.id}`, `Tarif per kg berikutnya ${zone.label}`, draft.extraPerKg, (value) =>
                  setDraft(zone.id, { extraPerKg: value })
                )}
                <label className="flex w-14 items-center gap-1.5 text-xs text-neutral-600">
                  <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft(zone.id, { isActive: e.target.checked })} />
                  Aktif
                </label>
                <button
                  type="button"
                  disabled={!changed || savingId === zone.id}
                  onClick={() => save(zone)}
                  className="w-16 rounded-lg bg-primary-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-800 disabled:opacity-40"
                >
                  {savingId === zone.id ? "…" : "Simpan"}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </details>
  );
}
