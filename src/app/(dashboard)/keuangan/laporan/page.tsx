import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MonthNavigator } from "@/components/keuangan/month-navigator";
import { ReportActions, type ReportCsvRow } from "@/components/keuangan/report-actions";
import { PrintWatermark } from "@/components/print-watermark";
import { ORDER_SALES_LABEL, TRANSACTION_TYPE_LABELS, formatMonthLabel, parseMonthParam } from "@/lib/keuangan/constants";
import { loadMonthlyFinance } from "@/lib/keuangan/load";
import type { CategoryTotal } from "@/lib/keuangan/report";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { cn, formatDate, formatRupiah } from "@/lib/utils";

interface LaporanPageProps {
  searchParams: Promise<{ bulan?: string }>;
}

function nowInJakartaLabel(): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());
}

/** Laporan keuangan bulanan — rapi untuk dicetak/disimpan PDF dan bisa diunduh CSV. */
export default async function LaporanKeuanganPage({ searchParams }: LaporanPageProps) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/dashboard");

  const { bulan } = await searchParams;
  const month = parseMonthParam(bulan);
  const { transactions, completedOrders, report, loadError } = await loadMonthlyFinance(month);

  const csvRows: ReportCsvRow[] = [
    ...completedOrders.map((order) => ({
      date: order.orderDate,
      type: "Pemasukan",
      category: ORDER_SALES_LABEL,
      description: `${order.quantity} pcs ${order.productName} — ${order.customerName}`,
      amount: order.totalAmount,
    })),
    ...transactions.map((transaction) => ({
      date: transaction.date,
      type: TRANSACTION_TYPE_LABELS[transaction.type],
      category: transaction.category,
      description: transaction.description,
      amount: transaction.type === "pengeluaran" ? -transaction.amount : transaction.amount,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const isSurplus = report.net >= 0;

  return (
    <div className="relative mx-auto max-w-4xl print:min-h-[260mm] print:max-w-none">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <Link
          href={`/keuangan?bulan=${month}`}
          className="flex w-fit items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <MonthNavigator month={month} basePath="/keuangan/laporan" />
          <ReportActions month={month} rows={csvRows} />
        </div>
      </div>

      {loadError && (
        <p role="alert" className="mb-4 rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-600 print:hidden">
          Sebagian data gagal dimuat — jangan cetak laporan ini sebelum memuat ulang halaman.
        </p>
      )}

      <article className="rounded-xl border border-neutral-200 bg-white p-6 shadow-card sm:p-8 print:border-0 print:p-0 print:shadow-none">
        <header className="border-b border-neutral-200 pb-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Komunitas Rajut Inklusif MERAKIT (Merajut Asa Kita)</p>
          <h1 className="mt-1 text-xl font-semibold text-neutral-800">Laporan Keuangan Bulanan</h1>
          <p className="mt-1 text-sm text-neutral-600">Periode {formatMonthLabel(month)}</p>
        </header>

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-neutral-800">A. Ringkasan Arus Kas</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              <SummaryRow label="Total pemasukan" value={report.totalIncome} />
              <SummaryRow label="Total pengeluaran" value={-report.totalExpense} />
              <tr className="border-t-2 border-neutral-300 font-semibold">
                <td className="py-2">{isSurplus ? "Surplus" : "Defisit"}</td>
                <td className={cn("py-2 text-right", isSurplus ? "text-success-600" : "text-danger-600")}>
                  {isSurplus ? "" : "−"}
                  {formatRupiah(Math.abs(report.net))}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 print:grid-cols-2">
          <CategoryTable title="B. Rincian Pemasukan" items={report.incomeByCategory} total={report.totalIncome} />
          <CategoryTable title="C. Rincian Pengeluaran" items={report.expenseByCategory} total={report.totalExpense} />
        </div>

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-neutral-800">D. Daftar Transaksi</h2>
          {csvRows.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">Tidak ada transaksi pada periode ini.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-300 text-xs uppercase tracking-wide text-neutral-500">
                    <th className="py-2 pr-3">Tanggal</th>
                    <th className="py-2 pr-3">Kategori</th>
                    <th className="py-2 pr-3">Keterangan</th>
                    <th className="py-2 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {csvRows.map((row, index) => (
                    <tr key={`${row.date}-${index}`} className="text-neutral-700 print:break-inside-avoid">
                      <td className="whitespace-nowrap py-2 pr-3">{formatDate(row.date)}</td>
                      <td className="py-2 pr-3">{row.category}</td>
                      <td className="py-2 pr-3">{row.description}</td>
                      <td className={cn("whitespace-nowrap py-2 text-right", row.amount < 0 ? "text-danger-600" : "text-success-600")}>
                        {row.amount < 0 ? "−" : "+"}
                        {formatRupiah(Math.abs(row.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="mt-8 grid grid-cols-2 gap-6 text-sm text-neutral-700 print:break-inside-avoid">
          <div>
            <p>Mengetahui,</p>
            <p>Ketua MERAKIT</p>
            <div className="h-16" />
            <p className="border-t border-neutral-300 pt-1">(........................................)</p>
          </div>
          <div>
            <p>Bandung, ....................</p>
            <p>Pengelola Keuangan</p>
            <div className="h-16" />
            <p className="border-t border-neutral-300 pt-1">(........................................)</p>
          </div>
        </footer>

        <p className="mt-6 text-xs text-neutral-400">
          Dibuat dari Sistem Informasi MERAKIT pada {nowInJakartaLabel()} WIB. Penjualan dihitung dari pesanan berstatus
          &quot;Selesai&quot; berdasarkan tanggal pesanan.
        </p>
      </article>

      <PrintWatermark />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <tr className="border-b border-neutral-100">
      <td className="py-2 text-neutral-700">{label}</td>
      <td className="py-2 text-right text-neutral-800">
        {value < 0 ? "−" : ""}
        {formatRupiah(Math.abs(value))}
      </td>
    </tr>
  );
}

function CategoryTable({ title, items, total }: { title: string; items: CategoryTotal[]; total: number }) {
  return (
    <section className="print:break-inside-avoid">
      <h2 className="text-sm font-semibold text-neutral-800">{title}</h2>
      <table className="mt-3 w-full text-sm">
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td className="py-2 text-neutral-500">Tidak ada.</td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.category} className="border-b border-neutral-100">
                <td className="py-2 pr-3 text-neutral-700">{item.category}</td>
                <td className="py-2 text-right text-neutral-800">{formatRupiah(item.total)}</td>
              </tr>
            ))
          )}
          <tr className="font-semibold">
            <td className="py-2">Jumlah</td>
            <td className="py-2 text-right">{formatRupiah(total)}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
