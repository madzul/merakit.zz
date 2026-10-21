import {
  PAYMENT_STATUS_BADGE_STYLES,
  PAYMENT_STATUS_LABELS,
  SALE_STATUS_BADGE_STYLES,
  SALE_STATUS_LABELS,
} from "@/lib/penjualan/constants";
import { cn } from "@/lib/utils";
import type { OnlinePaymentStatus, OnlineSaleStatus } from "@/lib/types";

export function PaymentStatusBadge({ status, className }: { status: OnlinePaymentStatus; className?: string }) {
  return (
    <span className={cn("inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium", PAYMENT_STATUS_BADGE_STYLES[status], className)}>
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  );
}

export function SaleStatusBadge({ status, className }: { status: OnlineSaleStatus; className?: string }) {
  return (
    <span className={cn("inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium", SALE_STATUS_BADGE_STYLES[status], className)}>
      {SALE_STATUS_LABELS[status]}
    </span>
  );
}
