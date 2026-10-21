"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { updateShippingZoneAction } from "@/lib/penjualan/actions";
import type { ShippingZone } from "@/lib/types";

/** Ubah tarif ongkir flat per wilayah & aktif/nonaktifkan pengiriman ke wilayah tertentu. */
export function ShippingZonesCard({ zones }: { zones: ShippingZone[] }) {
  const router = useRouter();
  const { toast, showToast, dismissToast } = useToast();
  const [drafts, setDrafts] = useState(() => Object.fromEntries(zones.map((zone) => [zone.id, { cost: String(zone.cost), isActive: zone.isActive }])));
  const [savingId, setSavingId] = useState<string | null>(null);

  async function save(zone: ShippingZone) {
    const draft = drafts[zone.id];
    setSavingId(zone.id);
    const result = await updateShippingZoneAction(zone.id, Number(draft.cost), draft.isActive);
    setSavingId(null);
    if (result.error) return showToast(result.error, "danger");
    showToast(`Tarif ${zone.label} disimpan.`, "success");
    router.refresh();
  }

  return (
    <details className="rounded-xl border border-neutral-200 bg-white shadow-card">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-neutral-800">Tarif Ongkir per Wilayah</summary>
      <div className="border-t border-neutral-100 px-4 py-3">
        <p className="mb-3 text-xs text-neutral-500">
          Ongkir flat per pesanan, ditentukan otomatis dari kota/kabupaten di alamat pembeli. Alamat di luar daftar memakai
          wilayah terdekat. Nonaktifkan wilayah bila sementara tidak melayani pengiriman ke sana.
        </p>
        <ul className="divide-y divide-neutral-100">
          {zones.map((zone) => {
            const draft = drafts[zone.id];
            const changed = Number(draft.cost) !== zone.cost || draft.isActive !== zone.isActive;
            return (
              <li key={zone.id} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-neutral-700">{zone.label}</span>
                <div className="flex items-center gap-2">
                  <label className="sr-only" htmlFor={`ongkir-${zone.id}`}>Tarif {zone.label}</label>
                  <div className="flex items-center rounded-lg border border-neutral-200 pl-2.5 text-sm">
                    <span className="text-neutral-400">Rp</span>
                    <input
                      id={`ongkir-${zone.id}`}
                      type="number"
                      min={0}
                      step={1000}
                      value={draft.cost}
                      onChange={(e) => setDrafts((d) => ({ ...d, [zone.id]: { ...d[zone.id], cost: e.target.value } }))}
                      className="w-24 rounded-r-lg px-2 py-1.5 focus:outline-none"
                    />
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                    <input
                      type="checkbox"
                      checked={draft.isActive}
                      onChange={(e) => setDrafts((d) => ({ ...d, [zone.id]: { ...d[zone.id], isActive: e.target.checked } }))}
                    />
                    Aktif
                  </label>
                  <button
                    type="button"
                    disabled={!changed || savingId === zone.id}
                    onClick={() => save(zone)}
                    className="rounded-lg bg-primary-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-800 disabled:opacity-40"
                  >
                    {savingId === zone.id ? "…" : "Simpan"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </details>
  );
}
