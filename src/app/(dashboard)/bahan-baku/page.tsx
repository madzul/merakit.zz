import Link from "next/link";
import { AlertTriangle, Layers, Plus, Recycle, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { formatQuantity, STOCK_LEVEL_BADGE, STOCK_LEVEL_LABELS, stockLevel } from "@/lib/bahan-baku/constants";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { getMaterials } from "@/lib/supabase/repositories/materials-repository";
import { cn, formatRupiah } from "@/lib/utils";
import type { Material } from "@/lib/types";

const LEVEL_ORDER = { habis: 0, menipis: 1, aman: 2 } as const;

/**
 * Daftar bahan baku — semua pengguna login bisa melihat stok; kelola bahan &
 * catat stok masuk/keluar khusus admin. Pemakaian untuk produksi tercatat
 * otomatis dari resep produk (lihat migration-bahan-baku.sql).
 */
export default async function BahanBakuPage() {
  const [profile, materialsResult] = await Promise.all([
    getCurrentProfile().catch(() => null),
    getMaterials().then(
      (value) => ({ ok: true as const, value }),
      () => ({ ok: false as const, value: [] as Material[] })
    ),
  ]);
  const isAdmin = profile?.role === "admin";

  const materials = [...materialsResult.value].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    const levelDiff = LEVEL_ORDER[stockLevel(a)] - LEVEL_ORDER[stockLevel(b)];
    return levelDiff !== 0 ? levelDiff : a.name.localeCompare(b.name);
  });
  const active = materials.filter((material) => material.isActive);
  const lowStockCount = active.filter((material) => stockLevel(material) !== "aman").length;
  const inventoryValue = active.reduce((sum, material) => sum + Math.max(material.stock, 0) * material.unitCost, 0);

  return (
    <div>
      <PageHeader
        title="Bahan Baku"
        description="Stok benang & bahan lain. Pemakaian untuk produksi dicatat otomatis sesuai resep produk."
        actions={
          <>
            <Link
              href="/bahan-baku/sisa"
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <Recycle className="h-4 w-4" aria-hidden="true" />
              Sisa Bahan
            </Link>
            {isAdmin && (
              <Link
                href="/bahan-baku/tambah"
                className="flex items-center gap-1.5 rounded-lg bg-primary-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-800"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Tambah Bahan
              </Link>
            )}
          </>
        }
      />

      {!materialsResult.ok ? (
        <ErrorState message="Gagal memuat data bahan baku. Muat ulang halaman untuk mencoba lagi." />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Bahan Aktif" value={`${active.length} jenis`} icon={Layers} tone="primary" />
            <StatCard
              label="Perlu Dibeli"
              value={`${lowStockCount} jenis`}
              icon={AlertTriangle}
              tone={lowStockCount > 0 ? "warning" : "success"}
              description="Stok habis atau di bawah minimum"
            />
            <StatCard
              label="Nilai Persediaan"
              value={formatRupiah(inventoryValue)}
              icon={Wallet}
              tone="secondary"
              description="Stok × harga satuan terakhir"
            />
          </div>

          {materials.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-card">
              <EmptyState
                message={
                  isAdmin
                    ? "Belum ada bahan baku. Tambahkan bahan (mis. benang katun) untuk mulai mencatat stok."
                    : "Belum ada bahan baku yang dicatat admin."
                }
              />
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-card">
              <ul className="divide-y divide-neutral-100">
                {materials.map((material) => {
                  const level = stockLevel(material);
                  return (
                    <li key={material.id}>
                      <Link
                        href={`/bahan-baku/${material.id}`}
                        className={cn(
                          "flex flex-col gap-2 px-4 py-3.5 hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between",
                          !material.isActive && "opacity-60"
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-neutral-800">
                            {material.name}
                            {!material.isActive && <span className="ml-2 text-xs text-neutral-400">(nonaktif)</span>}
                          </p>
                          <p className="text-xs text-neutral-500">
                            Minimum {formatQuantity(material.minStock)} {material.unit} ·{" "}
                            {material.unitCost > 0 ? `${formatRupiah(material.unitCost)}/${material.unit}` : "harga belum diisi"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-neutral-800">
                            {formatQuantity(material.stock)} {material.unit}
                          </p>
                          <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STOCK_LEVEL_BADGE[level])}>
                            {STOCK_LEVEL_LABELS[level]}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
