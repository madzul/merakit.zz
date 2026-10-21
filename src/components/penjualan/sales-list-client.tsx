"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, Store, Truck } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PaymentStatusBadge, SaleStatusBadge } from "@/components/penjualan/sale-badges";
import { downloadCsv } from "@/lib/csv";
import { PAYMENT_STATUS_OPTIONS, SALE_STATUS_OPTIONS } from "@/lib/penjualan/constants";
import { formatRupiah } from "@/lib/utils";
import type { OnlinePaymentStatus, OnlineSale, OnlineSaleStatus } from "@/lib/types";

const selectClass =
  "rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date(iso));
}

const itemSummary = (sale: OnlineSale) =>
  sale.items.map((item) => `${item.productName} ×${item.quantity}`).join(", ") || "-";

/** Daftar penjualan online dengan filter status & pencarian, plus unduh CSV. */
export function SalesListClient({ sales }: { sales: OnlineSale[] }) {
  const [payment, setPayment] = useState<OnlinePaymentStatus | "semua">("semua");
  const [status, setStatus] = useState<OnlineSaleStatus | "semua" | "aktif">("aktif");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sales.filter((sale) => {
      if (payment !== "semua" && sale.paymentStatus !== payment) return false;
      if (status === "aktif" && (sale.status === "Selesai" || sale.status === "Dibatalkan")) return false;
      if (status !== "semua" && status !== "aktif" && sale.status !== status) return false;
      if (q && !`${sale.code} ${sale.customerName} ${sale.customerPhone} ${itemSummary(sale)}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [sales, payment, status, query]);

  function handleExport() {
    downloadCsv(
      `penjualan-online-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Kode", "Tanggal", "Pembeli", "WhatsApp", "Email", "Pengiriman", "Alamat", "Produk", "Subtotal", "Ongkir", "Total", "Status Bayar", "Status", "Kurir", "Resi"],
      filtered.map((sale) => [
        sale.code,
        sale.createdAt.slice(0, 10),
        sale.customerName,
        sale.customerPhone,
        sale.customerEmail ?? "",
        sale.deliveryMethod === "ambil" ? "Ambil sendiri" : sale.shippingZoneLabel ?? "Kirim",
        sale.address ?? "",
        itemSummary(sale),
        sale.subtotal,
        sale.shippingCost,
        sale.totalAmount,
        PAYMENT_STATUS_OPTIONS.find((o) => o.value === sale.paymentStatus)?.label ?? sale.paymentStatus,
        sale.status,
        sale.courier ?? "",
        sale.trackingNumber ?? "",
      ])
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-card">
      <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <label htmlFor="cari-penjualan" className="sr-only">
            Cari penjualan
          </label>
          <input
            id="cari-penjualan"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kode, nama, nomor, produk…"
            className="w-full rounded-lg border border-neutral-200 py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="filter-bayar">Status bayar</label>
          <select id="filter-bayar" value={payment} onChange={(e) => setPayment(e.target.value as typeof payment)} className={selectClass}>
            <option value="semua">Semua pembayaran</option>
            {PAYMENT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <label className="sr-only" htmlFor="filter-status">Status pesanan</label>
          <select id="filter-status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={selectClass}>
            <option value="aktif">Belum selesai</option>
            <option value="semua">Semua status</option>
            {SALE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button type="button" onClick={handleExport} disabled={filtered.length === 0} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50">
            Unduh CSV
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-4">
          <EmptyState message={sales.length === 0 ? "Belum ada penjualan online. Bagikan tautan katalog ke pelanggan." : "Tidak ada penjualan yang cocok dengan filter."} />
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {filtered.map((sale) => (
            <li key={sale.id}>
              <Link href={`/penjualan/${sale.id}`} className="flex flex-col gap-2 px-4 py-3.5 hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-primary-700">{sale.code}</span>
                    <span className="text-sm font-medium text-neutral-800">{sale.customerName}</span>
                    <span className="text-xs text-neutral-400">{formatDateTime(sale.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-neutral-600" title={itemSummary(sale)}>{itemSummary(sale)}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
                    {sale.deliveryMethod === "ambil" ? <Store className="h-3.5 w-3.5" aria-hidden="true" /> : <Truck className="h-3.5 w-3.5" aria-hidden="true" />}
                    {sale.deliveryMethod === "ambil" ? "Ambil sendiri" : sale.shippingZoneLabel ?? "Dikirim"}
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-row items-center gap-2 sm:flex-col sm:items-end">
                  <span className="text-sm font-semibold text-neutral-800">{formatRupiah(sale.totalAmount)}</span>
                  <div className="flex gap-1.5">
                    <PaymentStatusBadge status={sale.paymentStatus} />
                    <SaleStatusBadge status={sale.status} />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
