import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { MovementForm } from "@/components/bahan-baku/movement-form";
import { MovementHistory } from "@/components/bahan-baku/movement-history";
import { formatQuantity, STOCK_LEVEL_BADGE, STOCK_LEVEL_LABELS, stockLevel } from "@/lib/bahan-baku/constants";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { getMaterialById, getMovements } from "@/lib/supabase/repositories/materials-repository";
import { cn, formatRupiah } from "@/lib/utils";

interface BahanDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BahanDetailPage({ params }: BahanDetailPageProps) {
  const { id } = await params;
  const [profile, material, movements] = await Promise.all([
    getCurrentProfile().catch(() => null),
    getMaterialById(id).catch(() => null),
    getMovements({ materialId: id }).catch(() => []),
  ]);
  const isAdmin = profile?.role === "admin";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());

  const backLink = (
    <Link href="/bahan-baku" className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Kembali
    </Link>
  );

  if (!material) {
    return (
      <div>
        <PageHeader title="Bahan Tidak Ditemukan" actions={backLink} />
        <EmptyState message="Data bahan baku tidak ditemukan. Mungkin sudah dihapus atau tautan tidak valid." />
      </div>
    );
  }

  const level = stockLevel(material);

  return (
    <div>
      <PageHeader
        title={material.name}
        description={material.notes || "Detail stok dan riwayat pergerakan bahan."}
        actions={
          <>
            {backLink}
            {isAdmin && (
              <Link href={`/bahan-baku/tambah?id=${material.id}`} className="flex items-center gap-1.5 rounded-lg bg-primary-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-800">
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit
              </Link>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
            <p className="text-sm text-neutral-500">Stok saat ini</p>
            <p className="mt-1 text-3xl font-semibold text-neutral-800">
              {formatQuantity(material.stock)} <span className="text-base font-normal text-neutral-500">{material.unit}</span>
            </p>
            <span className={cn("mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium", STOCK_LEVEL_BADGE[level])}>
              {STOCK_LEVEL_LABELS[level]}
            </span>
            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-neutral-500">Stok minimum</dt>
                <dd className="text-neutral-800">
                  {formatQuantity(material.minStock)} {material.unit}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-neutral-500">Harga terakhir</dt>
                <dd className="text-neutral-800">{material.unitCost > 0 ? `${formatRupiah(material.unitCost)}/${material.unit}` : "-"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-neutral-500">Nilai persediaan</dt>
                <dd className="font-medium text-neutral-800">{formatRupiah(Math.max(material.stock, 0) * material.unitCost)}</dd>
              </div>
            </dl>
          </div>

          {isAdmin && <MovementForm material={material} today={today} />}
        </div>

        <div className="lg:col-span-2">
          <MovementHistory movements={movements} unit={material.unit} canManage={isAdmin} />
        </div>
      </div>
    </div>
  );
}
