import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PromoForm } from "@/components/promo/promo-form";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { getPromotionById } from "@/lib/supabase/repositories/promotions-repository";

interface TambahPromoPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function TambahPromoPage({ searchParams }: TambahPromoPageProps) {
  const { id } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/promo");

  const promo = id ? await getPromotionById(id).catch(() => null) : null;
  if (id && !promo) redirect("/promo");

  return (
    <div>
      <PageHeader title={promo ? "Edit Promo" : "Buat Promo"} description="Atur kode, besar diskon, dan masa berlaku." />
      <div className="max-w-2xl">
        <PromoForm promo={promo ?? undefined} />
      </div>
    </div>
  );
}
