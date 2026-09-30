"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AlertTriangle, LoaderCircle, Save, X } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { ORDER_STATUS_OPTIONS } from "@/lib/order-status";
import { checkPromoCodeAction, createOrderAction, updateOrderAction, type AppliedPromo } from "@/lib/pesanan/actions";
import { ORDER_SOURCES, computeDiscount } from "@/lib/promo/logic";
import type { Order, OrderStatus, Product } from "@/lib/types";

interface OrderFormProps {
  /** Jika diisi, form berjalan dalam mode edit untuk pesanan ini. */
  order?: Order;
  /** Produk dari katalog (Supabase) untuk dipilih. */
  products: Pick<Product, "id" | "name" | "price" | "stock">[];
  /** Promo yang sudah terpasang pada pesanan (mode edit). */
  initialPromo?: AppliedPromo | null;
}

interface FormValues {
  orderDate: string;
  customerName: string;
  customerPhone: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  status: OrderStatus;
  notes: string;
  source: string;
}

interface FormErrors {
  orderDate?: string;
  customerName?: string;
  customerPhone?: string;
  productId?: string;
  quantity?: string;
  unitPrice?: string;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function toFormValues(order?: Order): FormValues {
  if (!order) {
    return {
      orderDate: todayIso(),
      customerName: "",
      customerPhone: "",
      productId: "",
      quantity: "",
      unitPrice: "",
      status: "Menunggu",
      notes: "",
      source: "WhatsApp",
    };
  }
  return {
    orderDate: order.orderDate,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    productId: order.productId ?? "",
    quantity: String(order.quantity),
    unitPrice: String(order.unitPrice),
    status: order.status,
    notes: order.notes,
    source: order.source,
  };
}

const inputClassName =
  "w-full rounded-lg border bg-white py-2.5 px-3 text-sm text-neutral-800 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40";

/** Form tambah/edit pesanan, dengan total bayar otomatis (jumlah x harga satuan). */
export function OrderForm({ order, products, initialPromo = null }: OrderFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(order);

  const [values, setValues] = useState<FormValues>(() => toFormValues(order));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleProductChange(productId: string) {
    setField("productId", productId);
    const selected = products.find((product) => product.id === productId);
    if (selected) {
      setField("unitPrice", String(selected.price));
    }
  }

  const selectedProduct = products.find((product) => product.id === values.productId);
  const quantityNumber = Number(values.quantity);
  const unitPriceNumber = Number(values.unitPrice);
  const subtotal =
    Number.isFinite(quantityNumber) && Number.isFinite(unitPriceNumber) ? quantityNumber * unitPriceNumber : 0;

  const [promoInput, setPromoInput] = useState(initialPromo?.code ?? "");
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(initialPromo);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [checkingPromo, setCheckingPromo] = useState(false);
  const discountAmount = appliedPromo ? computeDiscount(appliedPromo, subtotal) : 0;
  const totalAmount = subtotal - discountAmount;

  async function handleApplyPromo() {
    setPromoMessage(null);
    if (!promoInput.trim()) {
      setAppliedPromo(null);
      return;
    }
    if (initialPromo && promoInput.trim().toUpperCase() === initialPromo.code) {
      setAppliedPromo(initialPromo);
      return;
    }
    setCheckingPromo(true);
    const result = await checkPromoCodeAction(promoInput, values.orderDate);
    setCheckingPromo(false);
    if (result.error || !result.promo) {
      setAppliedPromo(null);
      setPromoMessage(result.error ?? "Kode promo tidak valid.");
      return;
    }
    setAppliedPromo(result.promo);
    setPromoInput(result.promo.code);
  }

  function handleRemovePromo() {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoMessage(null);
  }

  const showLowStockWarning =
    selectedProduct !== undefined &&
    values.quantity.trim() !== "" &&
    Number.isFinite(quantityNumber) &&
    quantityNumber > 0 &&
    quantityNumber > selectedProduct.stock;

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};

    if (!values.orderDate) {
      nextErrors.orderDate = "Tanggal pesanan wajib diisi.";
    }

    if (!values.customerName.trim()) {
      nextErrors.customerName = "Nama pemesan wajib diisi.";
    } else if (values.customerName.trim().length < 3) {
      nextErrors.customerName = "Nama pemesan minimal 3 karakter.";
    }

    const phoneDigits = values.customerPhone.replace(/\D/g, "");
    if (!values.customerPhone.trim()) {
      nextErrors.customerPhone = "Nomor telepon/WhatsApp wajib diisi.";
    } else if (phoneDigits.length < 9 || phoneDigits.length > 15) {
      nextErrors.customerPhone = "Nomor telepon/WhatsApp tidak valid.";
    }

    if (!values.productId) {
      nextErrors.productId = "Produk wajib dipilih.";
    }

    if (!values.quantity.trim()) {
      nextErrors.quantity = "Jumlah wajib diisi.";
    } else if (!Number.isInteger(quantityNumber) || quantityNumber <= 0) {
      nextErrors.quantity = "Jumlah harus berupa bilangan bulat lebih dari 0.";
    }

    if (!values.unitPrice.trim()) {
      nextErrors.unitPrice = "Harga satuan wajib diisi.";
    } else if (!Number.isFinite(unitPriceNumber) || unitPriceNumber <= 0) {
      nextErrors.unitPrice = "Harga satuan harus berupa angka lebih dari 0.";
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
      orderDate: values.orderDate,
      customerName: values.customerName.trim(),
      customerPhone: values.customerPhone.replace(/\D/g, ""),
      productId: values.productId,
      quantity: Number(values.quantity),
      unitPrice: Number(values.unitPrice),
      status: values.status,
      notes: values.notes.trim(),
      source: values.source,
      promoCode: appliedPromo?.code ?? "",
    };

    const result =
      isEditMode && order ? await updateOrderAction(order.id, payload) : await createOrderAction(payload);

    if (result.error) {
      setIsSubmitting(false);
      setSubmitError(result.error);
      return;
    }
    router.push(`/dashboard/pesanan?toast=${isEditMode ? "updated" : "created"}`);
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
        <Field label="Tanggal Pesanan" htmlFor="orderDate" error={errors.orderDate}>
          <input
            id="orderDate"
            type="date"
            value={values.orderDate}
            onChange={(event) => setField("orderDate", event.target.value)}
            aria-invalid={Boolean(errors.orderDate)}
            className={cn(inputClassName, errors.orderDate ? "border-danger-500" : "border-neutral-200 focus:border-primary-500")}
          />
        </Field>

        <Field label="Sumber Pesanan" htmlFor="source">
          <select
            id="source"
            value={values.source}
            onChange={(event) => setField("source", event.target.value)}
            className={cn(inputClassName, "pr-8 border-neutral-200 focus:border-primary-500")}
          >
            {(ORDER_SOURCES as readonly string[]).includes(values.source) ? null : (
              <option value={values.source}>{values.source}</option>
            )}
            {ORDER_SOURCES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status" htmlFor="status">
          <select
            id="status"
            value={values.status}
            onChange={(event) => setField("status", event.target.value as OrderStatus)}
            className={cn(inputClassName, "pr-8 border-neutral-200 focus:border-primary-500")}
          >
            {ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Nama Pemesan" htmlFor="customerName" error={errors.customerName}>
          <input
            id="customerName"
            type="text"
            value={values.customerName}
            onChange={(event) => setField("customerName", event.target.value)}
            placeholder="mis. Melati Putri"
            aria-invalid={Boolean(errors.customerName)}
            className={cn(inputClassName, errors.customerName ? "border-danger-500" : "border-neutral-200 focus:border-primary-500")}
          />
        </Field>

        <Field label="Nomor Telepon/WhatsApp" htmlFor="customerPhone" error={errors.customerPhone}>
          <input
            id="customerPhone"
            type="tel"
            inputMode="numeric"
            value={values.customerPhone}
            onChange={(event) => setField("customerPhone", event.target.value)}
            placeholder="mis. 081234567890"
            aria-invalid={Boolean(errors.customerPhone)}
            className={cn(inputClassName, errors.customerPhone ? "border-danger-500" : "border-neutral-200 focus:border-primary-500")}
          />
        </Field>

        <Field label="Produk" htmlFor="productId" error={errors.productId}>
          <select
            id="productId"
            value={values.productId}
            onChange={(event) => handleProductChange(event.target.value)}
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

        <Field label="Jumlah (pcs)" htmlFor="quantity" error={errors.quantity}>
          <input
            id="quantity"
            type="number"
            min={1}
            inputMode="numeric"
            value={values.quantity}
            onChange={(event) => setField("quantity", event.target.value)}
            placeholder="mis. 2"
            aria-invalid={Boolean(errors.quantity)}
            className={cn(inputClassName, errors.quantity ? "border-danger-500" : "border-neutral-200 focus:border-primary-500")}
          />
          {showLowStockWarning && (
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-warning-600">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
              Stok produk ini hanya {selectedProduct?.stock} pcs — jumlah pesanan melebihi stok tersedia.
            </p>
          )}
        </Field>

        <Field label="Harga Satuan (Rp)" htmlFor="unitPrice" error={errors.unitPrice}>
          <input
            id="unitPrice"
            type="number"
            min={1}
            inputMode="numeric"
            value={values.unitPrice}
            onChange={(event) => setField("unitPrice", event.target.value)}
            placeholder="mis. 85000"
            aria-invalid={Boolean(errors.unitPrice)}
            className={cn(inputClassName, errors.unitPrice ? "border-danger-500" : "border-neutral-200 focus:border-primary-500")}
          />
        </Field>

        <Field label="Kode Promo (opsional)" htmlFor="promoCode">
          {appliedPromo ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-success-500/40 bg-success-50 px-3 py-2 text-sm">
              <span className="font-medium text-success-600">{appliedPromo.label}</span>
              <button type="button" onClick={handleRemovePromo} className="text-xs font-medium text-neutral-600 hover:underline">
                Lepas
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                id="promoCode"
                value={promoInput}
                onChange={(event) => setPromoInput(event.target.value.toUpperCase())}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleApplyPromo();
                  }
                }}
                placeholder="mis. MERAKIT10"
                className={cn(inputClassName, "border-neutral-200 uppercase focus:border-primary-500")}
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={checkingPromo || !promoInput.trim()}
                className="flex-shrink-0 rounded-lg border border-neutral-200 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                {checkingPromo ? <LoaderCircle className="h-4 w-4 animate-spin" aria-label="Memeriksa" /> : "Terapkan"}
              </button>
            </div>
          )}
          {promoMessage && (
            <p role="alert" className="text-xs text-danger-600">
              {promoMessage}
            </p>
          )}
        </Field>

        <Field label="Total Bayar" htmlFor="totalAmount">
          <div
            id="totalAmount"
            className="rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 px-3 text-sm text-neutral-800"
          >
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-neutral-500">
                <span>Subtotal {formatCurrency(subtotal)}</span>
                <span className="text-success-600">−{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <p className="font-semibold">{formatCurrency(totalAmount)}</p>
          </div>
          <p className="text-xs text-neutral-400">Jumlah &times; harga satuan{discountAmount > 0 ? " − diskon promo" : ""}. Dihitung ulang di server.</p>
        </Field>
      </div>

      <Field label="Catatan (opsional)" htmlFor="notes">
        <textarea
          id="notes"
          rows={3}
          value={values.notes}
          onChange={(event) => setField("notes", event.target.value)}
          placeholder="Catatan tambahan tentang pesanan ini..."
          className={cn(inputClassName, "resize-none border-neutral-200 focus:border-primary-500")}
        />
      </Field>

      <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/dashboard/pesanan")}
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
