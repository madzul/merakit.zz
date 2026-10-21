import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SaleDetailClient } from "@/components/penjualan/sale-detail-client";
import { siteOrigin } from "@/lib/katalog";
import { getOnlineSaleById, getPaymentProofUrl } from "@/lib/supabase/repositories/online-sales-repository";

interface PenjualanDetailPageProps {
  params: Promise<{ id: string }>;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PenjualanDetailPage({ params }: PenjualanDetailPageProps) {
  const { id } = await params;
  const sale = UUID_PATTERN.test(id) ? await getOnlineSaleById(id).catch(() => null) : null;
  const proofUrl = sale?.paymentProofPath ? await getPaymentProofUrl(sale.paymentProofPath) : null;
  // Halaman admin (sudah login) — header Host cukup sebagai cadangan bila NEXT_PUBLIC_SITE_URL kosong.
  let origin = siteOrigin();
  if (!origin) {
    const host = (await headers()).get("host");
    origin = host ? `${process.env.NODE_ENV === "development" ? "http" : "https"}://${host}` : "";
  }
  const trackingUrl = sale ? `${origin}/katalog/pesanan/${sale.publicToken}` : "";

  return (
    <div>
      <PageHeader
        title={sale ? `Penjualan ${sale.code}` : "Penjualan Tidak Ditemukan"}
        description={sale ? `${sale.customerName} · ${sale.items.length} jenis produk` : undefined}
        actions={
          <Link
            href="/penjualan"
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Kembali
          </Link>
        }
      />
      {sale ? (
        <SaleDetailClient key={`${sale.id}-${sale.status}-${sale.paymentStatus}`} sale={sale} proofUrl={proofUrl} trackingUrl={trackingUrl} />
      ) : (
        <EmptyState message="Data penjualan tidak ditemukan. Mungkin sudah dihapus atau tautan tidak valid." />
      )}
    </div>
  );
}
