import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { OrderPageClient } from "@/components/pesanan/order-page-client";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { getOrders } from "@/lib/supabase/repositories/orders-repository";
import type { Order } from "@/lib/types";

/** Data pesanan — tabel `orders` (Supabase). Admin mengelola; anggota hanya melihat (RLS). */
export default async function PesananPage() {
  let orders: Order[] = [];
  let loadError = false;
  const [profileResult, ordersResult] = await Promise.allSettled([getCurrentProfile(), getOrders()]);
  if (ordersResult.status === "fulfilled") {
    orders = ordersResult.value;
  } else {
    loadError = true;
  }
  const isAdmin = profileResult.status === "fulfilled" && profileResult.value?.role === "admin";

  return (
    <div>
      <PageHeader title="Data Pesanan" description="Pantau dan kelola pesanan yang masuk dari pelanggan." />
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-neutral-100" />}>
        <OrderPageClient orders={orders} loadError={loadError} canManage={isAdmin} />
      </Suspense>
    </div>
  );
}
