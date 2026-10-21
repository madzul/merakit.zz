import Link from "next/link";
import { BadgeCheck, Clock, ExternalLink, PackageCheck, Truck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/error-state";
import { StatCard } from "@/components/stat-card";
import { SalesListClient } from "@/components/penjualan/sales-list-client";
import { ShippingZonesCard } from "@/components/penjualan/shipping-zones-card";
import { getOnlineSales, getShippingZones } from "@/lib/supabase/repositories/online-sales-repository";
import { formatRupiah } from "@/lib/utils";
import type { OnlineSale, ShippingZone } from "@/lib/types";

/**
 * Penjualan Online — checkout pembeli dari katalog publik (keranjang, ongkir,
 * bukti transfer). Khusus admin (middleware + RLS online_sales_select_admin).
 */
export default async function PenjualanPage() {
  let sales: OnlineSale[] = [];
  let zones: ShippingZone[] = [];
  let loadError = false;
  try {
    [sales, zones] = await Promise.all([getOnlineSales(), getShippingZones()]);
  } catch {
    loadError = true;
  }

  const monthPrefix = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit" }).format(new Date());
  const open = sales.filter((sale) => sale.status !== "Dibatalkan");
  const needVerification = open.filter((sale) => sale.paymentStatus === "menunggu_verifikasi").length;
  const toProcess = open.filter((sale) => sale.paymentStatus === "lunas" && (sale.status === "Baru" || sale.status === "Diproses")).length;
  const shipped = open.filter((sale) => sale.status === "Dikirim").length;
  const paidThisMonth = open
    .filter((sale) => sale.paymentStatus === "lunas" && (sale.paidAt ?? sale.createdAt).slice(0, 7) === monthPrefix)
    .reduce((sum, sale) => sum + sale.subtotal, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penjualan Online"
        description="Pesanan pembeli dari keranjang katalog: verifikasi bukti bayar, kemas, kirim, lalu tandai selesai."
        actions={
          <Link
            href="/katalog"
            target="_blank"
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Buka katalog
          </Link>
        }
      />

      {loadError ? (
        <ErrorState message="Gagal memuat penjualan online. Pastikan migration-penjualan-online.sql sudah dijalankan, lalu muat ulang halaman." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Perlu Verifikasi Bayar" value={String(needVerification)} icon={Clock} tone="warning" />
            <StatCard label="Perlu Dikemas/Dibuat" value={String(toProcess)} icon={PackageCheck} tone="info" />
            <StatCard label="Sedang Dikirim" value={String(shipped)} icon={Truck} tone="primary" />
            <StatCard label="Penjualan Lunas Bulan Ini" value={formatRupiah(paidThisMonth)} icon={BadgeCheck} tone="success" description="tanpa ongkir" />
          </div>
          <SalesListClient sales={sales} />
          {zones.length > 0 && <ShippingZonesCard zones={zones} />}
          <p className="text-xs text-neutral-400">
            Setiap produk dalam penjualan online juga tercatat di menu Pesanan (sumber &quot;Katalog Online&quot;). Saat
            ditandai Selesai, stok produk berkurang dan nilainya masuk pemasukan di Keuangan. Ongkir tidak dihitung sebagai
            pemasukan.
          </p>
        </>
      )}
    </div>
  );
}
