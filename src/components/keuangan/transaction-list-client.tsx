"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { deleteTransactionAction } from "@/lib/keuangan/actions";
import { TRANSACTION_TYPE_LABELS } from "@/lib/keuangan/constants";
import { cn, formatDate, formatRupiah } from "@/lib/utils";
import type { Transaction, TransactionType } from "@/lib/types";

interface TransactionListClientProps {
  transactions: Transaction[];
  month: string;
}

const TYPE_BADGE: Record<TransactionType, string> = {
  pemasukan: "bg-success-50 text-success-600",
  pengeluaran: "bg-danger-50 text-danger-600",
};

const selectClassName =
  "w-full rounded-lg border border-neutral-200 bg-white py-2 pl-3 pr-8 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40";

/** Daftar transaksi manual bulan terpilih, dengan filter jenis, pencarian, edit & hapus. */
export function TransactionListClient({ transactions, month }: TransactionListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast, showToast, dismissToast } = useToast();

  const [type, setType] = useState<TransactionType | "semua">("semua");
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const toastParam = searchParams.get("toast");
    if (toastParam === "created") showToast("Transaksi berhasil dicatat.", "success");
    if (toastParam === "updated") showToast("Transaksi berhasil diperbarui.", "success");
    if (toastParam) router.replace(`/keuangan?bulan=${month}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((transaction) => {
      if (type !== "semua" && transaction.type !== type) return false;
      if (
        query &&
        !transaction.description.toLowerCase().includes(query) &&
        !transaction.category.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [transactions, type, search]);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    const result = await deleteTransactionAction(pendingDelete.id);
    setDeleting(false);
    setPendingDelete(null);
    if (result.error) {
      showToast(result.error, "danger");
      return;
    }
    showToast("Transaksi berhasil dihapus.", "success");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-card">
      <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-jenis" className="text-xs font-medium text-neutral-600">
              Jenis
            </label>
            <select
              id="filter-jenis"
              value={type}
              onChange={(event) => setType(event.target.value as TransactionType | "semua")}
              className={selectClassName}
            >
              <option value="semua">Semua Jenis</option>
              <option value="pemasukan">Pemasukan</option>
              <option value="pengeluaran">Pengeluaran</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cari-transaksi" className="text-xs font-medium text-neutral-600">
              Cari
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
              <input
                id="cari-transaksi"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Keterangan atau kategori..."
                className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              />
            </div>
          </div>
        </div>
        <Link
          href={`/keuangan/tambah?bulan=${month}`}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Catat Transaksi
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="p-6">
          <EmptyState
            message={
              transactions.length === 0
                ? "Belum ada transaksi yang dicatat pada bulan ini."
                : "Tidak ada transaksi yang sesuai dengan filter."
            }
          />
        </div>
      ) : (
        <>
          {/* Desktop/tablet */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs font-medium uppercase tracking-wide text-neutral-500">
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3 text-right">Jumlah</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((transaction) => (
                  <tr key={transaction.id} className="text-neutral-700">
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(transaction.date)}</td>
                    <td className="max-w-[260px] truncate px-4 py-3" title={transaction.description}>
                      {transaction.description}
                    </td>
                    <td className="px-4 py-3">{transaction.category}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", TYPE_BADGE[transaction.type])}>
                        {TRANSACTION_TYPE_LABELS[transaction.type]}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "whitespace-nowrap px-4 py-3 text-right font-medium",
                        transaction.type === "pemasukan" ? "text-success-600" : "text-danger-600"
                      )}
                    >
                      {transaction.type === "pemasukan" ? "+" : "−"}
                      {formatRupiah(transaction.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/keuangan/tambah?id=${transaction.id}`}
                          aria-label={`Edit transaksi ${transaction.description}`}
                          className="rounded-md p-1.5 text-neutral-500 hover:bg-primary-50 hover:text-primary-700"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(transaction)}
                          aria-label={`Hapus transaksi ${transaction.description}`}
                          className="rounded-md p-1.5 text-neutral-500 hover:bg-danger-50 hover:text-danger-600"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <ul className="divide-y divide-neutral-100 sm:hidden">
            {filtered.map((transaction) => (
              <li key={transaction.id} className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-800">{transaction.description}</p>
                    <p className="text-xs text-neutral-500">
                      {formatDate(transaction.date)} · {transaction.category}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "flex-shrink-0 text-sm font-semibold",
                      transaction.type === "pemasukan" ? "text-success-600" : "text-danger-600"
                    )}
                  >
                    {transaction.type === "pemasukan" ? "+" : "−"}
                    {formatRupiah(transaction.amount)}
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/keuangan/tambah?id=${transaction.id}`}
                    className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(transaction)}
                    className="flex items-center gap-1.5 rounded-md border border-danger-200 px-2.5 py-1.5 text-xs font-medium text-danger-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Hapus
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Hapus transaksi?"
        description={
          pendingDelete
            ? `"${pendingDelete.description}" (${formatRupiah(pendingDelete.amount)}) akan dihapus dan tidak dapat dikembalikan.`
            : undefined
        }
        confirmLabel="Ya, Hapus"
        tone="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />
      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
