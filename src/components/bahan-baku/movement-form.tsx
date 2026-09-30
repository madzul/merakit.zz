"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { recordMovementAction } from "@/lib/bahan-baku/actions";
import { MOVEMENT_TYPE_LABELS, formatQuantity } from "@/lib/bahan-baku/constants";
import { cn, formatRupiah } from "@/lib/utils";
import type { Material, MaterialMovementType } from "@/lib/types";

interface MovementFormProps {
  material: Material;
  today: string;
}

const inputClassName =
  "w-full rounded-lg border border-neutral-200 bg-white py-2.5 px-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40";

/** Catat stok masuk / keluar manual / penyesuaian (stok opname) untuk satu bahan. */
export function MovementForm({ material, today }: MovementFormProps) {
  const router = useRouter();
  const [type, setType] = useState<MaterialMovementType>("masuk");
  const [quantity, setQuantity] = useState("");
  const [countedStock, setCountedStock] = useState("");
  const [unitCost, setUnitCost] = useState(material.unitCost > 0 ? String(material.unitCost) : "");
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [recordExpense, setRecordExpense] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quantityNumber = Number(quantity.replace(",", "."));
  const unitCostNumber = Number(unitCost.replace(",", "."));
  const countedNumber = Number(countedStock.replace(",", "."));
  // Penyesuaian diisi sebagai "hasil hitung fisik"; selisihnya yang dicatat.
  const adjustment = countedStock.trim() === "" ? NaN : Math.round((countedNumber - material.stock) * 100) / 100;
  const purchaseTotal =
    type === "masuk" && Number.isFinite(quantityNumber) && Number.isFinite(unitCostNumber) ? quantityNumber * unitCostNumber : 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    let movementQuantity: number;
    if (type === "penyesuaian") {
      if (!Number.isFinite(countedNumber) || countedNumber < 0) return setError("Isi hasil hitung stok (angka 0 atau lebih).");
      if (!Number.isFinite(adjustment) || adjustment === 0) return setError("Hasil hitung sama dengan stok tercatat — tidak ada yang perlu disesuaikan.");
      movementQuantity = adjustment;
    } else {
      if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) return setError("Jumlah harus lebih dari 0.");
      movementQuantity = quantityNumber;
    }
    if (type === "masuk" && unitCost.trim() !== "" && (!Number.isFinite(unitCostNumber) || unitCostNumber < 0)) {
      return setError("Harga satuan tidak valid.");
    }

    setIsSubmitting(true);
    const result = await recordMovementAction({
      materialId: material.id,
      type,
      quantity: movementQuantity,
      unitCost: type === "masuk" && unitCost.trim() !== "" ? unitCostNumber : null,
      date,
      notes,
      recordExpense: type === "masuk" && recordExpense,
    });
    setIsSubmitting(false);

    if (result.error) return setError(result.error);
    setSuccess(
      type === "masuk" && recordExpense && purchaseTotal > 0
        ? `Stok tercatat & pengeluaran ${formatRupiah(purchaseTotal)} masuk ke Keuangan.`
        : "Stok berhasil dicatat."
    );
    setQuantity("");
    setCountedStock("");
    setNotes("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
      <h2 className="text-sm font-semibold text-neutral-800">Catat Stok</h2>

      {error && (
        <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="rounded-lg bg-success-50 px-3 py-2 text-sm text-success-600">
          {success}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="movement-type" className="text-sm font-medium text-neutral-700">
          Jenis
        </label>
        <select id="movement-type" value={type} onChange={(e) => setType(e.target.value as MaterialMovementType)} className={cn(inputClassName, "pr-8")}>
          {(Object.keys(MOVEMENT_TYPE_LABELS) as MaterialMovementType[]).map((option) => (
            <option key={option} value={option}>
              {MOVEMENT_TYPE_LABELS[option]}
            </option>
          ))}
        </select>
        {type === "keluar" && (
          <p className="text-xs text-neutral-500">
            Pemakaian untuk produksi sudah tercatat otomatis dari resep produk. Pakai ini hanya untuk pemakaian di luar produksi (rusak, contoh, dll).
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {type === "penyesuaian" ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="counted" className="text-sm font-medium text-neutral-700">
              Hasil hitung fisik ({material.unit})
            </label>
            <input id="counted" type="number" min={0} step="any" inputMode="decimal" value={countedStock} onChange={(e) => setCountedStock(e.target.value)} placeholder={formatQuantity(material.stock)} className={inputClassName} />
            {Number.isFinite(adjustment) && adjustment !== 0 && (
              <p className="text-xs text-neutral-500">
                Selisih {adjustment > 0 ? "+" : ""}
                {formatQuantity(adjustment)} {material.unit} dari stok tercatat {formatQuantity(material.stock)}.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="quantity" className="text-sm font-medium text-neutral-700">
              Jumlah ({material.unit})
            </label>
            <input id="quantity" type="number" min={0} step="any" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="mis. 10" className={inputClassName} />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="movement-date" className="text-sm font-medium text-neutral-700">
            Tanggal
          </label>
          <input id="movement-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClassName} />
        </div>
      </div>

      {type === "masuk" && (
        <div className="space-y-3 rounded-lg bg-neutral-50 p-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="unit-cost" className="text-sm font-medium text-neutral-700">
              Harga beli per {material.unit} (Rp)
            </label>
            <input id="unit-cost" type="number" min={0} step="any" inputMode="numeric" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} placeholder="kosongkan bila hibah/pemberian" className={inputClassName} />
            {purchaseTotal > 0 && <p className="text-xs text-neutral-500">Total pembelian {formatRupiah(purchaseTotal)}</p>}
          </div>
          <label className="flex items-start gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={recordExpense} onChange={(e) => setRecordExpense(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-neutral-300" />
            <span>Catat juga sebagai pengeluaran &quot;Bahan Baku&quot; di Keuangan</span>
          </label>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="movement-notes" className="text-sm font-medium text-neutral-700">
          Catatan (opsional)
        </label>
        <input id="movement-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={200} placeholder="mis. beli di Toko Benang Cigondewah" className={inputClassName} />
      </div>

      <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-70">
        {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
        {isSubmitting ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}
