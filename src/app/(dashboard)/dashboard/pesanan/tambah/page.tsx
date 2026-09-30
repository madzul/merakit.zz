import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { OrderForm } from "@/components/pesanan/order-form";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { getOrderById } from "@/lib/supabase/repositories/orders-repository";
import { getProducts } from "@/lib/supabase/repositories/products-repository";
import { getPromotionById } from "@/lib/supabase/repositories/promotions-repository";
import { formatPromoValue } from "@/lib/promo/logic";

interface TambahPesananPageProps {
  searchParams: Promise<{ id?: string }>;
}

/** Form tambah/edit pesanan — khusus admin (juga ditegakkan server action & RLS). */
export default async function TambahPesananPage({ searchParams }: TambahPesananPageProps) {
  const { id: editId } = await searchParams;

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/dashboard/pesanan");

  const [products, existingOrder] = await Promise.all([
    getProducts(),
    editId ? getOrderById(editId).catch(() => null) : Promise.resolve(null),
  ]);
  if (editId && !existingOrder) redirect("/dashboard/pesanan");

  const isEditMode = Boolean(existingOrder);
  const existingPromo = existingOrder?.promotionId ? await getPromotionById(existingOrder.promotionId).catch(() => null) : null;
  const initialPromo = existingPromo
    ? {
        code: existingPromo.code,
        label: `${existingPromo.code} · ${formatPromoValue(existingPromo)}`,
        discountType: existingPromo.discountType,
        discountValue: existingPromo.discountValue,
      }
    : null;
  // Pesanan baru hanya untuk produk aktif; saat edit, produk lama tetap bisa dipilih.
  const productOptions = products
    .filter((product) => product.isActive || product.id === existingOrder?.productId)
    .map(({ id, name, price, stock }) => ({ id, name, price, stock }));

  return (
    <div>
      <PageHeader
        title={isEditMode ? "Edit Pesanan" : "Tambah Pesanan"}
        description={isEditMode ? "Perbarui detail pesanan pelanggan." : "Catat pesanan baru dari pelanggan."}
      />
      {productOptions.length === 0 ? (
        <EmptyState message="Belum ada produk aktif di katalog. Tambahkan produk terlebih dahulu." />
      ) : (
        <OrderForm order={existingOrder ?? undefined} products={productOptions} initialPromo={initialPromo} />
      )}
    </div>
  );
}
