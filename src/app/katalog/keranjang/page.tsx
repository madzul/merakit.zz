import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CheckoutClient } from "@/components/katalog/checkout-client";
import { getShippingZones } from "@/lib/supabase/repositories/online-sales-repository";
import { isMidtransEnabled } from "@/lib/penjualan/midtrans";
import { isNotificationEnabled } from "@/lib/penjualan/notifications";
import { isLiveShippingEnabled } from "@/lib/penjualan/shipping-quote";
import type { ShippingZone } from "@/lib/types";

export const metadata: Metadata = {
  title: "Keranjang — Katalog MERAKIT",
  robots: { index: false },
};

export default async function KeranjangPage() {
  let zones: ShippingZone[] = [];
  try {
    zones = await getShippingZones(true);
  } catch {
    // Tabel belum dibuat (migrasi belum dijalankan) — checkout akan menolak dengan pesan jelas.
  }

  return (
    <div className="space-y-4">
      <Link href="/katalog" className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-primary-700">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Lanjut belanja
      </Link>
      <h1 className="text-2xl font-semibold text-neutral-800">Keranjang &amp; Pemesanan</h1>
      <CheckoutClient zones={zones} onlinePaymentEnabled={isMidtransEnabled()} notificationsEnabled={isNotificationEnabled()}
        liveShippingEnabled={isLiveShippingEnabled()}
      />
    </div>
  );
}
