"use client";

import { Download, Users } from "lucide-react";
import { downloadCsv } from "@/lib/csv";
import { recapByMember } from "@/lib/produksi/metrics";
import { cn, formatDate } from "@/lib/utils";
import type { ProductionRecord } from "@/lib/types";

interface ProductionMemberRecapProps {
  /** Catatan produksi yang sedang ditampilkan (sudah difilter). */
  records: ProductionRecord[];
  /** Label periode filter, dipakai di judul & nama berkas CSV. */
  periodLabel: string;
}

const fmt = (value: number) => value.toLocaleString("id-ID");

/**
 * Rekap produksi per anggota untuk periode yang dipilih — jumlah catatan,
 * pcs, cacat, jam kerja. Dipakai sebagai bukti keaktifan pencatatan produksi
 * (indikator ≥80% data produksi tercatat) dan bisa diunduh sebagai CSV.
 */
export function ProductionMemberRecap({ records, periodLabel }: ProductionMemberRecapProps) {
  const rows = recapByMember(records);
  if (rows.length === 0) return null;

  const totals = rows.reduce(
    (sum, row) => ({
      entries: sum.entries + row.entries,
      quantity: sum.quantity + row.quantity,
      rejected: sum.rejected + row.rejected,
      completed: sum.completed + row.completed,
      hours: sum.hours + row.hours,
    }),
    { entries: 0, quantity: 0, rejected: 0, completed: 0, hours: 0 }
  );
  const totalRejectPercent = totals.quantity > 0 ? Math.round((totals.rejected / totals.quantity) * 1000) / 10 : 0;

  function handleDownload() {
    const slug = periodLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    downloadCsv(
      `rekap-produksi-anggota-${slug || "semua"}.csv`,
      ["Anggota", "Jumlah Catatan", "Jumlah Produksi (pcs)", "Cacat (pcs)", "Tingkat Cacat (%)", "Selesai (pcs)", "Jam Kerja", "Catatan Terakhir"],
      [
        ...rows.map((row) => [
          row.memberName,
          row.entries,
          row.quantity,
          row.rejected,
          row.rejectPercent.toLocaleString("id-ID"),
          row.completed,
          row.hours,
          row.lastDate,
        ]),
        ["TOTAL", totals.entries, totals.quantity, totals.rejected, totalRejectPercent.toLocaleString("id-ID"), totals.completed, totals.hours, ""],
      ]
    );
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white shadow-card">
      <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-700" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold text-neutral-800">Rekap per Anggota</h2>
            <p className="text-sm text-neutral-500">
              {periodLabel} · catatan dibatalkan tidak dihitung
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Unduh CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs font-medium uppercase tracking-wide text-neutral-500">
              <th className="px-4 py-3">Anggota</th>
              <th className="px-4 py-3 text-right">Catatan</th>
              <th className="px-4 py-3 text-right">Produksi</th>
              <th className="px-4 py-3 text-right">Cacat</th>
              <th className="px-4 py-3 text-right">Selesai</th>
              <th className="px-4 py-3 text-right">Jam</th>
              <th className="px-4 py-3">Terakhir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-700">
            {rows.map((row) => (
              <tr key={row.memberId}>
                <td className="px-4 py-3 font-medium text-neutral-800">{row.memberName}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(row.entries)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(row.quantity)} pcs</td>
                <td className={cn("px-4 py-3 text-right tabular-nums", row.rejected > 0 ? "text-danger-600" : "text-neutral-400")}>
                  {fmt(row.rejected)} ({row.rejectPercent.toLocaleString("id-ID")}%)
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(row.completed)} pcs</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(row.hours)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-neutral-500">{formatDate(row.lastDate)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-neutral-200 font-semibold text-neutral-800">
              <td className="px-4 py-3">Total</td>
              <td className="px-4 py-3 text-right tabular-nums">{fmt(totals.entries)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{fmt(totals.quantity)} pcs</td>
              <td className="px-4 py-3 text-right tabular-nums">
                {fmt(totals.rejected)} ({totalRejectPercent.toLocaleString("id-ID")}%)
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{fmt(totals.completed)} pcs</td>
              <td className="px-4 py-3 text-right tabular-nums">{fmt(totals.hours)}</td>
              <td className="px-4 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
