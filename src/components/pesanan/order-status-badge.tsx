import { cn } from "@/lib/utils";
import { ORDER_STATUS_BADGE_STYLES, ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { OrderStatus } from "@/lib/types";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

/** Badge status pesanan (Menunggu/Diproses/Selesai/Dibatalkan). */
export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        ORDER_STATUS_BADGE_STYLES[status],
        className
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
