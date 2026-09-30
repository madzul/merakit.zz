import { BadgeCheck, Boxes, PackageCheck, PackageX, Timer } from "lucide-react";
import { rejectRate } from "@/lib/produksi/metrics";
import { cn } from "@/lib/utils";
import type { ProductionRecord } from "@/lib/types";

interface ProductionSummaryProps {
  records: ProductionRecord[];
}

/**
 * Ringkasan singkat dari data produksi yang sedang ditampilkan (setelah filter
 * diterapkan) — total catatan, total jumlah produksi, jumlah selesai, dan
 * jumlah yang masih berjalan (diajukan/diproses), plus tingkat cacat dari
 * catatan yang tidak dibatalkan (indikator kualitas untuk laporan PKM).
 */
export function ProductionSummary({ records }: ProductionSummaryProps) {
  const totalRecords = records.length;
  const totalQuantity = records.reduce((sum, record) => sum + record.quantity, 0);
  const completedCount = records.filter((record) => record.status === "selesai").length;
  const quality = rejectRate(records);
  const ongoingCount = records.filter(
    (record) => record.status === "diajukan" || record.status === "diproses"
  ).length;

  const items = [
    {
      label: "Total Catatan",
      value: `${totalRecords}`,
      icon: Boxes,
      tone: "bg-primary-50 text-primary-600",
    },
    {
      label: "Total Jumlah Produksi",
      value: `${totalQuantity} pcs`,
      icon: Timer,
      tone: "bg-secondary-100 text-secondary-700",
    },
    {
      label: "Tingkat Cacat",
      value: quality.total > 0 ? `${quality.percent.toLocaleString("id-ID")}%` : "-",
      hint: quality.total > 0 ? `${quality.rejected} dari ${quality.total} pcs` : "Belum ada data",
      icon: BadgeCheck,
      tone: "bg-danger-50 text-danger-600",
    },
    {
      label: "Selesai",
      value: `${completedCount}`,
      icon: PackageCheck,
      tone: "bg-success-50 text-success-600",
    },
    {
      label: "Masih Berjalan",
      value: `${ongoingCount}`,
      icon: PackageX,
      tone: "bg-warning-50 text-warning-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-card"
        >
          <div className={cn("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg", item.tone)}>
            <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs text-neutral-500">{item.label}</p>
            <p className="text-lg font-semibold text-neutral-800">{item.value}</p>
            {"hint" in item && item.hint && <p className="truncate text-xs text-neutral-400">{item.hint}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
