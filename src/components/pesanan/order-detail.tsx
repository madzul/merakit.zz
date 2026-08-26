"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, MessageCircle, Pencil, Phone } from "lucide-react";
import { cn, formatCurrency, formatDate, formatPhoneDisplay, toWhatsAppLink } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/pesanan/order-status-badge";
import { ORDER_STATUS_OPTIONS } from "@/lib/order-status";
import { updateOrderStatus } from "@/lib/order-store";
import { ToastViewport, useToast } from "@/components/ui/toast";
import type { Order, OrderStatus } from "@/lib/types";

interface OrderDetailProps {
  order: Order;
}

/** Detail pesanan: identitas pemesan, rincian produk, total bayar, dan perubahan status. */
export function OrderDetail({ order: initialOrder }: OrderDetailProps) {
  const { toast, showToast, dismissToast } = useToast();
  const [order, setOrder] = useState(initialOrder);
  const [isUpdating, setIsUpdating] = useState(false);

  function handleStatusChange(status: OrderStatus) {
    if (status === order.status) return;
    setIsUpdating(true);
    // Simulasi proses penyimpanan — data dummy, belum terhubung backend/database.
    window.setTimeout(() => {
      const updated = updateOrderStatus(order.id, status);
      if (updated) {
        setOrder(updated);
        showToast(`Status pesanan diubah menjadi "${status}".`, "success");
      }
      setIsUpdating(false);
    }, 400);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">{order.customerName}</h2>
            <OrderStatusBadge status={order.status} className="mt-1" />

            <dl className="mt-3 space-y-1.5 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
                <dt className="sr-only">Telepon</dt>
                <dd>{formatPhoneDisplay(order.customerPhone)}</dd>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
                <dt className="sr-only">Tanggal pesanan</dt>
                <dd>Dipesan pada {formatDate(order.orderDate)}</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-shrink-0 gap-2">
            <a
              href={toWhatsAppLink(order.customerPhone)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-success-500/30 px-3.5 py-2 text-sm font-medium text-success-600 hover:bg-success-50"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </a>
            <Link
              href={`/dashboard/pesanan/tambah?id=${order.id}`}
              className="flex items-center gap-1.5 rounded-lg bg-primary-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-800"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
          <p className="text-sm font-medium text-neutral-500">Produk Dipesan</p>
          <p className="mt-2 text-lg font-semibold text-neutral-800">{order.productName}</p>
          <p className="mt-1 text-xs text-neutral-400">
            {order.quantity} pcs &times; {formatCurrency(order.unitPrice)}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
          <p className="text-sm font-medium text-neutral-500">Total Bayar</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-800">{formatCurrency(order.totalAmount)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card sm:p-6">
        <h3 className="text-sm font-semibold text-neutral-800">Ubah Status Pesanan</h3>
        <p className="mt-1 text-xs text-neutral-400">
          Perbarui status untuk melacak proses pesanan dari diterima hingga selesai.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ORDER_STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={isUpdating}
              onClick={() => handleStatusChange(option.value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                option.value === order.status
                  ? "border-primary-700 bg-primary-700 text-white"
                  : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card sm:p-6">
        <h3 className="text-sm font-semibold text-neutral-800">Catatan</h3>
        <p className="mt-1 text-sm text-neutral-600">{order.notes || "Tidak ada catatan untuk pesanan ini."}</p>
      </div>

      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
