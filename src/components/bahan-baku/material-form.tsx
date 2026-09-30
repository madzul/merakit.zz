"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircle, Save, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { createMaterialAction, deleteMaterialAction, updateMaterialAction } from "@/lib/bahan-baku/actions";
import { MATERIAL_UNITS } from "@/lib/bahan-baku/constants";
import { cn } from "@/lib/utils";
import type { Material } from "@/lib/types";

interface MaterialFormProps {
  material?: Material;
}

const inputClassName =
  "w-full rounded-lg border border-neutral-200 bg-white py-2.5 px-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40";

function toNumber(value: string): number {
  return value.trim() === "" ? 0 : Number(value.replace(",", "."));
}

/** Form tambah/edit bahan baku (khusus admin). Stok diubah lewat "Catat Stok", bukan di sini. */
export function MaterialForm({ material }: MaterialFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(material);

  const [name, setName] = useState(material?.name ?? "");
  const [unit, setUnit] = useState(material?.unit ?? "gulung");
  const [minStock, setMinStock] = useState(material ? String(material.minStock) : "");
  const [unitCost, setUnitCost] = useState(material ? String(material.unitCost) : "");
  const [initialStock, setInitialStock] = useState("");
  const [notes, setNotes] = useState(material?.notes ?? "");
  const [isActive, setIsActive] = useState(material?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const unitOptions = (MATERIAL_UNITS as readonly string[]).includes(unit) ? MATERIAL_UNITS : [unit, ...MATERIAL_UNITS];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const numbers = { minStock: toNumber(minStock), unitCost: toNumber(unitCost), initialStock: toNumber(initialStock) };
    if (!name.trim()) return setError("Nama bahan wajib diisi.");
    if (Object.values(numbers).some((value) => !Number.isFinite(value) || value < 0)) {
      return setError("Stok minimum, harga, dan stok awal harus angka 0 atau lebih.");
    }

    setIsSubmitting(true);
    const payload = { name, unit, minStock: numbers.minStock, unitCost: numbers.unitCost, notes, isActive };
    const result =
      isEditMode && material
        ? await updateMaterialAction(material.id, payload)
        : await createMaterialAction({ ...payload, initialStock: numbers.initialStock });

    if (result.error) {
      setIsSubmitting(false);
      setError(result.error);
      return;
    }
    const targetId = material?.id ?? ("id" in result ? result.id : undefined);
    router.push(targetId ? `/bahan-baku/${targetId}` : "/bahan-baku");
    router.refresh();
  }

  async function handleDelete() {
    if (!material) return;
    setDeleting(true);
    const result = await deleteMaterialAction(material.id);
    setDeleting(false);
    setConfirmDelete(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/bahan-baku");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-xl border border-neutral-200 bg-white p-5 shadow-card sm:p-6">
      {error && (
        <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="name" className="text-sm font-medium text-neutral-700">
            Nama Bahan
          </label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="mis. Benang Katun Susu" className={inputClassName} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="unit" className="text-sm font-medium text-neutral-700">
            Satuan
          </label>
          <select id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} className={cn(inputClassName, "pr-8")}>
            {unitOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="minStock" className="text-sm font-medium text-neutral-700">
            Stok Minimum ({unit})
          </label>
          <input id="minStock" type="number" min={0} step="any" inputMode="decimal" value={minStock} onChange={(e) => setMinStock(e.target.value)} placeholder="mis. 5" className={inputClassName} />
          <p className="text-xs text-neutral-500">Di bawah angka ini bahan ditandai &quot;menipis&quot;.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="unitCost" className="text-sm font-medium text-neutral-700">
            Harga per {unit} (Rp)
          </label>
          <input id="unitCost" type="number" min={0} step="any" inputMode="numeric" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} placeholder="mis. 25000" className={inputClassName} />
          <p className="text-xs text-neutral-500">Dipakai untuk HPP. Diperbarui otomatis saat mencatat pembelian.</p>
        </div>
        {!isEditMode && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="initialStock" className="text-sm font-medium text-neutral-700">
              Stok Awal ({unit})
            </label>
            <input id="initialStock" type="number" min={0} step="any" inputMode="decimal" value={initialStock} onChange={(e) => setInitialStock(e.target.value)} placeholder="mis. 12" className={inputClassName} />
            <p className="text-xs text-neutral-500">Jumlah yang ada di gudang saat ini.</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-neutral-700">
          Catatan (opsional)
        </label>
        <textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="mis. warna, merek, pemasok" className={cn(inputClassName, "resize-none")} />
      </div>

      {isEditMode && (
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-neutral-300" />
          Bahan aktif (tampil di pilihan resep & daftar stok)
        </label>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-5 sm:flex-row sm:justify-between">
        {isEditMode ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex items-center justify-center gap-2 rounded-lg border border-danger-200 px-4 py-2.5 text-sm font-medium text-danger-600 hover:bg-danger-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Hapus Bahan
          </button>
        ) : (
          <span />
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <button type="button" onClick={() => router.back()} disabled={isSubmitting} className="flex items-center justify-center gap-2 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
            <X className="h-4 w-4" aria-hidden="true" />
            Batal
          </button>
          <button type="submit" disabled={isSubmitting} className="flex items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-70">
            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Hapus bahan baku?"
        description="Hanya bahan yang belum punya riwayat stok dan tidak dipakai resep yang bisa dihapus. Selain itu, nonaktifkan saja."
        confirmLabel="Ya, Hapus"
        tone="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setConfirmDelete(false)}
      />
    </form>
  );
}
