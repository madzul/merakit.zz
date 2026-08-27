"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircle, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MEMBER_STATUS_OPTIONS } from "@/lib/member-status";
import { createMemberAction, updateMemberAction, updateOwnMemberAction } from "@/lib/anggota/actions";
import type { Member, MemberStatus } from "@/lib/types";

interface MemberFormProps {
  /** Jika diisi, form berjalan dalam mode edit untuk anggota ini. */
  member?: Member;
  /**
   * "admin" (default): semua field bisa diisi/diubah, dipakai untuk tambah
   * anggota baru atau admin mengedit anggota mana pun.
   * "self": anggota biasa mengedit profilnya sendiri — hanya field Nama &
   * Nomor Telepon yang ditampilkan; status keanggotaan, tanggal bergabung,
   * dan catatan pendampingan (data sensitif) tetap dari data lama, tidak
   * bisa diubah lewat mode ini (ditegakkan juga di updateOwnMemberAction).
   */
  mode?: "admin" | "self";
}

interface FormValues {
  name: string;
  phone: string;
  disabilityDescription: string;
  status: MemberStatus;
  joinedAt: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  joinedAt?: string;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function toFormValues(member?: Member): FormValues {
  if (!member) {
    return {
      name: "",
      phone: "",
      disabilityDescription: "",
      status: "aktif",
      joinedAt: todayIso(),
      notes: "",
    };
  }
  return {
    name: member.name,
    phone: member.phone,
    disabilityDescription: member.disabilityDescription,
    status: member.status,
    joinedAt: member.joinedAt,
    notes: member.notes,
  };
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AN";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const inputClassName =
  "w-full rounded-lg border bg-white py-2.5 px-3 text-sm text-neutral-800 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40";

/**
 * Form tambah/edit anggota. Mode "admin" (tambah baru / edit siapa saja)
 * menampilkan seluruh field, termasuk "Keterangan kebutuhan dukungan" &
 * "Catatan" yang bersifat sensitif — gunakan bahasa yang hormat dan tidak
 * stigmatis saat mengisi. Mode "self" (anggota biasa mengedit profilnya
 * sendiri) menyembunyikan field sensitif/administratif tersebut.
 */
export function MemberForm({ member, mode = "admin" }: MemberFormProps) {
  const isSelfMode = mode === "self";
  const router = useRouter();
  const isEditMode = Boolean(member);

  const [values, setValues] = useState<FormValues>(() => toFormValues(member));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};

    if (!values.name.trim()) {
      nextErrors.name = "Nama lengkap wajib diisi.";
    } else if (values.name.trim().length < 3) {
      nextErrors.name = "Nama lengkap minimal 3 karakter.";
    }

    const phoneDigits = values.phone.replace(/\D/g, "");
    if (!values.phone.trim()) {
      nextErrors.phone = "Nomor telepon/WhatsApp wajib diisi.";
    } else if (phoneDigits.length < 9 || phoneDigits.length > 15) {
      nextErrors.phone = "Nomor telepon/WhatsApp tidak valid.";
    }

    if (!values.joinedAt) {
      nextErrors.joinedAt = "Tanggal bergabung wajib diisi.";
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

    const name = values.name.trim();
    const phone = values.phone.replace(/\D/g, "");
    const avatar = member?.avatar ?? initialsFromName(values.name);

    const result =
      isEditMode && member
        ? isSelfMode
          ? await updateOwnMemberAction(member.id, { name, phone, avatar }, member)
          : await updateMemberAction(member.id, {
              name,
              phone,
              avatar,
              disabilityDescription: values.disabilityDescription.trim(),
              monthlyProduction: member.monthlyProduction,
              status: values.status,
              joinedAt: values.joinedAt,
              notes: values.notes.trim(),
            })
        : await createMemberAction({
            name,
            phone,
            avatar,
            disabilityDescription: values.disabilityDescription.trim(),
            monthlyProduction: 0,
            status: values.status,
            joinedAt: values.joinedAt,
            notes: values.notes.trim(),
          });

    if (result.error) {
      setIsSubmitting(false);
      setSubmitError(result.error);
      return;
    }

    router.push(isEditMode ? "/dashboard/anggota?toast=updated" : "/dashboard/anggota?toast=created");
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nama Lengkap" htmlFor="name" error={errors.name}>
          <input
            id="name"
            type="text"
            value={values.name}
            onChange={(event) => setField("name", event.target.value)}
            placeholder="mis. Rina Marlina"
            aria-invalid={Boolean(errors.name)}
            className={cn(inputClassName, errors.name ? "border-danger-500" : "border-neutral-200 focus:border-primary-500")}
          />
        </Field>

        <Field label="Nomor Telepon/WhatsApp" htmlFor="phone" error={errors.phone}>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            value={values.phone}
            onChange={(event) => setField("phone", event.target.value)}
            placeholder="mis. 081234567890"
            aria-invalid={Boolean(errors.phone)}
            className={cn(inputClassName, errors.phone ? "border-danger-500" : "border-neutral-200 focus:border-primary-500")}
          />
        </Field>

        {!isSelfMode && (
          <>
            <Field label="Status" htmlFor="status">
              <select
                id="status"
                value={values.status}
                onChange={(event) => setField("status", event.target.value as MemberStatus)}
                className={cn(inputClassName, "pr-8 border-neutral-200 focus:border-primary-500")}
              >
                {MEMBER_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Tanggal Bergabung" htmlFor="joinedAt" error={errors.joinedAt}>
              <input
                id="joinedAt"
                type="date"
                value={values.joinedAt}
                onChange={(event) => setField("joinedAt", event.target.value)}
                aria-invalid={Boolean(errors.joinedAt)}
                className={cn(
                  inputClassName,
                  errors.joinedAt ? "border-danger-500" : "border-neutral-200 focus:border-primary-500"
                )}
              />
            </Field>
          </>
        )}
      </div>

      {isSelfMode && (
        <p className="rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-700">
          Anda hanya dapat mengubah nama & nomor telepon/WhatsApp sendiri. Status keanggotaan dan
          catatan pendampingan dikelola oleh admin.
        </p>
      )}

      {!isSelfMode && (
        <>
          <Field
            label="Keterangan Kebutuhan Dukungan (opsional)"
            htmlFor="disabilityDescription"
            hint="Bersifat internal & sensitif — hanya terlihat di area admin. Gunakan bahasa yang hormat dan tidak stigmatis, fokus pada kebutuhan dukungan."
          >
            <textarea
              id="disabilityDescription"
              rows={3}
              value={values.disabilityDescription}
              onChange={(event) => setField("disabilityDescription", event.target.value)}
              placeholder="mis. Menggunakan kursi roda; membutuhkan meja kerja yang disesuaikan."
              className={cn(inputClassName, "resize-none border-neutral-200 focus:border-primary-500")}
            />
          </Field>

          <Field label="Catatan Pendampingan (opsional)" htmlFor="notes">
            <textarea
              id="notes"
              rows={3}
              value={values.notes}
              onChange={(event) => setField("notes", event.target.value)}
              placeholder="Catatan pengurus/pendamping mengenai anggota ini..."
              className={cn(inputClassName, "resize-none border-neutral-200 focus:border-primary-500")}
            />
          </Field>
        </>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/dashboard/anggota")}
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
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-neutral-400">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
