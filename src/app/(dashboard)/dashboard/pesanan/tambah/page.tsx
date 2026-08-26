"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { OrderForm } from "@/components/pesanan/order-form";
import { getOrderById } from "@/lib/order-store";

function TambahPesananContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const existingOrder = editId ? getOrderById(editId) : undefined;
  const isEditMode = Boolean(editId);

  return (
    <div>
      <PageHeader
        title={isEditMode ? "Edit Pesanan" : "Tambah Pesanan"}
        description={
          isEditMode
            ? "Perbarui detail pesanan pelanggan."
            : "Catat pesanan baru dari pelanggan."
        }
      />
      <OrderForm order={existingOrder} />
    </div>
  );
}

export default function TambahPesananPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-neutral-100" />}>
      <TambahPesananContent />
    </Suspense>
  );
}
