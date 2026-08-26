"use client";

import { Boxes, ClipboardList, Users, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { DASHBOARD_STATS, PRODUCTION_TREND, ORDERS } from "@/lib/mock-data";
import type { DashboardStatIcon } from "@/lib/types";

const STAT_ICONS: Record<DashboardStatIcon, typeof Boxes> = {
  Boxes,
  ClipboardList,
  Users,
  Wallet,
};

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" description="Ringkasan aktivitas komunitas rajut MERAKIT hari ini." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DASHBOARD_STATS.map((stat) => (
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

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card xl:col-span-2">
          <h2 className="text-sm font-semibold text-neutral-800">Tren Produksi 6 Bulan Terakhir</h2>
          <p className="mt-1 text-xs text-neutral-500">Jumlah produk rajut yang selesai diproduksi.</p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PRODUCTION_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E7E5" vertical={false} />
                <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: "#7C7C77" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#7C7C77" }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={{ borderRadius: 10, borderColor: "#E7E7E5", fontSize: 12 }} cursor={{ fill: "#EFF7F5" }} />
                <Bar dataKey="jumlah" fill="#3F9686" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold text-neutral-800">Pesanan Terbaru</h2>
          <ul className="mt-4 space-y-3">
            {ORDERS.slice(0, 4).map((order) => (
              <li key={order.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-neutral-800">{order.customerName}</p>
                  <p className="text-xs text-neutral-500">{order.orderNumber}</p>
                </div>
                <span className="flex-shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium capitalize text-neutral-600">
                  {order.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
