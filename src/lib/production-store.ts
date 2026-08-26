import { PRODUCTION_RECORDS } from "@/lib/mock-data";
import type { ProductionRecord } from "@/lib/types";

/**
 * Store data dummy in-memory untuk modul Data Produksi.
 *
 * Catatan: ini BUKAN state management global/backend sungguhan — hanya array
 * bertingkat modul (module-level) yang menyalin `PRODUCTION_RECORDS` sebagai
 * seed awal, agar tambah/ubah/hapus data terasa nyata selama satu sesi
 * pengguna tanpa perlu Supabase atau API eksternal. Data akan kembali ke seed
 * awal setiap kali aplikasi di-reload penuh.
 */
let records: ProductionRecord[] = [...PRODUCTION_RECORDS];
let nextId = records.length + 1;

export function getProductionRecords(): ProductionRecord[] {
  return records;
}

export function getProductionRecordById(id: string): ProductionRecord | undefined {
  return records.find((record) => record.id === id);
}

export function addProductionRecord(input: Omit<ProductionRecord, "id">): ProductionRecord {
  const newRecord: ProductionRecord = { ...input, id: `prod-${nextId++}` };
  records = [newRecord, ...records];
  return newRecord;
}

export function updateProductionRecord(
  id: string,
  input: Omit<ProductionRecord, "id">
): ProductionRecord | undefined {
  let updated: ProductionRecord | undefined;
  records = records.map((record) => {
    if (record.id !== id) return record;
    updated = { ...input, id };
    return updated;
  });
  return updated;
}

export function deleteProductionRecord(id: string): void {
  records = records.filter((record) => record.id !== id);
}
