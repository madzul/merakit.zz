import type { OrderStatus } from "@/lib/types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  Menunggu: "Menunggu",
  Diproses: "Diproses",
  Selesai: "Selesai",
  Dibatalkan: "Dibatalkan",
};

export const ORDER_STATUS_BADGE_STYLES: Record<OrderStatus, string> = {
  Menunggu: "bg-warning-50 text-warning-600",
  Diproses: "bg-info-50 text-info-600",
  Selesai: "bg-success-50 text-success-600",
  Dibatalkan: "bg-danger-50 text-danger-600",
};

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = (
  Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]
).map((value) => ({ value, label: ORDER_STATUS_LABELS[value] }));

export const ORDER_STATUS_FILTER_OPTIONS: { value: OrderStatus | "semua"; label: string }[] = [
  { value: "semua", label: "Semua Status" },
  ...ORDER_STATUS_OPTIONS,
];
