"use client";

import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { formatRupiah, formatRupiahShort } from "@/lib/utils";
import type { CashflowPoint } from "@/lib/keuangan/report";

interface CashflowChartProps {
  points: CashflowPoint[];
}

const INCOME_COLOR = "#327a6d"; // primary-600
const EXPENSE_COLOR = "#d96c6c"; // danger-500
const NET_COLOR = "#434340"; // neutral-700

/**
 * Grafik pemasukan vs pengeluaran 6 bulan terakhir (batang) + saldo bersih
 * (garis). Pemasukan sudah termasuk penjualan dari pesanan selesai.
 */
export function CashflowChart({ points }: CashflowChartProps) {
  const hasData = points.some((point) => point.pemasukan > 0 || point.pengeluaran > 0);

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-start gap-3">
        <TrendingUp className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-700" aria-hidden="true" />
        <div>
          <h2 className="text-base font-semibold text-neutral-800">Pemasukan vs Pengeluaran</h2>
          <p className="mt-0.5 text-sm text-neutral-500">6 bulan terakhir · garis menunjukkan saldo bersih tiap bulan</p>
        </div>
      </div>

      {hasData ? (
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={points} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E7E5" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#7C7C77" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: "#7C7C77" }}
                axisLine={false}
                tickLine={false}
                width={56}
                tickFormatter={(value) => formatRupiahShort(Number(value))}
              />
              <Tooltip
                contentStyle={{ borderRadius: 10, borderColor: "#E7E7E5", fontSize: 12 }}
                cursor={{ fill: "#EFF7F5" }}
                formatter={(value, name) => [formatRupiah(Number(value)), name]}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="pemasukan" name="Pemasukan" fill={INCOME_COLOR} radius={[6, 6, 0, 0]} barSize={20} />
              <Bar dataKey="pengeluaran" name="Pengeluaran" fill={EXPENSE_COLOR} radius={[6, 6, 0, 0]} barSize={20} />
              <Line type="monotone" dataKey="saldo" name="Saldo bersih" stroke={NET_COLOR} strokeWidth={2} dot={{ r: 3, fill: NET_COLOR }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
          Belum ada pemasukan atau pengeluaran dalam 6 bulan terakhir.
        </p>
      )}

      {/* Ringkasan teks untuk pembaca layar & cetak. */}
      <table className="sr-only">
        <caption>Pemasukan, pengeluaran, dan saldo per bulan</caption>
        <thead>
          <tr>
            <th>Bulan</th>
            <th>Pemasukan</th>
            <th>Pengeluaran</th>
            <th>Saldo</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.month}>
              <td>{point.month}</td>
              <td>{formatRupiah(point.pemasukan)}</td>
              <td>{formatRupiah(point.pengeluaran)}</td>
              <td>{formatRupiah(point.saldo)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
