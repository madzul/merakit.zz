import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { TransactionForm } from "@/components/keuangan/transaction-form";
import { currentMonthInJakarta, parseMonthParam } from "@/lib/keuangan/constants";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { getExpenseById } from "@/lib/supabase/repositories/expenses-repository";

interface TambahTransaksiPageProps {
  searchParams: Promise<{ id?: string; bulan?: string }>;
}

function todayInJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

export default async function TambahTransaksiPage({ searchParams }: TambahTransaksiPageProps) {
  const { id: editId, bulan } = await searchParams;

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/dashboard");

  const transaction = editId ? await getExpenseById(editId).catch(() => null) : null;
  if (editId && !transaction) redirect("/keuangan");

  // Transaksi baru: default hari ini bila bulan yang dibuka = bulan berjalan,
  // selain itu tanggal 1 bulan yang sedang dilihat.
  const month = parseMonthParam(bulan);
  const defaultDate = month === currentMonthInJakarta() ? todayInJakarta() : `${month}-01`;

  return (
    <div>
      <PageHeader
        title={transaction ? "Edit Transaksi" : "Catat Transaksi"}
        description="Catat pemasukan atau pengeluaran kas komunitas."
      />
      <div className="max-w-2xl">
        <TransactionForm transaction={transaction ?? undefined} defaultDate={defaultDate} />
      </div>
    </div>
  );
}
