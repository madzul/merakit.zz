import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/produk/product-form";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { getProductById } from "@/lib/supabase/repositories/products-repository";

interface TambahProdukPageProps {
  searchParams: Promise<{ id?: string }>;
}

/** Form tambah/edit produk — khusus admin (juga ditegakkan server action & RLS). */
export default async function TambahProdukPage({ searchParams }: TambahProdukPageProps) {
  const { id: editId } = await searchParams;

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/dashboard/produk");

  const existingProduct = editId ? await getProductById(editId).catch(() => null) : null;
  if (editId && !existingProduct) redirect("/dashboard/produk");

  const isEditMode = Boolean(existingProduct);

  return (
    <div>
      <PageHeader
        title={isEditMode ? "Edit Produk" : "Tambah Produk"}
        description={
          isEditMode
            ? "Perbarui informasi produk pada katalog MERAKIT."
            : "Tambahkan produk baru ke katalog MERAKIT."
        }
      />
      <ProductForm product={existingProduct ?? undefined} />
    </div>
  );
}
