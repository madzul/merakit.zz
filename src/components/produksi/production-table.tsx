"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { cn, formatDate, formatDuration } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PRODUCTION_STATUS_BADGE_STYLES, PRODUCTION_STATUS_LABELS } from "@/lib/production-status";
import type { ProductionRecord } from "@/lib/types";

interface ProductionTableProps {
  records: ProductionRecord[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onDelete: (id: string) => void;
}

const COLUMN_COUNT = 8;

export function ProductionTable({
  records,
  loading,
  page,
  totalPages,
  totalRecords,
  onPageChange,
  onDelete,
}: ProductionTableProps) {
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = useState<ProductionRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  function handleEdit(record: ProductionRecord) {
    router.push(`/produksi/tambah?id=${record.id}`);
  }

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    // Simulasi proses penghapusan (data dummy, belum terhubung backend/Supabase).
    window.setTimeout(() => {
      onDelete(pendingDelete.id);
      setDeleting(false);
      setPendingDelete(null);
    }, 500);
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-card">
      {/* Desktop / tablet: tabel dengan horizontal scroll agar tetap usable di layar sempit */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs font-medium uppercase tracking-wide text-neutral-500">
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Nama Anggota</th>
              <th className="px-4 py-3">Produk</th>
              <th className="px-4 py-3">Jumlah</th>
              <th className="px-4 py-3">Durasi</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Catatan</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <TableSkeletonRows />
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-4 py-10">
                  <EmptyState message="Tidak ada data produksi yang sesuai dengan filter." />
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id} className="text-neutral-700">
                  <td className="whitespace-nowrap px-4 py-3">{formatDate(record.productionDate)}</td>
                  <td className="px-4 py-3">{record.memberName}</td>
                  <td className="px-4 py-3">{record.productName}</td>
                  <td className="px-4 py-3">{record.quantity} pcs</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatDuration(record.duration)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={record.status} />
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-neutral-500" title={record.notes || "-"}>
                    {record.notes || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(record)}
                        aria-label={`Edit produksi ${record.productName}`}
                        className="rounded-md p-1.5 text-neutral-500 hover:bg-primary-50 hover:text-primary-700"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(record)}
                        aria-label={`Hapus produksi ${record.productName}`}
                        className="rounded-md p-1.5 text-neutral-500 hover:bg-danger-50 hover:text-danger-600"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: tampilan kartu menggantikan tabel */}
      <div className="divide-y divide-neutral-100 sm:hidden">
        {loading ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-lg bg-neutral-100" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="p-4">
            <EmptyState message="Tidak ada data produksi yang sesuai dengan filter." />
          </div>
        ) : (
          records.map((record) => (
            <div key={record.id} className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-800">{record.productName}</p>
                  <p className="text-xs text-neutral-500">{record.memberName}</p>
                </div>
                <StatusBadge status={record.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600">
                <p>
                  <span className="text-neutral-400">Tanggal: </span>
                  {formatDate(record.productionDate)}
                </p>
                <p>
                  <span className="text-neutral-400">Jumlah: </span>
                  {record.quantity} pcs
                </p>
                <p>
                  <span className="text-neutral-400">Durasi: </span>
                  {formatDuration(record.duration)}
                </p>
              </div>
              {record.notes && <p className="text-xs text-neutral-500">Catatan: {record.notes}</p>}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleEdit(record)}
                  className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(record)}
                  className="flex items-center gap-1.5 rounded-md border border-danger-200 px-2.5 py-1.5 text-xs font-medium text-danger-600 hover:bg-danger-50"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination (dummy — hanya mengiris data lokal, belum terhubung backend) */}
      {!loading && totalRecords > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-neutral-100 px-4 py-3 sm:flex-row">
          <p className="text-xs text-neutral-500">
            Menampilkan halaman {page} dari {totalPages} ({totalRecords} catatan)
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label="Halaman sebelumnya"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium",
                  p === page
                    ? "bg-primary-700 text-white"
                    : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                )}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              aria-label="Halaman berikutnya"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Hapus catatan produksi?"
        description={
          pendingDelete
            ? `Catatan produksi "${pendingDelete.productName}" oleh ${pendingDelete.memberName} akan dihapus dan tidak dapat dikembalikan.`
            : undefined
        }
        confirmLabel="Ya, Hapus"
        tone="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: ProductionRecord["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        PRODUCTION_STATUS_BADGE_STYLES[status]
      )}
    >
      {PRODUCTION_STATUS_LABELS[status]}
    </span>
  );
}

function TableSkeletonRows() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <tr key={i}>
          {Array.from({ length: COLUMN_COUNT }, (_, cellIndex) => (
            <td key={cellIndex} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded bg-neutral-100" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
