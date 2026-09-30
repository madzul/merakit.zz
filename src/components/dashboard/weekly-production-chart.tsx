"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "@/components/empty-state";
import type { WeeklyProductionPoint } from "@/lib/types";

interface WeeklyProductionChartProps {
  data: WeeklyProductionPoint[];
}

/** Produksi per minggu (8 minggu terakhir): produk layak + cacat, ditumpuk. */
export function WeeklyProductionChart({ data }: WeeklyProductionChartProps) {
  if (data.length === 0) {
    return <EmptyState message="Belum ada produksi dalam 8 minggu terakhir." />;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E7E7E5" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#7C7C77" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#7C7C77" }} axisLine={false} tickLine={false} width={34} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: 10, borderColor: "#E7E7E5", fontSize: 12 }}
            cursor={{ fill: "#EFF7F5" }}
            labelFormatter={(label) => `Minggu mulai ${label}`}
            formatter={(value, name) => [`${value} pcs`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="layak" name="Layak jual" stackId="produksi" fill="#3F9686" barSize={28} />
          <Bar dataKey="cacat" name="Cacat" stackId="produksi" fill="#d96c6c" radius={[6, 6, 0, 0]} barSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
