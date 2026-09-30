"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorState } from "@/components/error-state";
import { OrderSummary } from "@/components/pesanan/order-summary";
import { OrderFilters } from "@/components/pesanan/order-filters";
import { OrderTable } from "@/components/pesanan/order-table";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { deleteOrderAction, updateOrderStatusAction } from "@/lib/pesanan/actions";
import type { Order, OrderStatus } from "@/lib/types";

const PAGE_SIZE = 5;

interface OrderPageClientProps {
  orders: Order[];
  loadError: boolean;
  canManage: boolean;
}

/** Bagian interaktif Data Pesanan (filter, paginasi, ubah status, hapus). Data dimuat di server. */
export function OrderPageClient({ orders, loadError, canManage }: OrderPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast, showToast, dismissToast } = useToast();

  const [status, setStatus] = useState<OrderStatus | "semua">("semua");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Toast setelah redirect dari form tambah/edit.
  useEffect(() => {
    const toastParam = searchParams.get("toast");
    if (toastParam === "created") {
      showToast("Pesanan baru berhasil ditambahkan.", "success");
    } else if (toastParam === "updated") {
      showToast("Data pesanan berhasil diperbarui.", "success");
    }
    if (toastParam) {
      router.replace("/dashboard/pesanan");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (status !== "semua" && order.status !== status) return false;
      if (query && !order.customerName.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [orders, status, search]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedOrders = filteredOrders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasActiveFilters = status !== "semua" || search.trim() !== "";

  function handleFilterChange<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function handleResetFilters() {
    setStatus("semua");
    setSearch("");
    setPage(1);
  }

  async function handleDelete(order: Order) {
    const result = await deleteOrderAction(order.id);
    if (result.error) {
      showToast(result.error, "danger");
      return;
    }
    showToast(`Pesanan dari "${order.customerName}" berhasil dihapus.`, "success");
    router.refresh();
  }

  async function handleStatusChange(order: Order, nextStatus: OrderStatus) {
    const result = await updateOrderStatusAction(order.id, nextStatus);
    if (result.error) {
      showToast(result.error, "danger");
      return;
    }
    showToast(`Status pesanan "${order.customerName}" diubah menjadi "${nextStatus}".`, "success");
    router.refresh();
  }

  return (
    <div>
      {loadError ? (
        <ErrorState message="Gagal memuat data pesanan. Periksa koneksi Anda dan coba lagi." onRetry={() => router.refresh()} />
      ) : (
        <div className="space-y-4">
          <OrderSummary orders={filteredOrders} />

          <OrderFilters
            status={status}
            onStatusChange={handleFilterChange(setStatus)}
            search={search}
            onSearchChange={handleFilterChange(setSearch)}
            onReset={handleResetFilters}
            hasActiveFilters={hasActiveFilters}
            canCreate={canManage}
          />

          <OrderTable
            orders={paginatedOrders}
            loading={false}
            page={safePage}
            totalPages={totalPages}
            totalOrders={filteredOrders.length}
            onPageChange={setPage}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            canManage={canManage}
          />
        </div>
      )}

      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

