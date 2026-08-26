"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircle, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCT_CATEGORY_OPTIONS, PRODUCT_IMAGE_OPTIONS } from "@/lib/product-status";
import { addProduct, updateProduct } from "@/lib/product-store";
import type { Product } from "@/lib/types";

interface ProductFormProps {
  /** Jika diisi, form berjalan dalam mode edit untuk produk ini. */
  product?: Product;
}

interface FormValues {
  name: string;
  category: string;
  description: string;
  price: string;
  stock: string;
  imageUrl: string;
  isActive: boolean;
}

interface FormErrors {
  name?: string;
  category?: string;
  description?: string;
  price?: string;
  stock?: string;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function toFormValues(product?: Product): FormValues {
  if (!product) {
    return {
      name: "",
      category: PRODUCT_CATEGORY_OPTIONS[0]?.value ?? "",
      description: "",
      price: "",
      stock: "",
      imageUrl: PRODUCT_IMAGE_OPTIONS[0]?.value ?? "",
      isActive: true,
    };
  }
  return {
    name: product.name,
    category: product.category,
    description: product.description,
    price: String(product.price),
    stock: String(product.stock),
    imageUrl: product.imageUrl,
    isActive: product.isActive,
  };
}

const inputClassName =
  "w-full rounded-lg border bg-white py-2.5 px-3 text-sm text-neutral-800 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40";

/** Form tambah/edit produk katalog. */
export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(product);

  const [values, setValues] = useState<FormValues>(() => toFormValues(product));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};

    if (!values.name.trim()) {
      nextErrors.name = "Nama produk wajib diisi.";
    } else if (values.name.trim().length < 3) {
      nextErrors.name = "Nama produk minimal 3 karakter.";
    }

    if (!values.category.trim()) {
      nextErrors.category = "Kategori wajib diisi.";
    }

    if (!values.description.trim()) {
      nextErrors.description = "Deskripsi produk wajib diisi.";
    }

    const priceNumber = Number(values.price);
    if (!values.price.trim()) {
      nextErrors.price = "Harga wajib diisi.";
    } else if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      nextErrors.price = "Harga harus berupa angka lebih dari 0.";
    }

    const stockNumber = Number(values.stock);
    if (!values.stock.trim()) {
      nextErrors.stock = "Stok wajib diisi.";
    } else if (!Number.isInteger(stockNumber) || stockNumber < 0) {
      nextErrors.stock = "Stok harus berupa bilangan bulat 0 atau lebih.";
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
      name: values.name.trim(),
      category: values.category.trim(),
      description: values.description.trim(),
      price: Number(values.price),
      stock: Number(values.stock),
      imageUrl: values.imageUrl,
      isActive: values.isActive,
      createdAt: product?.createdAt ?? todayIso(),
    };

    // Simulasi proses penyimpanan — data dummy, belum terhubung backend/database.
    window.setTimeout(() => {
      if (isEditMode && product) {
        const updated = updateProduct(product.id, payload);
        if (!updated) {
          setIsSubmitting(false);
          setSubmitError("Produk tidak ditemukan. Mungkin sudah dihapus.");
          return;
        }
        router.push("/dashboard/produk?toast=updated");
      } else {
        addProduct(payload);
        router.push("/dashboard/produk?toast=created");
      }
    }, 600);
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
        <Field label="Nama Produk" htmlFor="name" error={errors.name}>
          <input
            id="name"
            type="text"
            value={values.name}
            onChange={(event) => setField("name", event.target.value)}
            placeholder="mis. Syal Rajut Motif Bunga"
            aria-invalid={Boolean(errors.name)}
            className={cn(inputClassName, errors.name ? "border-danger-500" : "border-neutral-200 focus:border-primary-500")}
          />
        </Field>

        <Field label="Kategori" htmlFor="category" error={errors.category}>
          <input
            id="category"
            list="product-category-options"
            type="text"
            value={values.category}
            onChange={(event) => setField("category", event.target.value)}
            placeholder="mis. Syal"
            aria-invalid={Boolean(errors.category)}
            className={cn(inputClassName, errors.category ? "border-danger-500" : "border-neutral-200 focus:border-primary-500")}
          />
          <datalist id="product-category-options">
            {PRODUCT_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} />
            ))}
          </datalist>
        </Field>

        <Field label="Harga (Rp)" htmlFor="price" error={errors.price}>
          <input
            id="price"
            type="number"
            min={1}
            inputMode="numeric"
            value={values.price}
            onChange={(event) => setField("price", event.target.value)}
            placeholder="mis. 85000"
            aria-invalid={Boolean(errors.price)}
            className={cn(inputClassName, errors.price ? "border-danger-500" : "border-neutral-200 focus:border-primary-500")}
          />
        </Field>

        <Field label="Stok" htmlFor="stock" error={errors.stock}>
          <input
            id="stock"
            type="number"
            min={0}
            inputMode="numeric"
            value={values.stock}
            onChange={(event) => setField("stock", event.target.value)}
            placeholder="mis. 24"
            aria-invalid={Boolean(errors.stock)}
            className={cn(inputClassName, errors.stock ? "border-danger-500" : "border-neutral-200 focus:border-primary-500")}
          />
        </Field>

        <Field label="Gambar Placeholder" htmlFor="imageUrl">
          <select
            id="imageUrl"
            value={values.imageUrl}
            onChange={(event) => setField("imageUrl", event.target.value)}
            className={cn(inputClassName, "pr-8 border-neutral-200 focus:border-primary-500")}
          >
            {PRODUCT_IMAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status Aktif" htmlFor="isActive">
          <select
            id="isActive"
            value={values.isActive ? "aktif" : "nonaktif"}
            onChange={(event) => setField("isActive", event.target.value === "aktif")}
            className={cn(inputClassName, "pr-8 border-neutral-200 focus:border-primary-500")}
          >
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
        </Field>
      </div>

      <Field label="Deskripsi" htmlFor="description" error={errors.description}>
        <textarea
          id="description"
          rows={3}
          value={values.description}
          onChange={(event) => setField("description", event.target.value)}
          placeholder="Deskripsi singkat mengenai produk ini..."
          className={cn(
            inputClassName,
            "resize-none",
            errors.description ? "border-danger-500" : "border-neutral-200 focus:border-primary-500"
          )}
        />
      </Field>

      <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/dashboard/produk")}
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
