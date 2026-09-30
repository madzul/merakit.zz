import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ProductionForm } from "@/components/produksi/production-form";
import { getCurrentMemberId, getMembers } from "@/lib/supabase/repositories/members-repository";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { getProducts } from "@/lib/supabase/repositories/products-repository";
import { getProductionRecordById } from "@/lib/supabase/repositories/production-repository";

interface TambahProduksiPageProps {
  searchParams: Promise<{ id?: string }>;
}

/**
 * Form tambah/edit catatan produksi. Admin memilih anggota; anggota biasa
 * selalu mencatat atas nama dirinya sendiri (dikunci di server action & RLS).
 */
export default async function TambahProduksiPage({ searchParams }: TambahProduksiPageProps) {
  const { id: editId } = await searchParams;

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const isAdmin = profile.role === "admin";

  const [products, members, ownMemberId, existingRecord] = await Promise.all([
    getProducts(),
    isAdmin ? getMembers() : Promise.resolve([]),
    isAdmin ? Promise.resolve(null) : getCurrentMemberId(),
    editId ? getProductionRecordById(editId) : Promise.resolve(null),
  ]);

  if (editId && !existingRecord) {
    redirect("/produksi");
  }

  const isEditMode = Boolean(existingRecord);

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
      {!isAdmin && !ownMemberId ? (
        <EmptyState message="Akun Anda belum terhubung ke data anggota, sehingga belum bisa mencatat produksi. Hubungi admin." />
      ) : products.length === 0 ? (
        <EmptyState message="Belum ada produk di katalog. Admin perlu menambahkan produk terlebih dahulu." />
      ) : (
        <ProductionForm
          record={existingRecord ?? undefined}
          products={products.map((product) => ({ id: product.id, name: product.name }))}
          members={isAdmin ? members.filter((member) => member.status === "aktif" || member.id === existingRecord?.memberId).map((member) => ({ id: member.id, name: member.name })) : null}
        />
      )}
    </div>
  );
}
