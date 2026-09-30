import { getExpensesBetween } from "@/lib/supabase/repositories/expenses-repository";
import { getOrdersBetween } from "@/lib/supabase/repositories/orders-repository";
import { buildMonthlyReport, type MonthlyFinanceReport } from "@/lib/keuangan/report";
import { monthRange } from "@/lib/keuangan/constants";
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
