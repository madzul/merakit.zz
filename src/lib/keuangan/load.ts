import { getExpensesBetween } from "@/lib/supabase/repositories/expenses-repository";
import { getOrdersBetween } from "@/lib/supabase/repositories/orders-repository";
import { buildCashflowTrend, buildMonthlyReport, type CashflowPoint, type MonthlyFinanceReport } from "@/lib/keuangan/report";
import { monthRange, shiftMonth } from "@/lib/keuangan/constants";
import type { Order, Transaction } from "@/lib/types";

export interface MonthlyFinanceData {
  transactions: Transaction[];
  completedOrders: Order[];
  report: MonthlyFinanceReport;
  loadError: boolean;
}

/** Muat transaksi & pesanan selesai satu bulan, lalu hitung ringkasannya. */
export async function loadMonthlyFinance(month: string): Promise<MonthlyFinanceData> {
  const { from, to } = monthRange(month);
  const [transactionsResult, ordersResult] = await Promise.allSettled([
    getExpensesBetween(from, to),
    getOrdersBetween(from, to),
  ]);
  const transactions = transactionsResult.status === "fulfilled" ? transactionsResult.value : [];
  const orders = ordersResult.status === "fulfilled" ? ordersResult.value : [];
  const completedOrders = orders.filter((order) => order.status === "Selesai");

  return {
    transactions,
    completedOrders,
    report: buildMonthlyReport(transactions, completedOrders),
    loadError: transactionsResult.status === "rejected" || ordersResult.status === "rejected",
  };
}

/** Arus kas `count` bulan sampai `month` (termasuk), untuk grafik pemasukan vs pengeluaran. */
export async function loadCashflowTrend(month: string, count = 6): Promise<{ points: CashflowPoint[]; loadError: boolean }> {
  const months = Array.from({ length: count }, (_, index) => shiftMonth(month, index - (count - 1)));
  const from = monthRange(months[0]).from;
  const to = monthRange(month).to;
  const [transactionsResult, ordersResult] = await Promise.allSettled([getExpensesBetween(from, to), getOrdersBetween(from, to)]);
  const transactions = transactionsResult.status === "fulfilled" ? transactionsResult.value : [];
  const orders = ordersResult.status === "fulfilled" ? ordersResult.value : [];
  return {
    points: buildCashflowTrend(months, transactions, orders),
    loadError: transactionsResult.status === "rejected" || ordersResult.status === "rejected",
  };
}
