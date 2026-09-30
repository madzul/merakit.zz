"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { saveProductRecipeAction } from "@/lib/bahan-baku/actions";
import { formatQuantity, materialCostPerUnit } from "@/lib/bahan-baku/constants";
import { cn, formatRupiah } from "@/lib/utils";
import type { Material, ProductMaterial } from "@/lib/types";

interface ProductRecipeProps {
  productId: string;
  price: number;
  recipe: ProductMaterial[];
  /** Bahan yang bisa dipilih (khusus admin). `null` = tampilan baca-saja. */
  materials: Material[] | null;
}

interface RowState {
  key: number;
  materialId: string;
  quantity: string;
}

const inputClassName =
  "w-full rounded-lg border border-neutral-200 bg-white py-2 px-3 text-sm text-neutral-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40";

/**
 * Resep bahan per 1 pcs produk + HPP bahan & margin. Resep dipakai sistem
 * untuk mencatat pemakaian bahan otomatis setiap kali produksi dicatat.
 */
export function ProductRecipe({ productId, price, recipe, materials }: ProductRecipeProps) {
  const router = useRouter();
  const canEdit = materials !== null;
  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState<RowState[]>(() =>
    recipe.map((row, index) => ({ key: index, materialId: row.materialId, quantity: String(row.quantityPerUnit) }))
  );
  const [nextKey, setNextKey] = useState(recipe.length);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const materialById = useMemo(() => new Map((materials ?? []).map((material) => [material.id, material])), [materials]);

  // Saat mengedit, HPP dihitung dari isian form; selain itu dari resep tersimpan.
  const effectiveRecipe = editing
    ? rows
        .map((row) => {
          const material = materialById.get(row.materialId);
          const quantity = Number(row.quantity.replace(",", "."));
          return material && Number.isFinite(quantity) && quantity > 0 ? { quantityPerUnit: quantity, unitCost: material.unitCost } : null;
        })
        .filter((row): row is { quantityPerUnit: number; unitCost: number } => row !== null)
    : recipe;
  const hpp = materialCostPerUnit(effectiveRecipe);
  const margin = price - hpp;
  const marginPercent = price > 0 ? Math.round((margin / price) * 100) : 0;
  const hasMissingCost = !editing && recipe.some((row) => row.unitCost <= 0);

  function updateRow(key: number, patch: Partial<RowState>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((current) => [...current, { key: nextKey, materialId: "", quantity: "" }]);
    setNextKey((key) => key + 1);
  }

  function cancelEdit() {
    setRows(recipe.map((row, index) => ({ key: index, materialId: row.materialId, quantity: String(row.quantityPerUnit) })));
    setError(null);
    setEditing(false);
  }

  async function save() {
    setError(null);
    const payload = rows
      .filter((row) => row.materialId || row.quantity.trim())
      .map((row) => ({ materialId: row.materialId, quantityPerUnit: Number(row.quantity.replace(",", ".")) }));
    setSaving(true);
    const result = await saveProductRecipeAction(productId, payload);
    setSaving(false);
    if (result.error) return setError(result.error);
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-800">Resep Bahan & HPP</h3>
          <p className="mt-1 text-xs text-neutral-500">
            Kebutuhan bahan untuk 1 pcs. Setiap catatan produksi otomatis mengurangi stok bahan sesuai resep ini.
          </p>
        </div>
        {canEdit && !editing && (
          <button type="button" onClick={() => setEditing(true)} className="flex-shrink-0 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
            {recipe.length === 0 ? "Atur Resep" : "Ubah Resep"}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
          {error}
        </p>
      )}

      {editing ? (
        <div className="mt-4 space-y-3">
          {(materials ?? []).length === 0 ? (
            <p className="text-sm text-neutral-500">
              Belum ada bahan baku. <Link href="/bahan-baku/tambah" className="font-medium text-primary-700 hover:underline">Tambah bahan</Link> dulu.
            </p>
          ) : (
            <>
              {rows.map((row) => {
                const material = materialById.get(row.materialId);
                return (
                  <div key={row.key} className="grid grid-cols-[1fr_7rem_auto] items-end gap-2">
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`bahan-${row.key}`} className="text-xs font-medium text-neutral-600">Bahan</label>
                      <select id={`bahan-${row.key}`} value={row.materialId} onChange={(e) => updateRow(row.key, { materialId: e.target.value })} className={cn(inputClassName, "pr-8")}>
                        <option value="">Pilih bahan...</option>
                        {(materials ?? [])
                          .filter((option) => option.isActive || option.id === row.materialId)
                          .map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name} ({option.unit})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`qty-${row.key}`} className="text-xs font-medium text-neutral-600">
                        Per pcs{material ? ` (${material.unit})` : ""}
                      </label>
                      <input id={`qty-${row.key}`} type="number" min={0} step="any" inputMode="decimal" value={row.quantity} onChange={(e) => updateRow(row.key, { quantity: e.target.value })} placeholder="mis. 1,5" className={inputClassName} />
                    </div>
                    <button type="button" onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))} aria-label="Hapus baris" className="mb-0.5 rounded-md p-2 text-neutral-400 hover:bg-danger-50 hover:text-danger-600">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
              <button type="button" onClick={addRow} className="flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:underline">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Tambah bahan
              </button>
            </>
          )}
          <div className="flex justify-end gap-2 border-t border-neutral-100 pt-3">
            <button type="button" onClick={cancelEdit} disabled={saving} className="rounded-lg border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              Batal
            </button>
            <button type="button" onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-primary-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-70">
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
              Simpan Resep
            </button>
          </div>
        </div>
      ) : recipe.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">
          Resep belum diatur — HPP belum bisa dihitung dan produksi produk ini belum mengurangi stok bahan.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-neutral-100 text-sm">
          {recipe.map((row) => (
            <li key={row.materialId} className="flex justify-between gap-3 py-2">
              <span className="text-neutral-700">
                {row.materialName} · {formatQuantity(row.quantityPerUnit)} {row.unit}
              </span>
              <span className="text-neutral-800">{row.unitCost > 0 ? formatRupiah(row.quantityPerUnit * row.unitCost) : "harga belum diisi"}</span>
            </li>
          ))}
        </ul>
      )}

      {(recipe.length > 0 || editing) && (
        <dl className="mt-4 grid grid-cols-3 gap-3 rounded-lg bg-neutral-50 p-3 text-center">
          <div>
            <dt className="text-xs text-neutral-500">HPP bahan / pcs</dt>
            <dd className="mt-0.5 text-sm font-semibold text-neutral-800">{formatRupiah(Math.round(hpp))}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">Harga jual</dt>
            <dd className="mt-0.5 text-sm font-semibold text-neutral-800">{formatRupiah(price)}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">Margin</dt>
            <dd className={cn("mt-0.5 text-sm font-semibold", margin >= 0 ? "text-success-600" : "text-danger-600")}>
              {margin < 0 ? "−" : ""}
              {formatRupiah(Math.round(Math.abs(margin)))} ({marginPercent}%)
            </dd>
          </div>
        </dl>
      )}
      {hasMissingCost && (
        <p className="mt-2 text-xs text-warning-600">Sebagian bahan belum punya harga, sehingga HPP di atas lebih rendah dari seharusnya.</p>
      )}
      <p className="mt-2 text-xs text-neutral-400">HPP ini hanya biaya bahan (belum termasuk upah & overhead), memakai harga beli terakhir.</p>
    </div>
  );
}
