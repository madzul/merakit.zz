"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { MemberForm } from "@/components/anggota/member-form";
import { getMemberById } from "@/lib/member-store";

function TambahAnggotaContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const existingMember = editId ? getMemberById(editId) : undefined;
  const isEditMode = Boolean(editId);

  return (
    <div>
      <PageHeader
        title={isEditMode ? "Edit Anggota" : "Tambah Anggota"}
        description={
          isEditMode
            ? "Perbarui data anggota komunitas rajut inklusif MERAKIT."
            : "Daftarkan anggota baru komunitas rajut inklusif MERAKIT."
        }
      />
      <MemberForm member={existingMember} />
    </div>
  );
}

export default function TambahAnggotaPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-neutral-100" />}>
      <TambahAnggotaContent />
    </Suspense>
  );
}
