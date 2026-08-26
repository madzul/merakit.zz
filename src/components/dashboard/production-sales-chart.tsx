"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/empty-state";
import { formatRupiah, formatRupiahShort } from "@/lib/utils";
import type { ProductionSalesPoint } from "@/lib/types";

interface ProductionSalesChartProps {
  data: ProductionSalesPoint[];
}

/**
 * Grafik gabungan Produksi (batang, pcs) & Penjualan (garis, Rp) 6 bulan terakhir.
 * Client component karena Recharts membutuhkan lingkungan browser.
 */
export function ProductionSalesChart({ data }: ProductionSalesChartProps) {
  if (data.length === 0) {
    return <EmptyState message="Belum ada data produksi & penjualan untuk ditampilkan." />;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E7E7E5" vertical={false} />
          <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: "#7C7C77" }} axisLine={false} tickLine={false} />
          <YAxis
            yAxisId="produksi"
            tick={{ fontSize: 12, fill: "#7C7C77" }}
            axisLine={false}
            tickLine={false}
            width={34}
          />
          <YAxis
            yAxisId="penjualan"
            orientation="right"
            tick={{ fontSize: 12, fill: "#7C7C77" }}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={(value) => formatRupiahShort(Number(value))}
          />
          <Tooltip
            contentStyle={{ borderRadius: 10, borderColor: "#E7E7E5", fontSize: 12 }}
            cursor={{ fill: "#EFF7F5" }}
            formatter={(value, name) =>
              name === "Penjualan" ? [formatRupiah(Number(value)), name] : [`${value} pcs`, name]
            }
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar
            yAxisId="produksi"
            dataKey="produksi"
            name="Produksi"
            fill="#3F9686"
            radius={[6, 6, 0, 0]}
            barSize={28}
          />
          <Line
            yAxisId="penjualan"
            type="monotone"
            dataKey="penjualan"
            name="Penjualan"
            stroke="#C2A05F"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: "#C2A05F" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
