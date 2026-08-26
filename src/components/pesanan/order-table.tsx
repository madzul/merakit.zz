"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Eye, Pencil, Trash2 } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { OrderStatusBadge } from "@/components/pesanan/order-status-badge";
import { ORDER_STATUS_OPTIONS } from "@/lib/order-status";
import type { Order, OrderStatus } from "@/lib/types";

interface OrderTableProps {
  orders: Order[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalOrders: number;
  onPageChange: (page: number) => void;
  onDelete: (order: Order) => void;
  onStatusChange: (order: Order, status: OrderStatus) => void;
}

const COLUMN_COUNT = 8;

const statusSelectClassName =
  "rounded-md border border-neutral-200 bg-white py-1.5 pl-2 pr-6 text-xs font-medium text-neutral-700 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40";

/** Tabel daftar pesanan untuk desktop/tablet, dengan tampilan kartu di mobile. */
export function OrderTable({
  orders,
  loading,
  page,
  totalPages,
  totalOrders,
  onPageChange,
  onDelete,
  onStatusChange,
}: OrderTableProps) {
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);

  function handleEdit(order: Order) {
    router.push(`/dashboard/pesanan/tambah?id=${order.id}`);
  }

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    // Simulasi proses penghapusan (data dummy, belum terhubung backend/database).
    window.setTimeout(() => {
      onDelete(pendingDelete);
      setDeleting(false);
      setPendingDelete(null);
    }, 500);
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-card">
      {/* Desktop / tablet */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs font-medium uppercase tracking-wide text-neutral-500">
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Pemesan</th>
              <th className="px-4 py-3">Produk</th>
              <th className="px-4 py-3">Jumlah</th>
              <th className="px-4 py-3">Harga Satuan</th>
              <th className="px-4 py-3">Total Bayar</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <TableSkeletonRows />
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-4 py-10">
                  <EmptyState message="Tidak ada pesanan yang sesuai dengan pencarian/filter." />
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="text-neutral-700">
                  <td className="whitespace-nowrap px-4 py-3">{formatDate(order.orderDate)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/pesanan/${order.id}`}
                      className="font-medium text-neutral-800 hover:text-primary-700"
                    >
                      {order.customerName}
                    </Link>
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3" title={order.productName}>
                    {order.productName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{order.quantity} pcs</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatCurrency(order.unitPrice)}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-800">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      <OrderStatusBadge status={order.status} />
                      <label className="sr-only" htmlFor={`status-${order.id}`}>
                        Ubah status pesanan {order.customerName}
                      </label>
                      <select
                        id={`status-${order.id}`}
                        value={order.status}
                        onChange={(event) => onStatusChange(order, event.target.value as OrderStatus)}
                        className={statusSelectClassName}
                      >
                        {ORDER_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/dashboard/pesanan/${order.id}`}
                        aria-label={`Detail pesanan ${order.customerName}`}
                        className="rounded-md p-1.5 text-neutral-500 hover:bg-primary-50 hover:text-primary-700"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleEdit(order)}
                        aria-label={`Edit pesanan ${order.customerName}`}
                        className="rounded-md p-1.5 text-neutral-500 hover:bg-primary-50 hover:text-primary-700"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(order)}
                        aria-label={`Hapus pesanan ${order.customerName}`}
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

      {/* Mobile: kartu menggantikan tabel */}
      <div className="divide-y divide-neutral-100 sm:hidden">
        {loading ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-lg bg-neutral-100" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-4">
            <EmptyState message="Tidak ada pesanan yang sesuai dengan pencarian/filter." />
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/dashboard/pesanan/${order.id}`} className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-800">{order.customerName}</p>
                  <p className="text-xs text-neutral-500">{formatDate(order.orderDate)}</p>
                </Link>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600">
                <p className="truncate">
                  <span className="text-neutral-400">Produk: </span>
                  {order.productName}
                </p>
                <p>
                  <span className="text-neutral-400">Jumlah: </span>
                  {order.quantity} pcs
                </p>
                <p>
                  <span className="text-neutral-400">Harga: </span>
                  {formatCurrency(order.unitPrice)}
                </p>
                <p className="font-medium text-neutral-800">
                  <span className="font-normal text-neutral-400">Total: </span>
                  {formatCurrency(order.totalAmount)}
                </p>
              </div>

              <div className="flex flex-col gap-1.5 pt-1">
                <label className="text-xs font-medium text-neutral-600" htmlFor={`status-mobile-${order.id}`}>
                  Ubah Status
                </label>
                <select
                  id={`status-mobile-${order.id}`}
                  value={order.status}
                  onChange={(event) => onStatusChange(order, event.target.value as OrderStatus)}
                  className={cn(statusSelectClassName, "w-full")}
                >
                  {ORDER_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Link
                  href={`/dashboard/pesanan/${order.id}`}
                  className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  Detail
                </Link>
                <button
                  type="button"
                  onClick={() => handleEdit(order)}
                  className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(order)}
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
      {!loading && totalOrders > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-neutral-100 px-4 py-3 sm:flex-row">
          <p className="text-xs text-neutral-500">
            Menampilkan halaman {page} dari {totalPages} ({totalOrders} pesanan)
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
        title="Hapus pesanan?"
        description={
          pendingDelete
            ? `Pesanan dari "${pendingDelete.customerName}" akan dihapus dan tidak dapat dikembalikan.`
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
