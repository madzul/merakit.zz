"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ProductionForm } from "@/components/produksi/production-form";
import { getProductionRecordById } from "@/lib/production-store";

function TambahProduksiContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const existingRecord = editId ? getProductionRecordById(editId) : undefined;
  const isEditMode = Boolean(editId);

  return (
    <div>
      <PageHeader
        title={isEditMode ? "Edit Produksi" : "Tambah Produksi"}
        description={
          isEditMode
            ? "Perbarui catatan produksi anggota komunitas."
            : "Catat hasil produksi baru dari anggota komunitas."
        }
      />
      <ProductionForm record={existingRecord} />
    </div>
  );
}

export default function TambahProduksiPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-neutral-100" />}>
      <TambahProduksiContent />
    </Suspense>
  );
}
