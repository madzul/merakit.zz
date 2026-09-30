import { ORDER_SALES_LABEL } from "@/lib/keuangan/constants";
import type { Order, Transaction } from "@/lib/types";

export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
}

export interface MonthlyFinanceReport {
  /** Penjualan otomatis dari pesanan berstatus "Selesai" pada bulan tsb. */
  orderSales: number;
  orderSalesCount: number;
  manualIncome: number;
  totalIncome: number;
  totalExpense: number;
  /** Surplus (+) atau defisit (−) bulan ini. */
  net: number;
  incomeByCategory: CategoryTotal[];
  expenseByCategory: CategoryTotal[];
}

function groupByCategory(transactions: Transaction[]): CategoryTotal[] {
  const map = new Map<string, CategoryTotal>();
  for (const transaction of transactions) {
    const entry = map.get(transaction.category) ?? { category: transaction.category, total: 0, count: 0 };
    entry.total += transaction.amount;
    entry.count += 1;
    map.set(transaction.category, entry);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

/**
 * Ringkasan arus kas satu bulan: transaksi manual (tabel `expenses`) +
 * penjualan otomatis dari pesanan selesai (tabel `orders`).
 */
export function buildMonthlyReport(transactions: Transaction[], orders: Order[]): MonthlyFinanceReport {
  const completedOrders = orders.filter((order) => order.status === "Selesai");
  const orderSales = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  const income = transactions.filter((transaction) => transaction.type === "pemasukan");
  const expense = transactions.filter((transaction) => transaction.type === "pengeluaran");
  const manualIncome = income.reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalExpense = expense.reduce((sum, transaction) => sum + transaction.amount, 0);

  const incomeByCategory = groupByCategory(income);
  if (orderSales > 0) {
    incomeByCategory.unshift({ category: ORDER_SALES_LABEL, total: orderSales, count: completedOrders.length });
  }

  const totalIncome = orderSales + manualIncome;
  return {
    orderSales,
    orderSalesCount: completedOrders.length,
    manualIncome,
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    incomeByCategory,
    expenseByCategory: groupByCategory(expense),
  };
}

export interface CashflowPoint {
  /** "YYYY-MM" */
  month: string;
  /** Label singkat untuk sumbu grafik, mis. "Sep". */
  label: string;
  pemasukan: number;
  pengeluaran: number;
  saldo: number;
}

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

/**
 * Arus kas per bulan untuk daftar `months` ("YYYY-MM", urut lama → baru),
 * memakai aturan yang sama dengan buildMonthlyReport.
 */
export function buildCashflowTrend(months: string[], transactions: Transaction[], orders: Order[]): CashflowPoint[] {
  return months.map((month) => {
    const report = buildMonthlyReport(
      transactions.filter((transaction) => transaction.date.startsWith(month)),
      orders.filter((order) => order.orderDate.startsWith(month))
    );
    return {
      month,
      label: SHORT_MONTHS[Number(month.slice(5, 7)) - 1],
      pemasukan: report.totalIncome,
      pengeluaran: report.totalExpense,
      saldo: report.net,
    };
  });
}
