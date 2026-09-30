import type { Order, Product } from "@/lib/types";

export const PERIOD_OPTIONS = [
  { value: 30, label: "30 hari" },
  { value: 90, label: "90 hari" },
  { value: 180, label: "6 bulan" },
  { value: 365, label: "1 tahun" },
] as const;
export type PeriodDays = (typeof PERIOD_OPTIONS)[number]["value"];

export function parsePeriod(value: string | undefined): PeriodDays {
  const days = Number(value);
  return (PERIOD_OPTIONS.find((option) => option.value === days)?.value ?? 90) as PeriodDays;
}

/** Tanggal awal periode (YYYY-MM-DD) dihitung mundur dari `today`. */
export function periodStart(today: string, days: number): string {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - (days - 1));
  return date.toISOString().slice(0, 10);
}

/** Nomor HP dinormalkan ke 62xxx agar pelanggan yang sama dikenali walau ditulis beda. */
export function customerKey(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("62") ? digits : `62${digits.replace(/^0/, "")}`;
}

const isCounted = (order: Order) => order.status !== "Dibatalkan";

export interface ProductSales {
  productId: string | null;
  productName: string;
  quantity: number;
  revenue: number;
  orders: number;
}

export interface SourceSales {
  source: string;
  orders: number;
  revenue: number;
}

export interface CustomerSummary {
  key: string;
  name: string;
  phone: string;
  orders: number;
  total: number;
  lastOrderDate: string;
}

export interface MarketingSummary {
  orderCount: number;
  cancelledCount: number;
  /** Nilai pesanan yang tidak dibatalkan (termasuk yang belum selesai). */
  orderValue: number;
  /** Penjualan dari pesanan berstatus Selesai. */
  completedRevenue: number;
  averageOrderValue: number;
  uniqueCustomers: number;
  repeatCustomers: number;
  repeatRate: number;
  promoOrders: number;
  promoDiscount: number;
  topProducts: ProductSales[];
  sources: SourceSales[];
  customers: CustomerSummary[];
}

/** Ringkasan pemasaran dari pesanan dalam satu periode. */
export function summarizeMarketing(orders: Order[]): MarketingSummary {
  const counted = orders.filter(isCounted);

  const products = new Map<string, ProductSales>();
  const sources = new Map<string, SourceSales>();
  const customers = new Map<string, CustomerSummary>();

  for (const order of counted) {
    const productKey = order.productId ?? `nama:${order.productName}`;
    const product = products.get(productKey) ?? {
      productId: order.productId,
      productName: order.productName,
      quantity: 0,
      revenue: 0,
      orders: 0,
    };
    product.quantity += order.quantity;
    product.revenue += order.totalAmount;
    product.orders += 1;
    products.set(productKey, product);

    const source = sources.get(order.source) ?? { source: order.source, orders: 0, revenue: 0 };
    source.orders += 1;
    source.revenue += order.totalAmount;
    sources.set(order.source, source);

    const key = customerKey(order.customerPhone);
    const customer = customers.get(key) ?? {
      key,
      name: order.customerName,
      phone: order.customerPhone,
      orders: 0,
      total: 0,
      lastOrderDate: order.orderDate,
    };
    customer.orders += 1;
    customer.total += order.totalAmount;
    if (order.orderDate >= customer.lastOrderDate) {
      customer.lastOrderDate = order.orderDate;
      customer.name = order.customerName;
    }
    customers.set(key, customer);
  }

  const orderValue = counted.reduce((sum, order) => sum + order.totalAmount, 0);
  const repeatCustomers = Array.from(customers.values()).filter((customer) => customer.orders >= 2).length;
  const promoOrders = counted.filter((order) => order.promotionId);

  return {
    orderCount: counted.length,
    cancelledCount: orders.length - counted.length,
    orderValue,
    completedRevenue: counted.filter((order) => order.status === "Selesai").reduce((sum, order) => sum + order.totalAmount, 0),
    averageOrderValue: counted.length > 0 ? Math.round(orderValue / counted.length) : 0,
    uniqueCustomers: customers.size,
    repeatCustomers,
    repeatRate: customers.size > 0 ? Math.round((repeatCustomers / customers.size) * 100) : 0,
    promoOrders: promoOrders.length,
    promoDiscount: promoOrders.reduce((sum, order) => sum + order.discountAmount, 0),
    topProducts: Array.from(products.values()).sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue),
    sources: Array.from(sources.values()).sort((a, b) => b.orders - a.orders),
    customers: Array.from(customers.values()).sort((a, b) => b.total - a.total || b.orders - a.orders),
  };
}

export interface ProductionPlanRow {
  productId: string;
  productName: string;
  /** Jumlah pcs di pesanan berstatus Menunggu/Diproses (semua tanggal). */
  openDemand: number;
  stock: number;
  /** Kekurangan untuk memenuhi pesanan terbuka. */
  shortfall: number;
  /** Rata-rata pcs terjual per minggu dalam periode analisis. */
  weeklySales: number;
  /** Saran jumlah produksi: kekurangan + cadangan ±2 minggu penjualan, dikurangi sisa stok. */
  suggested: number;
}

/**
 * Rencana produksi berbasis data pesanan: penuhi pesanan terbuka dulu,
 * lalu sisakan cadangan kira-kira 2 minggu penjualan.
 */
export function buildProductionPlan(
  products: Pick<Product, "id" | "name" | "stock" | "isActive">[],
  openOrders: Order[],
  periodSales: ProductSales[],
  periodDays: number
): ProductionPlanRow[] {
  const weeks = Math.max(periodDays / 7, 1);
  const demand = new Map<string, number>();
  for (const order of openOrders) {
    if (!order.productId || (order.status !== "Menunggu" && order.status !== "Diproses")) continue;
    demand.set(order.productId, (demand.get(order.productId) ?? 0) + order.quantity);
  }
  const salesById = new Map(periodSales.filter((row) => row.productId).map((row) => [row.productId as string, row.quantity]));

  return products
    .filter((product) => product.isActive || demand.has(product.id))
    .map((product) => {
      const openDemand = demand.get(product.id) ?? 0;
      const weeklySales = Math.round(((salesById.get(product.id) ?? 0) / weeks) * 10) / 10;
      const shortfall = Math.max(0, openDemand - product.stock);
      const buffer = Math.ceil(weeklySales * 2);
      const suggested = Math.max(0, openDemand + buffer - product.stock);
      return { productId: product.id, productName: product.name, openDemand, stock: product.stock, shortfall, weeklySales, suggested };
    })
    .sort((a, b) => b.shortfall - a.shortfall || b.suggested - a.suggested || a.productName.localeCompare(b.productName));
}

/** Periode pembanding: rentang `days` hari tepat sebelum `from`. */
export function previousPeriod(from: string, days: number): { from: string; to: string } {
  const date = new Date(`${from}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  const to = date.toISOString().slice(0, 10);
  return { from: periodStart(to, days), to };
}

/**
 * Perubahan terhadap periode sebelumnya, dalam format kartu statistik.
 * `undefined` bila periode sebelumnya kosong (persentase tidak bermakna).
 */
export function changeVersus(current: number, previous: number): { value: string; direction: "up" | "down" } | undefined {
  if (previous <= 0) return undefined;
  const change = Math.round(((current - previous) / previous) * 100);
  return { value: `${change >= 0 ? "+" : ""}${change}% vs periode sebelumnya`, direction: change >= 0 ? "up" : "down" };
}

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

export interface MonthlyOrderCount {
  /** "YYYY-MM" */
  month: string;
  label: string;
  orders: number;
  value: number;
}

/** Jumlah & nilai pesanan (tidak termasuk batal) per bulan, `count` bulan terakhir sampai `today`. */
export function monthlyOrderCounts(orders: Order[], today: string, count = 6): MonthlyOrderCount[] {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7)) - 1;
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - (count - 1 - index), 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const monthOrders = orders.filter((order) => isCounted(order) && order.orderDate.startsWith(key));
    return {
      month: key,
      label: `${SHORT_MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`,
      orders: monthOrders.length,
      value: monthOrders.reduce((sum, order) => sum + order.totalAmount, 0),
    };
  });
}
