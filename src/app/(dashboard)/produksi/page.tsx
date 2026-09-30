import { PageHeader } from "@/components/page-header";
import { ProductionPageClient } from "@/components/produksi/production-page-client";
import { getProductionRecords } from "@/lib/supabase/repositories/production-repository";
import type { ProductionRecord } from "@/lib/types";

/**
 * Riwayat produksi — data diambil dari tabel `production_records` (Supabase).
 * Admin melihat semua catatan; anggota hanya catatan miliknya (RLS).
 */
export default async function ProduksiPage() {
  let records: ProductionRecord[] = [];
  let loadError = false;
  try {
    records = await getProductionRecords();
  } catch {
    loadError = true;
  }

  return (
    <div>
      <PageHeader
        title="Riwayat Produksi"
        description="Catat dan pantau proses produksi produk rajut anggota komunitas."
      />
      <ProductionPageClient records={records} loadError={loadError} />
    </div>
  );
}
