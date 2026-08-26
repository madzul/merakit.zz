import {
  DASHBOARD_STATS,
  PRODUCTION_SALES_TREND,
  MATERIAL_STOCK,
  TOP_MEMBERS,
  RECENT_ACTIVITIES,
  QUICK_ACTIONS,
} from "@/lib/mock-data";

/**
 * Mengambil seluruh data untuk halaman dashboard.
 *
 * Catatan: seluruh data di sini masih berupa data dummy (belum terhubung ke
 * backend/API nyata dan tidak menggunakan Supabase). Fungsi dibuat async dengan
 * jeda singkat untuk mensimulasikan pemanggilan data, sehingga `loading.tsx`
 * pada route ini aktif secara alami melalui Suspense bawaan Next.js App Router.
 */
export async function getDashboardData() {
  await new Promise((resolve) => setTimeout(resolve, 700));

  return {
    stats: DASHBOARD_STATS,
    productionSalesTrend: PRODUCTION_SALES_TREND,
    materialStock: MATERIAL_STOCK,
    topMembers: TOP_MEMBERS,
    activities: RECENT_ACTIVITIES,
    quickActions: QUICK_ACTIONS,
  };
}
