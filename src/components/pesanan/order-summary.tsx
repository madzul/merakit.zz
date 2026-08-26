import { Boxes, Clock, PackageCheck, Wallet } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { Order } from "@/lib/types";

interface OrderSummaryProps {
  orders: Order[];
}

/**
 * Ringkasan singkat dari data pesanan yang sedang ditampilkan (setelah
 * filter diterapkan): total produk dipesan, total pendapatan (pesanan
 * selesai), jumlah pesanan menunggu, dan jumlah pesanan diproses.
 */
export function OrderSummary({ orders }: OrderSummaryProps) {
  const totalProductsOrdered = orders.reduce((sum, order) => sum + order.quantity, 0);
  const totalRevenue = orders
    .filter((order) => order.status === "Selesai")
    .reduce((sum, order) => sum + order.totalAmount, 0);
  const waitingCount = orders.filter((order) => order.status === "Menunggu").length;
  const processingCount = orders.filter((order) => order.status === "Diproses").length;

  const items = [
    {
      label: "Total Produk Dipesan",
      value: `${totalProductsOrdered} pcs`,
      icon: Boxes,
      tone: "bg-primary-50 text-primary-600",
    },
    {
      label: "Total Pendapatan",
      value: formatCurrency(totalRevenue),
      icon: Wallet,
      tone: "bg-success-50 text-success-600",
    },
    {
      label: "Pesanan Menunggu",
      value: `${waitingCount}`,
      icon: Clock,
      tone: "bg-warning-50 text-warning-600",
    },
    {
      label: "Pesanan Diproses",
      value: `${processingCount}`,
      icon: PackageCheck,
      tone: "bg-info-50 text-info-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-card"
        >
          <div className={cn("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg", item.tone)}>
            <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs text-neutral-500">{item.label}</p>
            <p className="text-lg font-semibold text-neutral-800">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
