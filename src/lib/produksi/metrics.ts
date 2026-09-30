import type { ProductionRecord } from "@/lib/types";

/** Catatan yang dihitung untuk indikator (catatan dibatalkan tidak dihitung). */
export const isCountedProduction = (record: ProductionRecord) => record.status !== "dibatalkan";

export interface RejectRate {
  /** Total pcs dari catatan yang dihitung. */
  total: number;
  rejected: number;
  /** Produk layak (Grade A) = total − cacat. */
  good: number;
  /** Persentase cacat, 1 angka desimal. 0 bila belum ada data. */
  percent: number;
}

/** Tingkat cacat/reject dari sekumpulan catatan produksi. */
export function rejectRate(records: ProductionRecord[]): RejectRate {
  const counted = records.filter(isCountedProduction);
  const total = counted.reduce((sum, record) => sum + record.quantity, 0);
  const rejected = counted.reduce((sum, record) => sum + (record.rejectQuantity ?? 0), 0);
  return {
    total,
    rejected,
    good: total - rejected,
    percent: total > 0 ? Math.round((rejected / total) * 1000) / 10 : 0,
  };
}

export interface MemberProductionRecap {
  memberId: string;
  memberName: string;
  /** Jumlah catatan (entri) — bukti keaktifan pencatatan. */
  entries: number;
  quantity: number;
  rejected: number;
  rejectPercent: number;
  completed: number;
  hours: number;
  /** Tanggal catatan terakhir (ISO). */
  lastDate: string;
}

/** Rekap produksi per anggota (catatan dibatalkan tidak dihitung), urut jumlah terbanyak. */
export function recapByMember(records: ProductionRecord[]): MemberProductionRecap[] {
  const byMember = new Map<string, MemberProductionRecap>();
  for (const record of records.filter(isCountedProduction)) {
    const row =
      byMember.get(record.memberId) ??
      ({
        memberId: record.memberId,
        memberName: record.memberName,
        entries: 0,
        quantity: 0,
        rejected: 0,
        rejectPercent: 0,
        completed: 0,
        hours: 0,
        lastDate: record.productionDate,
      } satisfies MemberProductionRecap);
    row.entries += 1;
    row.quantity += record.quantity;
    row.rejected += record.rejectQuantity ?? 0;
    row.hours += record.duration;
    if (record.status === "selesai") row.completed += record.quantity;
    if (record.productionDate > row.lastDate) row.lastDate = record.productionDate;
    byMember.set(record.memberId, row);
  }
  return Array.from(byMember.values())
    .map((row) => ({ ...row, rejectPercent: row.quantity > 0 ? Math.round((row.rejected / row.quantity) * 1000) / 10 : 0 }))
    .sort((a, b) => b.quantity - a.quantity || a.memberName.localeCompare(b.memberName, "id"));
}
