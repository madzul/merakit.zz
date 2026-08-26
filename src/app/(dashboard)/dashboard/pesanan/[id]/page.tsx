"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { OrderDetail } from "@/components/pesanan/order-detail";
import { getOrderById } from "@/lib/order-store";

export default function PesananDetailPage() {
  const params = useParams<{ id: string }>();
  const order = getOrderById(params.id);

  return (
    <div>
      <PageHeader
        title={order ? `Pesanan — ${order.customerName}` : "Pesanan Tidak Ditemukan"}
        description="Detail pesanan, rincian produk, dan status."
        actions={
          <Link
            href="/dashboard/pesanan"
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Kembali
          </Link>
        }
      />

      {order ? (
        <OrderDetail order={order} />
      ) : (
        <EmptyState message="Data pesanan tidak ditemukan. Mungkin sudah dihapus atau tautan tidak valid." />
      )}
    </div>
  );
}
