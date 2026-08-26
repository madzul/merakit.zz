import { Boxes, ClipboardList, ShoppingBag, Users, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { ProductionSalesChart } from "@/components/dashboard/production-sales-chart";
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

// Server component (async): mengambil data dummy lewat getDashboardData().
// "use client" hanya dipakai pada komponen grafik (ProductionSalesChart) karena
// Recharts membutuhkan lingkungan browser; seksi lain tetap server component.
export default async function DashboardPage() {
  const { stats, productionSalesTrend, materialStock, topMembers, activities, quickActions } =
    await getDashboardData();

  return (
    <div>
      <PageHeader title="Dashboard" description="Ringkasan aktivitas komunitas rajut MERAKIT hari ini." />

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

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MaterialStockCard items={materialStock} />
        <RecentActivityCard activities={activities} />
        <QuickActions actions={quickActions} />
      </div>
    </div>
  );
}
