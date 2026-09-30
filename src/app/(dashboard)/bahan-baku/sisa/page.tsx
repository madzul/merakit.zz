import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/error-state";
import { MonthNavigator } from "@/components/keuangan/month-navigator";
import { LeftoverManager } from "@/components/bahan-baku/leftover-manager";
import { formatMonthLabel, monthRange, parseMonthParam } from "@/lib/keuangan/constants";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { getMaterials } from "@/lib/supabase/repositories/materials-repository";
import { getLeftoversBetween } from "@/lib/supabase/repositories/leftovers-repository";
import { todayInJakarta } from "@/lib/promo/logic";

interface SisaBahanPageProps {
  searchParams: Promise<{ bulan?: string }>;
}

/**
 * Sisa bahan & limbah produksi per bulan: berapa yang disimpan, dimanfaatkan
 * ulang jadi produk turunan, atau dibuang. Indikator SDG 12 program PKM.
 * Semua pengguna login bisa mencatat; anggota hanya mengubah catatannya sendiri.
 */
export default async function SisaBahanPage({ searchParams }: SisaBahanPageProps) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { bulan } = await searchParams;
  const month = parseMonthParam(bulan);
  const { from, to } = monthRange(month);
  const today = todayInJakarta();

  const [leftoversResult, materialsResult] = await Promise.allSettled([getLeftoversBetween(from, to), getMaterials()]);
  const materials = materialsResult.status === "fulfilled" ? materialsResult.value.filter((material) => material.isActive) : [];

  return (
    <div>
      <PageHeader
        title="Sisa Bahan"
        description={`Sisa benang & bahan produksi — ${formatMonthLabel(month)}. Catat agar bisa dimanfaatkan ulang jadi produk turunan.`}
        actions={<MonthNavigator month={month} basePath="/bahan-baku/sisa" />}
      />

      {leftoversResult.status === "rejected" ? (
        <ErrorState message="Gagal memuat catatan sisa bahan. Pastikan migrasi migration-indikator-dampak.sql sudah dijalankan, lalu muat ulang halaman." />
      ) : (
        <LeftoverManager
          leftovers={leftoversResult.value}
          materials={materials.map((material) => ({ id: material.id, name: material.name }))}
          currentProfileId={profile.id}
          isAdmin={profile.role === "admin"}
          defaultDate={today >= from && today <= to ? today : to}
        />
      )}
    </div>
  );
}
