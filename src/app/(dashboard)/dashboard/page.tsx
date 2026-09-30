import { Boxes, ClipboardList, ShoppingBag, Users, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { ProductionSalesChart } from "@/components/dashboard/production-sales-chart";
import { WeeklyProductionChart } from "@/components/dashboard/weekly-production-chart";
import { MaterialStockCard } from "@/components/dashboard/material-stock-card";
import { TopMembersCard } from "@/components/dashboard/top-members-card";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { getDashboardData } from "@/lib/dashboard-data";
import type { DashboardStatIcon } from "@/lib/types";

const STAT_ICONS: Record<DashboardStatIcon, typeof Boxes> = {
  Boxes,
  ClipboardList,
  Users,
  Wallet,
  ShoppingBag,
};

// Server component (async): data dihitung dari Supabase lewat getDashboardData().
// "use client" hanya dipakai pada komponen grafik (ProductionSalesChart) karena
// Recharts membutuhkan lingkungan browser; seksi lain tetap server component.
export default async function DashboardPage() {
  const { stats, productionSalesTrend, weeklyProduction, materialStock, topMembers, activities, quickActions, partialError } =
    await getDashboardData();

  return (
    <div>
      <PageHeader title="Dashboard" description="Ringkasan aktivitas komunitas rajut MERAKIT hari ini." />

      {partialError && (
        <p role="alert" className="mb-4 rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-600">
          Sebagian data gagal dimuat, sehingga angka di bawah mungkin belum lengkap. Muat ulang halaman untuk mencoba lagi.
        </p>
      )}

      {stats.length === 0 ? (
        <EmptyState message="Belum ada data ringkasan untuk ditampilkan." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              tone={stat.tone}
              trend={stat.trend}
              icon={STAT_ICONS[stat.icon]}
            />
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card xl:col-span-2">
          <h2 className="text-sm font-semibold text-neutral-800">Grafik Produksi & Penjualan</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Perbandingan jumlah produksi (pcs) dan penjualan (Rp) 6 bulan terakhir.
          </p>
          <div className="mt-4">
            <ProductionSalesChart data={productionSalesTrend} />
          </div>
        </div>

        <TopMembersCard members={topMembers} />
      </div>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
        <h2 className="text-sm font-semibold text-neutral-800">Produksi Mingguan</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Jumlah produksi per minggu (Senin–Minggu) 8 minggu terakhir, dipisah produk layak jual dan cacat.
        </p>
        <div className="mt-4">
          <WeeklyProductionChart data={weeklyProduction} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MaterialStockCard
          items={materialStock}
          emptyMessage="Belum ada bahan baku. Tambahkan lewat menu Bahan Baku."
        />
        <RecentActivityCard activities={activities} />
        <QuickActions actions={quickActions} />
      </div>
    </div>
  );
}
