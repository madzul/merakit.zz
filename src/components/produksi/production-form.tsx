"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircle, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCTION_STATUS_OPTIONS } from "@/lib/production-status";
import { createProductionAction, updateProductionAction } from "@/lib/produksi/actions";
import type { ProductionRecord, ProductionStatus } from "@/lib/types";

interface Option {
  id: string;
  name: string;
}

interface ProductionFormProps {
  /** Jika diisi, form berjalan dalam mode edit untuk catatan ini. */
  record?: ProductionRecord;
  products: Option[];
  /**
   * Daftar anggota untuk dipilih (khusus admin). `null` = pengguna anggota
   * biasa: kolom anggota disembunyikan karena selalu dicatat atas namanya sendiri.
   */
  members: Option[] | null;
}

interface FormValues {
  productionDate: string;
  memberId: string;
  productId: string;
  quantity: string;
  rejectQuantity: string;
  duration: string;
  notes: string;
  status: ProductionStatus;
}

interface FormErrors {
  productionDate?: string;
  memberId?: string;
  productId?: string;
  quantity?: string;
  rejectQuantity?: string;
  duration?: string;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function toFormValues(record?: ProductionRecord): FormValues {
  if (!record) {
    return {
      productionDate: todayIso(),
      memberId: "",
      productId: "",
      quantity: "",
      rejectQuantity: "0",
      duration: "",
      notes: "",
      status: "diajukan",
    };
  }
  return {
    productionDate: record.productionDate,
    memberId: record.memberId,
    productId: record.productId ?? "",
    quantity: String(record.quantity),
    rejectQuantity: String(record.rejectQuantity),
    duration: String(record.duration),
    notes: record.notes,
    status: record.status,
  };
}

const inputClassName =
  "w-full rounded-lg border bg-white py-2.5 px-3 text-sm text-neutral-800 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40";

export function ProductionForm({ record, products, members }: ProductionFormProps) {
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
    if (members && !values.memberId) {
      nextErrors.memberId = "Anggota wajib dipilih.";
    }
    if (!values.productId) {
      nextErrors.productId = "Produk wajib dipilih.";
    }

    const quantityNumber = Number(values.quantity);
    if (!values.quantity.trim()) {
      nextErrors.quantity = "Jumlah wajib diisi.";
    } else if (!Number.isInteger(quantityNumber) || quantityNumber <= 0) {
      nextErrors.quantity = "Jumlah harus berupa bilangan bulat lebih dari 0.";
    }

    const rejectNumber = values.rejectQuantity.trim() === "" ? 0 : Number(values.rejectQuantity);
    if (!Number.isInteger(rejectNumber) || rejectNumber < 0) {
      nextErrors.rejectQuantity = "Jumlah cacat harus bilangan bulat 0 atau lebih.";
    } else if (!nextErrors.quantity && rejectNumber > quantityNumber) {
      nextErrors.rejectQuantity = "Jumlah cacat tidak boleh melebihi jumlah produksi.";
    }

    const durationNumber = Number(values.duration);
    if (!values.duration.trim()) {
      nextErrors.duration = "Durasi wajib diisi.";
    } else if (!Number.isInteger(durationNumber) || durationNumber <= 0) {
      nextErrors.duration = "Durasi harus berupa bilangan bulat (jam) lebih dari 0.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
      memberId: members ? values.memberId : undefined,
      productId: values.productId,
      quantity: Number(values.quantity),
      rejectQuantity: values.rejectQuantity.trim() === "" ? 0 : Number(values.rejectQuantity),
      duration: Number(values.duration),
      notes: values.notes.trim(),
      status: values.status,
    };

    const result =
      isEditMode && record
        ? await updateProductionAction(record.id, payload)
        : await createProductionAction(payload);

    if (result.error) {
      setIsSubmitting(false);
      setSubmitError(result.error);
      return;
    }
    router.push("/produksi");
    router.refresh();
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

        {members && (
          <Field label="Anggota" htmlFor="memberId" error={errors.memberId}>
            <select
              id="memberId"
              value={values.memberId}
              onChange={(event) => setField("memberId", event.target.value)}
              aria-invalid={Boolean(errors.memberId)}
              className={cn(inputClassName, "pr-8", errors.memberId ? "border-danger-500" : "border-neutral-200 focus:border-primary-500")}
            >
              <option value="">Pilih anggota...</option>
              {members.map((memberOption) => (
                <option key={memberOption.id} value={memberOption.id}>
                  {memberOption.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Produk" htmlFor="productId" error={errors.productId}>
          <select
            id="productId"
            value={values.productId}
            onChange={(event) => setField("productId", event.target.value)}
            aria-invalid={Boolean(errors.productId)}
            className={cn(inputClassName, "pr-8", errors.productId ? "border-danger-500" : "border-neutral-200 focus:border-primary-500")}
          >
            <option value="">Pilih produk...</option>
            {products.map((productOption) => (
              <option key={productOption.id} value={productOption.id}>
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

        <Field label="Jumlah Cacat / Reject (pcs)" htmlFor="rejectQuantity" error={errors.rejectQuantity}>
          <input
            id="rejectQuantity"
            type="number"
            min={0}
            inputMode="numeric"
            value={values.rejectQuantity}
            onChange={(event) => setField("rejectQuantity", event.target.value)}
            placeholder="0"
            aria-invalid={Boolean(errors.rejectQuantity)}
            aria-describedby="rejectQuantity-hint"
            className={cn(inputClassName, errors.rejectQuantity ? "border-danger-500" : "border-neutral-200 focus:border-primary-500")}
          />
          {!errors.rejectQuantity && (
            <p id="rejectQuantity-hint" className="text-xs text-neutral-500">
              Produk yang ukurannya meleset atau rusak. Isi 0 bila semua layak jual.
            </p>
          )}
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
