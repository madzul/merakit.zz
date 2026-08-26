"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/error-state";
import { OrderSummary } from "@/components/pesanan/order-summary";
import { OrderFilters } from "@/components/pesanan/order-filters";
import { OrderTable } from "@/components/pesanan/order-table";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { getOrders, deleteOrder, updateOrderStatus } from "@/lib/order-store";
import type { Order, OrderStatus } from "@/lib/types";

const PAGE_SIZE = 5;

function PesananPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast, showToast, dismissToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [status, setStatus] = useState<OrderStatus | "semua">("semua");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    // Simulasi pemanggilan data (data dummy, belum terhubung backend/database).
    // Sesekali disimulasikan gagal untuk mendemonstrasikan error state.
    const timeout = window.setTimeout(() => {
      const shouldFail = Math.random() < 0.15;
      if (shouldFail) {
        setLoadError(true);
        setLoading(false);
        return;
      }
      setOrders(getOrders());
      setLoading(false);
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [loadAttempt]);

  // Toast simulasi setelah redirect dari form tambah/edit.
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

  function handleDelete(order: Order) {
    deleteOrder(order.id);
    setOrders(getOrders());
    showToast(`Pesanan dari "${order.customerName}" berhasil dihapus.`, "danger");
  }

  function handleStatusChange(order: Order, nextStatus: OrderStatus) {
    updateOrderStatus(order.id, nextStatus);
    setOrders(getOrders());
    showToast(`Status pesanan "${order.customerName}" diubah menjadi "${nextStatus}".`, "success");
  }

  function handleRetry() {
    setLoading(true);
    setLoadError(false);
    setLoadAttempt((attempt) => attempt + 1);
  }

  return (
    <div>
      <PageHeader
        title="Data Pesanan"
        description="Pantau dan kelola pesanan yang masuk dari pelanggan."
      />

      {loadError ? (
        <ErrorState message="Gagal memuat data pesanan. Periksa koneksi Anda dan coba lagi." onRetry={handleRetry} />
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
          />

          <OrderTable
            orders={paginatedOrders}
            loading={loading}
            page={safePage}
            totalPages={totalPages}
            totalOrders={filteredOrders.length}
            onPageChange={setPage}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        </div>
      )}

      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

export default function PesananPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-neutral-100" />}>
      <PesananPageContent />
    </Suspense>
  );
}
