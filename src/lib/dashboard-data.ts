import { getMembers } from "@/lib/supabase/repositories/members-repository";
import { getOrders } from "@/lib/supabase/repositories/orders-repository";
import { getProducts } from "@/lib/supabase/repositories/products-repository";
import { getProductionRecordsBetween } from "@/lib/supabase/repositories/production-repository";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { getMaterials } from "@/lib/supabase/repositories/materials-repository";
import { stockLevel } from "@/lib/bahan-baku/constants";
import { formatDate, formatRupiah } from "@/lib/utils";
import type {
  ActivityItem,
  DashboardStat,
  MaterialStockItem,
  Member,
  Order,
  ProductionRecord,
  ProductionSalesPoint,
  WeeklyProductionPoint,
  Material,
  QuickAction,
  TopMember,
} from "@/lib/types";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
const TREND_MONTHS = 6;

const ALL_QUICK_ACTIONS: (QuickAction & { adminOnly?: boolean })[] = [
  { id: "qa-1", key: "produksi", label: "Input Produksi", description: "Catat hasil produksi terbaru", href: "/produksi/tambah" },
  { id: "qa-2", key: "anggota", label: "Tambah Anggota", description: "Daftarkan perajin baru", href: "/dashboard/anggota/tambah", adminOnly: true },
  { id: "qa-3", key: "produk", label: "Tambah Produk", description: "Tambahkan produk ke katalog", href: "/dashboard/produk/tambah", adminOnly: true },
  { id: "qa-4", key: "pesanan", label: "Buat Pesanan", description: "Catat pesanan pelanggan baru", href: "/dashboard/pesanan/tambah", adminOnly: true },
];

/** Tanggal hari ini (YYYY-MM-DD) menurut zona waktu komunitas (WIB), bukan zona server. */
function todayInJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

/** Kunci bulan "YYYY-MM" dari tanggal ISO. */
function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

/** Daftar `count` bulan terakhir (termasuk bulan berjalan), urut lama → baru. */
function lastMonths(today: string, count: number): { key: string; label: string }[] {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7)) - 1;
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - (count - 1 - index), 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    return { key, label: MONTH_LABELS[date.getUTCMonth()] };
  });
}

const WEEK_COUNT = 8;

/** `count` minggu terakhir (Senin sebagai awal minggu), urut lama → baru. */
export function lastWeeks(today: string, count: number): { start: string; end: string; label: string }[] {
  const date = new Date(`${today}T00:00:00Z`);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  const thisMonday = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - mondayOffset);
  return Array.from({ length: count }, (_, index) => {
    const start = new Date(thisMonday - (count - 1 - index) * 7 * 864e5);
    const end = new Date(start.getTime() + 6 * 864e5);
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      label: `${start.getUTCDate()} ${MONTH_LABELS[start.getUTCMonth()]}`,
    };
  });
}

const isCountedProduction = (record: ProductionRecord) => record.status !== "dibatalkan";
const isCompletedOrder = (order: Order) => order.status === "Selesai";

function sumQuantity(records: ProductionRecord[]) {
  return records.reduce((sum, record) => sum + record.quantity, 0);
}

function sumRevenue(orders: Order[]) {
  return orders.reduce((sum, order) => sum + order.totalAmount, 0);
}

function percentChange(current: number, previous: number): { value: string; direction: "up" | "down" } | undefined {
  if (previous === 0) return undefined;
  const change = Math.round(((current - previous) / previous) * 100);
  return { value: `${change >= 0 ? "+" : ""}${change}% dari bulan lalu`, direction: change >= 0 ? "up" : "down" };
}

export interface DashboardData {
  stats: DashboardStat[];
  productionSalesTrend: ProductionSalesPoint[];
  /** 8 minggu terakhir; kosong bila belum ada produksi sama sekali di rentang itu. */
  weeklyProduction: WeeklyProductionPoint[];
  materialStock: MaterialStockItem[];
  topMembers: TopMember[];
  activities: ActivityItem[];
  quickActions: QuickAction[];
  /** True bila salah satu sumber data gagal dimuat (angka mungkin tidak lengkap). */
  partialError: boolean;
}

/**
 * Data halaman dashboard, dihitung dari tabel Supabase (produksi, pesanan,
 * produk, anggota). RLS berlaku: anggota biasa hanya melihat produksinya
 * sendiri, jadi angka produksi di dashboard mereka bersifat pribadi.
 *
 * Kartu stok bahan menampilkan maks. 5 bahan aktif dari tabel `materials`,
 * diurutkan dari yang paling perlu dibeli.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const today = todayInJakarta();
  const months = lastMonths(today, TREND_MONTHS);
  const rangeStart = `${months[0].key}-01`;
  const currentMonth = months[months.length - 1].key;
  const previousMonth = months[months.length - 2].key;

  const profile = await getCurrentProfile().catch(() => null);
  const isAdmin = profile?.role === "admin";

  const [productionResult, ordersResult, productsResult, membersResult, materialsResult] = await Promise.allSettled([
    getProductionRecordsBetween(rangeStart, today),
    getOrders(),
    getProducts(),
    isAdmin ? getMembers() : Promise.resolve([] as Member[]),
    getMaterials(),
  ]);

  const production = productionResult.status === "fulfilled" ? productionResult.value : [];
  const orders = ordersResult.status === "fulfilled" ? ordersResult.value : [];
  const products = productsResult.status === "fulfilled" ? productsResult.value : [];
  const members = membersResult.status === "fulfilled" ? membersResult.value : [];
  const materials: Material[] = materialsResult.status === "fulfilled" ? materialsResult.value : [];
  const partialError = [productionResult, ordersResult, productsResult, membersResult, materialsResult].some(
    (result) => result.status === "rejected"
  );

  const countedProduction = production.filter(isCountedProduction);
  const productionThisMonth = countedProduction.filter((record) => monthKey(record.productionDate) === currentMonth);
  const productionLastMonth = countedProduction.filter((record) => monthKey(record.productionDate) === previousMonth);

  const completedOrders = orders.filter(isCompletedOrder);
  const revenueThisMonth = sumRevenue(completedOrders.filter((order) => monthKey(order.orderDate) === currentMonth));
  const revenueLastMonth = sumRevenue(completedOrders.filter((order) => monthKey(order.orderDate) === previousMonth));

  const waitingOrders = orders.filter((order) => order.status === "Menunggu").length;
  const activeOrders = waitingOrders + orders.filter((order) => order.status === "Diproses").length;

  const stats: DashboardStat[] = [
    {
      label: isAdmin ? "Produksi Bulan Ini" : "Produksi Saya Bulan Ini",
      value: `${sumQuantity(productionThisMonth)} pcs`,
      icon: "Boxes",
      tone: "primary",
      trend: percentChange(sumQuantity(productionThisMonth), sumQuantity(productionLastMonth)),
    },
    {
      label: "Penjualan Bulan Ini",
      value: formatRupiah(revenueThisMonth),
      icon: "Wallet",
      tone: "success",
      trend: percentChange(revenueThisMonth, revenueLastMonth),
    },
    {
      label: "Pesanan Aktif",
      value: `${activeOrders} Pesanan`,
      icon: "ClipboardList",
      tone: "info",
      trend: waitingOrders > 0 ? { value: `${waitingOrders} menunggu diproses`, direction: "down" } : undefined,
    },
    isAdmin
      ? {
          label: "Anggota Aktif",
          value: `${members.filter((member) => member.status === "aktif").length} Anggota`,
          icon: "Users",
          tone: "secondary",
        }
      : {
          label: "Produk Aktif",
          value: `${products.filter((product) => product.isActive).length} Produk`,
          icon: "ShoppingBag",
          tone: "secondary",
        },
  ];

  const productionSalesTrend: ProductionSalesPoint[] = months.map(({ key, label }) => ({
    bulan: label,
    produksi: sumQuantity(countedProduction.filter((record) => monthKey(record.productionDate) === key)),
    penjualan: sumRevenue(completedOrders.filter((order) => monthKey(order.orderDate) === key)),
  }));
  const weeklyProduction: WeeklyProductionPoint[] = lastWeeks(today, WEEK_COUNT).map(({ start, end, label }) => {
    const weekRecords = countedProduction.filter((record) => record.productionDate >= start && record.productionDate <= end);
    const total = sumQuantity(weekRecords);
    const cacat = weekRecords.reduce((sum, record) => sum + (record.rejectQuantity ?? 0), 0);
    return { weekStart: start, label, layak: total - cacat, cacat };
  });
  const hasWeeklyData = weeklyProduction.some((point) => point.layak > 0 || point.cacat > 0);

  const hasTrendData = productionSalesTrend.some((point) => point.produksi > 0 || point.penjualan > 0);

  const contributionByMember = new Map<string, { name: string; total: number }>();
  for (const record of productionThisMonth) {
    const entry = contributionByMember.get(record.memberId) ?? { name: record.memberName, total: 0 };
    entry.total += record.quantity;
    contributionByMember.set(record.memberId, entry);
  }
  const topMembers: TopMember[] = Array.from(contributionByMember.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 3)
    .map(([id, entry]) => ({ id, name: entry.name, role: "Perajin", contribution: entry.total, unit: "pcs" }));

  const activities: ActivityItem[] = [
    ...production.slice(0, 5).map((record) => ({
      id: `prod-${record.id}`,
      type: "produksi" as const,
      date: record.productionDate,
      message: `${record.memberName} mencatat ${record.quantity} pcs ${record.productName} (${record.status}).`,
    })),
    ...orders.slice(0, 5).map((order) => ({
      id: `order-${order.id}`,
      type: "pesanan" as const,
      date: order.orderDate,
      message: `Pesanan ${order.quantity} pcs ${order.productName} dari ${order.customerName} (${order.status}).`,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map(({ id, type, date, message }) => ({ id, type, message, timestamp: formatDate(date) }));

  return {
    stats,
    productionSalesTrend: hasTrendData ? productionSalesTrend : [],
    weeklyProduction: hasWeeklyData ? weeklyProduction : [],
    // Bahan aktif, yang paling perlu perhatian (habis → menipis → aman) di atas.
    materialStock: materials
      .filter((material) => material.isActive)
      .map((material) => ({
        id: material.id,
        name: material.name,
        quantity: material.stock,
        unit: material.unit,
        status: stockLevel(material),
      }))
      .sort((a, b) => ["habis", "menipis", "aman"].indexOf(a.status) - ["habis", "menipis", "aman"].indexOf(b.status))
      .slice(0, 5),
    topMembers,
    activities,
    quickActions: ALL_QUICK_ACTIONS.filter((action) => isAdmin || !action.adminOnly).map((action) => ({
      id: action.id,
      key: action.key,
      label: action.label,
      description: action.description,
      href: action.href,
    })),
    partialError,
  };
}
