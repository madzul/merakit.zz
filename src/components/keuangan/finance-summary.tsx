import { ArrowDownCircle, ArrowUpCircle, Scale } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { formatRupiah } from "@/lib/utils";
import type { MonthlyFinanceReport } from "@/lib/keuangan/report";

/** Tiga kartu ringkasan: total pemasukan, total pengeluaran, dan surplus/defisit bulan ini. */
export function FinanceSummary({ report }: { report: MonthlyFinanceReport }) {
  const isSurplus = report.net >= 0;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        label="Total Pemasukan"
        value={formatRupiah(report.totalIncome)}
        icon={ArrowUpCircle}
        tone="success"
        description={`Penjualan ${formatRupiah(report.orderSales)} + lainnya ${formatRupiah(report.manualIncome)}`}
      />
      <StatCard
        label="Total Pengeluaran"
        value={formatRupiah(report.totalExpense)}
        icon={ArrowDownCircle}
        tone="danger"
      />
      <StatCard
        label={isSurplus ? "Surplus Bulan Ini" : "Defisit Bulan Ini"}
        value={`${isSurplus ? "" : "−"}${formatRupiah(Math.abs(report.net))}`}
        icon={Scale}
        tone={isSurplus ? "primary" : "warning"}
        description="Pemasukan dikurangi pengeluaran"
      />
    </div>
  );
}
