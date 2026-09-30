"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, Recycle, Trash2 } from "lucide-react";
import { createLeftoverAction, deleteLeftoverAction, updateLeftoverStatusAction } from "@/lib/bahan-baku/leftover-actions";
import { LEFTOVER_STATUS_BADGE, LEFTOVER_STATUS_LABELS, LEFTOVER_UNITS, summarizeLeftovers } from "@/lib/bahan-baku/leftovers";
import { formatQuantity } from "@/lib/bahan-baku/constants";
import { cn, formatDate } from "@/lib/utils";
import type { LeftoverStatus, MaterialLeftover } from "@/lib/types";

interface LeftoverManagerProps {
  leftovers: MaterialLeftover[];
  materials: { id: string; name: string }[];
  currentProfileId: string;
  isAdmin: boolean;
  defaultDate: string;
}

const STATUSES = Object.keys(LEFTOVER_STATUS_LABELS) as LeftoverStatus[];

const inputClassName =
  "w-full rounded-lg border border-neutral-200 bg-white py-2.5 px-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40";

export function LeftoverManager({ leftovers, materials, currentProfileId, isAdmin, defaultDate }: LeftoverManagerProps) {
  const router = useRouter();
  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<string>("gram");
  const [date, setDate] = useState(defaultDate);
  const [status, setStatus] = useState<LeftoverStatus>("disimpan");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const summary = summarizeLeftovers(leftovers);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const amount = Number(quantity.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Jumlah sisa harus lebih dari 0.");
      return;
    }
    setSaving(true);
    const result = await createLeftoverAction({ materialId: materialId || null, quantity: amount, unit, date, status, notes });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setQuantity("");
    setNotes("");
    setMessage("Sisa bahan tercatat.");
    router.refresh();
  }

  async function handleStatus(id: string, next: LeftoverStatus) {
    setBusyId(id);
    setError(null);
    const result = await updateLeftoverStatusAction(id, next);
    setBusyId(null);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    setError(null);
    const result = await deleteLeftoverAction(id);
    setBusyId(null);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Ringkasan per satuan */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card sm:p-6">
        <div className="flex items-start gap-3">
          <Recycle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-700" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold text-neutral-800">Ringkasan Bulan Ini</h2>
            <p className="mt-0.5 text-sm text-neutral-500">
              Proporsi sisa yang dimanfaatkan ulang menjadi indikator produksi yang bertanggung jawab (SDG 12).
            </p>
          </div>
        </div>
        {summary.length === 0 ? (
          <p className="mt-4 rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-500">Belum ada sisa bahan yang dicatat bulan ini.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summary.map((row) => (
              <div key={row.unit} className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Total sisa ({row.unit})</p>
                <p className="mt-1 text-2xl font-semibold text-neutral-800">
                  {formatQuantity(row.total)} {row.unit}
                </p>
                <p className="mt-1 text-sm font-medium text-success-600">{row.reusePercent.toLocaleString("id-ID")}% dimanfaatkan ulang</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Disimpan {formatQuantity(row.disimpan)} · Dimanfaatkan {formatQuantity(row.dimanfaatkan)} · Dibuang {formatQuantity(row.dibuang)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Form catat sisa */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card sm:p-6" noValidate>
        <h2 className="text-base font-semibold text-neutral-800">Catat Sisa Bahan</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-700">
            Bahan
            <select value={materialId} onChange={(event) => setMaterialId(event.target.value)} className={inputClassName}>
              <option value="">Campuran / lainnya</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-700">
              Jumlah
              <input
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="mis. 150"
                required
                className={inputClassName}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-700">
              Satuan
              <select value={unit} onChange={(event) => setUnit(event.target.value)} className={inputClassName}>
                {LEFTOVER_UNITS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-700">
            Tanggal
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required className={inputClassName} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-700">
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value as LeftoverStatus)} className={inputClassName}>
              {STATUSES.map((option) => (
                <option key={option} value={option}>
                  {LEFTOVER_STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-700 sm:col-span-2">
            Keterangan (opsional)
            <input
              type="text"
              maxLength={300}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="mis. potongan benang dari produksi syal, dijadikan gantungan kunci"
              className={inputClassName}
            />
          </label>
        </div>
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
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60"
          >
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            Simpan
          </button>
        </div>
      </form>

      {/* Daftar */}
      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-card">
        <h2 className="border-b border-neutral-100 px-5 py-4 text-base font-semibold text-neutral-800">Riwayat Bulan Ini</h2>
        {leftovers.length === 0 ? (
          <p className="px-5 py-6 text-sm text-neutral-500">Belum ada catatan.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {leftovers.map((leftover) => {
              const canEdit = isAdmin || leftover.createdBy === currentProfileId;
              const busy = busyId === leftover.id;
              return (
                <li key={leftover.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-800">
                      {formatQuantity(leftover.quantity)} {leftover.unit} · {leftover.materialName}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {formatDate(leftover.date)}
                      {leftover.createdByName ? ` · dicatat ${leftover.createdByName}` : ""}
                      {leftover.notes ? ` · ${leftover.notes}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {canEdit ? (
                      <select
                        aria-label={`Status sisa ${leftover.materialName}`}
                        value={leftover.status}
                        disabled={busy}
                        onChange={(event) => handleStatus(leftover.id, event.target.value as LeftoverStatus)}
                        className={cn("rounded-full border-0 px-3 py-1.5 text-xs font-medium", LEFTOVER_STATUS_BADGE[leftover.status])}
                      >
                        {STATUSES.map((option) => (
                          <option key={option} value={option}>
                            {LEFTOVER_STATUS_LABELS[option]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={cn("rounded-full px-3 py-1.5 text-xs font-medium", LEFTOVER_STATUS_BADGE[leftover.status])}>
                        {LEFTOVER_STATUS_LABELS[leftover.status]}
                      </span>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleDelete(leftover.id)}
                        disabled={busy}
                        aria-label={`Hapus catatan sisa ${leftover.materialName}`}
                        className="rounded-md p-1.5 text-neutral-500 hover:bg-danger-50 hover:text-danger-600 disabled:opacity-60"
                      >
                        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
