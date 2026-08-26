"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircle, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MEMBERS, PRODUCTS } from "@/lib/mock-data";
import { PRODUCTION_STATUS_OPTIONS } from "@/lib/production-status";
import { addProductionRecord, updateProductionRecord } from "@/lib/production-store";
import type { ProductionRecord, ProductionStatus } from "@/lib/types";

interface ProductionFormProps {
  /** Jika diisi, form berjalan dalam mode edit untuk catatan ini. */
  record?: ProductionRecord;
}

interface FormValues {
  productionDate: string;
  memberName: string;
  productName: string;
  quantity: string;
  duration: string;
  notes: string;
  status: ProductionStatus;
}

interface FormErrors {
  productionDate?: string;
  memberName?: string;
  productName?: string;
  quantity?: string;
  duration?: string;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function toFormValues(record?: ProductionRecord): FormValues {
  if (!record) {
    return {
      productionDate: todayIso(),
      memberName: "",
      productName: "",
      quantity: "",
      duration: "",
      notes: "",
      status: "diajukan",
    };
  }
  return {
    productionDate: record.productionDate,
    memberName: record.memberName,
    productName: record.productName,
    quantity: String(record.quantity),
    duration: String(record.duration),
    notes: record.notes,
    status: record.status,
  };
}

const inputClassName =
  "w-full rounded-lg border bg-white py-2.5 px-3 text-sm text-neutral-800 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40";

export function ProductionForm({ record }: ProductionFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(record);

  const [values, setValues] = useState<FormValues>(() => toFormValues(record));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};

    if (!values.productionDate) {
      nextErrors.productionDate = "Tanggal produksi wajib diisi.";
    }
    if (!values.memberName.trim()) {
      nextErrors.memberName = "Anggota wajib dipilih.";
    }
    if (!values.productName.trim()) {
      nextErrors.productName = "Produk wajib dipilih.";
    }

    const quantityNumber = Number(values.quantity);
    if (!values.quantity.trim()) {
      nextErrors.quantity = "Jumlah wajib diisi.";
    } else if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) {
      nextErrors.quantity = "Jumlah harus berupa angka lebih dari 0.";
    }

    const durationNumber = Number(values.duration);
    if (!values.duration.trim()) {
      nextErrors.duration = "Durasi wajib diisi.";
    } else if (!Number.isFinite(durationNumber) || durationNumber <= 0) {
      nextErrors.duration = "Durasi harus berupa angka lebih dari 0.";
    }

    return nextErrors;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    const payload = {
      productionDate: values.productionDate,
      memberName: values.memberName,
      productName: values.productName,
      quantity: Number(values.quantity),
      duration: Number(values.duration),
      notes: values.notes.trim(),
      status: values.status,
    };

    // Simulasi proses penyimpanan — data dummy, belum terhubung backend/Supabase.
    window.setTimeout(() => {
      if (isEditMode && record) {
        const updated = updateProductionRecord(record.id, payload);
        if (!updated) {
          setIsSubmitting(false);
          setSubmitError("Catatan produksi tidak ditemukan. Mungkin sudah dihapus.");
          return;
        }
      } else {
        addProductionRecord(payload);
      }
      router.push("/produksi");
    }, 600);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-xl border border-neutral-200 bg-white p-5 shadow-card sm:p-6">
      {submitError && (
        <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
          {submitError}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Tanggal Produksi" htmlFor="productionDate" error={errors.productionDate}>
          <input
            id="productionDate"
            type="date"
            value={values.productionDate}
            onChange={(event) => setField("productionDate", event.target.value)}
            aria-invalid={Boolean(errors.productionDate)}
            className={cn(inputClassName, errors.productionDate ? "border-danger-500" : "border-neutral-200 focus:border-primary-500")}
          />
        </Field>

        <Field label="Anggota" htmlFor="memberName" error={errors.memberName}>
          <select
            id="memberName"
            value={values.memberName}
            onChange={(event) => setField("memberName", event.target.value)}
            aria-invalid={Boolean(errors.memberName)}
            className={cn(inputClassName, "pr-8", errors.memberName ? "border-danger-500" : "border-neutral-200 focus:border-primary-500")}
          >
            <option value="">Pilih anggota...</option>
            {MEMBERS.map((memberOption) => (
              <option key={memberOption.id} value={memberOption.name}>
                {memberOption.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Produk" htmlFor="productName" error={errors.productName}>
          <select
            id="productName"
            value={values.productName}
            onChange={(event) => setField("productName", event.target.value)}
            aria-invalid={Boolean(errors.productName)}
            className={cn(inputClassName, "pr-8", errors.productName ? "border-danger-500" : "border-neutral-200 focus:border-primary-500")}
          >
            <option value="">Pilih produk...</option>
            {PRODUCTS.map((productOption) => (
              <option key={productOption.id} value={productOption.name}>
                {productOption.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status" htmlFor="status">
          <select
            id="status"
            value={values.status}
            onChange={(event) => setField("status", event.target.value as ProductionStatus)}
            className={cn(inputClassName, "pr-8 border-neutral-200 focus:border-primary-500")}
          >
            {PRODUCTION_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Jumlah (pcs)" htmlFor="quantity" error={errors.quantity}>
          <input
            id="quantity"
            type="number"
            min={1}
            inputMode="numeric"
            value={values.quantity}
            onChange={(event) => setField("quantity", event.target.value)}
            placeholder="mis. 12"
            aria-invalid={Boolean(errors.quantity)}
            className={cn(inputClassName, errors.quantity ? "border-danger-500" : "border-neutral-200 focus:border-primary-500")}
          />
        </Field>

        <Field label="Durasi (jam)" htmlFor="duration" error={errors.duration}>
          <input
            id="duration"
            type="number"
            min={1}
            inputMode="numeric"
            value={values.duration}
            onChange={(event) => setField("duration", event.target.value)}
            placeholder="mis. 4"
            aria-invalid={Boolean(errors.duration)}
            className={cn(inputClassName, errors.duration ? "border-danger-500" : "border-neutral-200 focus:border-primary-500")}
          />
        </Field>
      </div>

      <Field label="Catatan (opsional)" htmlFor="notes">
        <textarea
          id="notes"
          rows={3}
          value={values.notes}
          onChange={(event) => setField("notes", event.target.value)}
          placeholder="Catatan tambahan tentang produksi ini..."
          className={cn(inputClassName, "resize-none border-neutral-200 focus:border-primary-500")}
        />
      </Field>

      <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/produksi")}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-70"
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
