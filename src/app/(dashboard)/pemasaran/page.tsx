import Link from "next/link";
import { ClipboardList, MessageCircle, Repeat, Users, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { BarList } from "@/components/pemasaran/bar-list";
import {
  PERIOD_OPTIONS,
  buildProductionPlan,
  parsePeriod,
  periodStart,
  summarizeMarketing,
} from "@/lib/pemasaran/analytics";
import { todayInJakarta } from "@/lib/promo/logic";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { getOrders } from "@/lib/supabase/repositories/orders-repository";
import { getProducts } from "@/lib/supabase/repositories/products-repository";
import { cn, formatDate, formatPhoneDisplay, formatRupiah, toWhatsAppLink } from "@/lib/utils";
import type { Order, Product } from "@/lib/types";

interface PemasaranPageProps {
  searchParams: Promise<{ periode?: string }>;
}

/**
 * Pemasaran berbasis data: dari mana pesanan datang, produk apa yang laku,
 * siapa pelanggan setia, dan berapa yang perlu diproduksi minggu ini.
 * Semua anggota bisa melihat analisis produk (untuk rencana produksi);
 * daftar pelanggan (nama & nomor HP) khusus admin.
 */
export default async function PemasaranPage({ searchParams }: PemasaranPageProps) {
  const { periode } = await searchParams;
  const days = parsePeriod(periode);
  const today = todayInJakarta();
  const from = periodStart(today, days);

  const profile = await getCurrentProfile().catch(() => null);
  const isAdmin = profile?.role === "admin";

  let orders: Order[] = [];
  let products: Product[] = [];
  let loadError = false;
  try {
    [orders, products] = await Promise.all([getOrders(), getProducts()]);
  } catch {
    loadError = true;
  }

  const periodOrders = orders.filter((order) => order.orderDate >= from && order.orderDate <= today);
  const summary = summarizeMarketing(periodOrders);
  const openOrders = orders.filter((order) => order.status === "Menunggu" || order.status === "Diproses");
  const plan = buildProductionPlan(products, openOrders, summary.topProducts, days);
  const planNeeded = plan.filter((row) => row.suggested > 0 || row.openDemand > 0);

  return (
    <div>
      <PageHeader
        title="Pemasaran"
        description={`Analisis pesanan ${PERIOD_OPTIONS.find((option) => option.value === days)?.label} terakhir sebagai dasar pemasaran & perencanaan produksi.`}
        actions={
          <nav aria-label="Periode" className="flex flex-wrap gap-1.5">
            {PERIOD_OPTIONS.map((option) => (
              <Link
                key={option.value}
                href={`/pemasaran?periode=${option.value}`}
                aria-current={option.value === days ? "page" : undefined}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium",
                  option.value === days ? "border-primary-700 bg-primary-700 text-white" : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                )}
              >
                {option.label}
              </Link>
            ))}
          </nav>
        }
      />

      {loadError && (
        <p role="alert" className="mb-4 rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-600">
          Sebagian data gagal dimuat, sehingga angka di bawah mungkin belum lengkap. Muat ulang halaman untuk mencoba lagi.
        </p>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Pesanan"
            value={`${summary.orderCount} pesanan`}
            icon={ClipboardList}
            tone="info"
            description={summary.cancelledCount > 0 ? `${summary.cancelledCount} dibatalkan (tidak dihitung)` : undefined}
          />
          <StatCard
            label="Nilai Pesanan"
            value={formatRupiah(summary.orderValue)}
            icon={Wallet}
            tone="success"
            description={`Selesai: ${formatRupiah(summary.completedRevenue)}`}
          />
          <StatCard label="Rata-rata per Pesanan" value={formatRupiah(summary.averageOrderValue)} icon={Wallet} tone="secondary" />
          <StatCard
            label="Pelanggan"
            value={`${summary.uniqueCustomers} orang`}
            icon={summary.repeatCustomers > 0 ? Repeat : Users}
            tone="primary"
            description={`${summary.repeatCustomers} pesan lagi (${summary.repeatRate}%)`}
          />
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white shadow-card">
          <div className="border-b border-neutral-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-neutral-800">Rencana Produksi</h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              Penuhi pesanan yang menunggu/diproses, lalu siapkan cadangan ±2 minggu penjualan. Stok produk diperbarui di menu Produk.
            </p>
          </div>
          {planNeeded.length === 0 ? (
            <div className="p-6">
              <EmptyState message="Tidak ada pesanan terbuka dan stok mencukupi — belum ada yang perlu diproduksi." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-xs font-medium uppercase tracking-wide text-neutral-500">
                    <th className="px-5 py-3">Produk</th>
                    <th className="px-3 py-3 text-right">Pesanan terbuka</th>
                    <th className="px-3 py-3 text-right">Stok</th>
                    <th className="px-3 py-3 text-right">Laku / minggu</th>
                    <th className="px-5 py-3 text-right">Saran produksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {planNeeded.map((row) => (
                    <tr key={row.productId} className="text-neutral-700">
                      <td className="px-5 py-3 font-medium text-neutral-800">
                        <Link href={`/dashboard/produk/${row.productId}`} className="hover:text-primary-700">
                          {row.productName}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-right">{row.openDemand} pcs</td>
                      <td className="px-3 py-3 text-right">{row.stock} pcs</td>
                      <td className="px-3 py-3 text-right">{new Intl.NumberFormat("id-ID").format(row.weeklySales)} pcs</td>
                      <td className="px-5 py-3 text-right">
                        <span className={cn("font-semibold", row.shortfall > 0 ? "text-danger-600" : "text-neutral-800")}>{row.suggested} pcs</span>
                        {row.shortfall > 0 && <span className="block text-xs text-danger-600">kurang {row.shortfall} untuk pesanan</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BarList
            title="Produk Terlaris"
            description="Berdasarkan jumlah pcs dipesan (tidak termasuk pesanan batal)."
            emptyMessage="Belum ada pesanan pada periode ini."
            items={summary.topProducts.map((row) => ({
              key: row.productId ?? row.productName,
              label: row.productName,
              value: row.quantity,
              valueLabel: `${row.quantity} pcs`,
              detail: formatRupiah(row.revenue),
            }))}
          />
          <BarList
            title="Sumber Pesanan"
            description="Dari mana pelanggan datang — fokuskan promosi pada saluran yang paling efektif."
            emptyMessage="Belum ada pesanan pada periode ini."
            items={summary.sources.map((row) => ({
              key: row.source,
              label: row.source,
              value: row.orders,
              valueLabel: `${row.orders} pesanan`,
              detail: formatRupiah(row.revenue),
            }))}
          />
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold text-neutral-800">Dampak Promo</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {summary.promoOrders > 0
              ? `${summary.promoOrders} dari ${summary.orderCount} pesanan memakai kode promo, dengan total potongan ${formatRupiah(summary.promoDiscount)}.`
              : "Belum ada pesanan yang memakai kode promo pada periode ini."}{" "}
            <Link href="/promo" className="font-medium text-primary-700 hover:underline">
              Kelola promo
            </Link>
          </p>
        </div>

        {isAdmin && (
          <div className="rounded-xl border border-neutral-200 bg-white shadow-card">
            <div className="border-b border-neutral-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-neutral-800">Pelanggan Teratas</h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                Khusus admin. Hubungi kembali pelanggan setia, mis. saat ada produk baru atau promo.
              </p>
            </div>
            {summary.customers.length === 0 ? (
              <div className="p-6">
                <EmptyState message="Belum ada pelanggan pada periode ini." />
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {summary.customers.slice(0, 10).map((customer) => (
                  <li key={customer.key} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-800">
                        {customer.name}
                        {customer.orders >= 2 && <span className="ml-2 rounded bg-primary-50 px-1.5 py-0.5 text-[11px] font-medium text-primary-700">pelanggan setia</span>}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatPhoneDisplay(customer.phone)} · {customer.orders} pesanan · terakhir {formatDate(customer.lastOrderDate)}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold text-neutral-800">{formatRupiah(customer.total)}</span>
                      <a
                        href={toWhatsAppLink(customer.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`WhatsApp ${customer.name}`}
                        className="rounded-md p-1.5 text-success-600 hover:bg-success-50"
                      >
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
