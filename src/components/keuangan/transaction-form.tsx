"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircle, Save, X } from "lucide-react";
import { createTransactionAction, updateTransactionAction } from "@/lib/keuangan/actions";
import { TRANSACTION_CATEGORIES, TRANSACTION_TYPE_LABELS } from "@/lib/keuangan/constants";
import { cn, formatRupiah } from "@/lib/utils";
import type { Transaction, TransactionType } from "@/lib/types";

interface TransactionFormProps {
  transaction?: Transaction;
  /** Tanggal awal untuk transaksi baru (YYYY-MM-DD). */
  defaultDate: string;
}

interface FormErrors {
  date?: string;
  description?: string;
  category?: string;
  amount?: string;
}

const inputClassName =
  "w-full rounded-lg border bg-white py-2.5 px-3 text-sm text-neutral-800 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40";

/** Form catat/edit transaksi kas (pemasukan atau pengeluaran). */
export function TransactionForm({ transaction, defaultDate }: TransactionFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(transaction);

  const [type, setType] = useState<TransactionType>(transaction?.type ?? "pengeluaran");
  const [date, setDate] = useState(transaction?.date ?? defaultDate);
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [category, setCategory] = useState(transaction?.category ?? "");
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Kategori lama di luar daftar saran tetap bisa dipertahankan saat edit.
  const categoryOptions = TRANSACTION_CATEGORIES[type].includes(category) || !category
    ? TRANSACTION_CATEGORIES[type]
    : [category, ...TRANSACTION_CATEGORIES[type]];

  const amountNumber = Number(amount);

  function handleTypeChange(nextType: TransactionType) {
    setType(nextType);
    if (!TRANSACTION_CATEGORIES[nextType].includes(category)) setCategory("");
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};
    if (!date) nextErrors.date = "Tanggal wajib diisi.";
    if (!description.trim()) nextErrors.description = "Keterangan wajib diisi.";
    else if (description.trim().length > 200) nextErrors.description = "Keterangan maksimal 200 karakter.";
    if (!category) nextErrors.category = "Kategori wajib dipilih.";
    if (!amount.trim()) nextErrors.amount = "Jumlah wajib diisi.";
    else if (!Number.isFinite(amountNumber) || amountNumber <= 0) nextErrors.amount = "Jumlah harus angka lebih dari 0.";
    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    const payload = { type, date, description: description.trim(), category, amount: amountNumber };
    const result =
      isEditMode && transaction
        ? await updateTransactionAction(transaction.id, payload)
        : await createTransactionAction(payload);

    if (result.error) {
      setIsSubmitting(false);
      setSubmitError(result.error);
      return;
    }
    router.push(`/keuangan?bulan=${date.slice(0, 7)}&toast=${isEditMode ? "updated" : "created"}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5 rounded-xl border border-neutral-200 bg-white p-5 shadow-card sm:p-6"
    >
      {submitError && (
        <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
          {submitError}
        </p>
      )}

      <fieldset>
        <legend className="text-sm font-medium text-neutral-700">Jenis Transaksi</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(["pemasukan", "pengeluaran"] as const).map((option) => (
            <label
              key={option}
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-3 text-sm font-semibold transition-colors",
                type === option
                  ? option === "pemasukan"
                    ? "border-success-500 bg-success-50 text-success-600"
                    : "border-danger-500 bg-danger-50 text-danger-600"
                  : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              )}
            >
              <input
                type="radio"
                name="type"
                value={option}
                checked={type === option}
                onChange={() => handleTypeChange(option)}
                className="sr-only"
              />
              {TRANSACTION_TYPE_LABELS[option]}
            </label>
          ))}
        </div>
        {type === "pemasukan" && (
          <p className="mt-2 text-xs text-neutral-500">
            Penjualan dari pesanan berstatus &quot;Selesai&quot; sudah dihitung otomatis — tidak perlu dicatat di sini.
          </p>
        )}
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Tanggal" htmlFor="date" error={errors.date}>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            aria-invalid={Boolean(errors.date)}
            className={cn(inputClassName, errors.date ? "border-danger-500" : "border-neutral-200 focus:border-primary-500")}
          />
        </Field>

        <Field label="Kategori" htmlFor="category" error={errors.category}>
          <select
            id="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-invalid={Boolean(errors.category)}
            className={cn(inputClassName, "pr-8", errors.category ? "border-danger-500" : "border-neutral-200 focus:border-primary-500")}
          >
            <option value="">Pilih kategori...</option>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Keterangan" htmlFor="description" error={errors.description}>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={type === "pengeluaran" ? "mis. Beli benang katun 10 gulung" : "mis. Iuran bulanan anggota"}
          maxLength={200}
          aria-invalid={Boolean(errors.description)}
          className={cn(inputClassName, errors.description ? "border-danger-500" : "border-neutral-200 focus:border-primary-500")}
        />
      </Field>

      <Field label="Jumlah (Rp)" htmlFor="amount" error={errors.amount}>
        <input
          id="amount"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="mis. 150000"
          aria-invalid={Boolean(errors.amount)}
          className={cn(inputClassName, errors.amount ? "border-danger-500" : "border-neutral-200 focus:border-primary-500")}
        />
        {Number.isFinite(amountNumber) && amountNumber > 0 && (
          <p className="text-xs text-neutral-500">{formatRupiah(amountNumber)}</p>
        )}
      </Field>

      <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" aria-hidden="true" />
              Simpan
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
