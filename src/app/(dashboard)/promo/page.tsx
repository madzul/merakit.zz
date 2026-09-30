import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/error-state";
import { PromoListClient, type PromoRow } from "@/components/promo/promo-list-client";
import { effectivePromoStatus, todayInJakarta } from "@/lib/promo/logic";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { getPromotionUsage, getPromotions } from "@/lib/supabase/repositories/promotions-repository";

const STATUS_ORDER = { aktif: 0, kedaluwarsa: 1, nonaktif: 2 } as const;

/** Promo & diskon — semua login bisa melihat kode yang berlaku; kelola khusus admin. */
export default async function PromoPage() {
  const profile = await getCurrentProfile().catch(() => null);
  const isAdmin = profile?.role === "admin";
  const today = todayInJakarta();

  let rows: PromoRow[] = [];
  let loadError = false;
  try {
    const [promos, usage] = await Promise.all([getPromotions(), getPromotionUsage()]);
    rows = promos
      .map((promo) => ({
        ...promo,
        effectiveStatus: effectivePromoStatus(promo, today),
        usageOrders: usage.get(promo.id)?.orders ?? 0,
        usageDiscount: usage.get(promo.id)?.discount ?? 0,
      }))
      .sort((a, b) => STATUS_ORDER[a.effectiveStatus] - STATUS_ORDER[b.effectiveStatus]);
  } catch {
    loadError = true;
  }

  return (
    <div>
      <PageHeader
        title="Promo & Diskon"
        description="Kode promo untuk pelanggan. Diskon diterapkan saat admin mencatat pesanan."
        actions={
          isAdmin ? (
            <Link href="/promo/tambah" className="flex items-center gap-1.5 rounded-lg bg-primary-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-800">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Buat Promo
            </Link>
          ) : undefined
        }
      />
      {loadError ? (
        <ErrorState message="Gagal memuat data promo. Muat ulang halaman untuk mencoba lagi." />
      ) : (
        <PromoListClient promos={rows} canManage={isAdmin} />
      )}
    </div>
  );
}
