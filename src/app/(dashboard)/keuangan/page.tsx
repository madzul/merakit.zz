import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CategoryBreakdown } from "@/components/keuangan/category-breakdown";
import { FinanceSummary } from "@/components/keuangan/finance-summary";
import { MonthNavigator } from "@/components/keuangan/month-navigator";
import { TransactionListClient } from "@/components/keuangan/transaction-list-client";
import { formatMonthLabel, parseMonthParam } from "@/lib/keuangan/constants";
import { loadMonthlyFinance } from "@/lib/keuangan/load";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";

interface KeuanganPageProps {
  searchParams: Promise<{ bulan?: string }>;
}

/**
 * Keuangan (khusus admin — middleware, pengecekan di bawah, dan RLS tabel
 * `expenses`). Pemasukan = penjualan otomatis dari pesanan selesai +
 * pemasukan lain yang dicatat manual; pengeluaran dicatat manual.
 */
export default async function KeuanganPage({ searchParams }: KeuanganPageProps) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/dashboard");

  const { bulan } = await searchParams;
  const month = parseMonthParam(bulan);
  const { transactions, report, loadError } = await loadMonthlyFinance(month);

  return (
    <div>
      <PageHeader
        title="Keuangan"
        description={`Arus kas komunitas — ${formatMonthLabel(month)}.`}
        actions={
          <>
            <MonthNavigator month={month} basePath="/keuangan" />
            <Link
              href={`/keuangan/laporan?bulan=${month}`}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Laporan
            </Link>
          </>
        }
      />

      {loadError && (
        <p role="alert" className="mb-4 rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-600">
          Sebagian data gagal dimuat, sehingga angka di bawah mungkin belum lengkap. Muat ulang halaman untuk mencoba lagi.
        </p>
      )}

      <div className="space-y-4">
        <FinanceSummary report={report} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CategoryBreakdown
            title="Pemasukan per Kategori"
            items={report.incomeByCategory}
            total={report.totalIncome}
            tone="income"
          />
          <CategoryBreakdown
            title="Pengeluaran per Kategori"
            items={report.expenseByCategory}
            total={report.totalExpense}
            tone="expense"
          />
        </div>

        <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-neutral-100" />}>
          <TransactionListClient transactions={transactions} month={month} />
        </Suspense>
      </div>
    </div>
  );
}
