import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { MaterialForm } from "@/components/bahan-baku/material-form";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { getMaterialById } from "@/lib/supabase/repositories/materials-repository";

interface TambahBahanPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function TambahBahanPage({ searchParams }: TambahBahanPageProps) {
  const { id: editId } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/bahan-baku");

  const material = editId ? await getMaterialById(editId).catch(() => null) : null;
  if (editId && !material) redirect("/bahan-baku");

  return (
    <div>
      <PageHeader
        title={material ? "Edit Bahan Baku" : "Tambah Bahan Baku"}
        description="Data bahan, satuan, stok minimum, dan harga satuan untuk HPP."
      />
      <div className="max-w-3xl">
        <MaterialForm material={material ?? undefined} />
      </div>
    </div>
  );
}
