"use client";

import { Download, Printer } from "lucide-react";
import { downloadCsv } from "@/lib/csv";

export interface ReportCsvRow {
  date: string;
  type: string;
  category: string;
  description: string;
  amount: number;
}

interface ReportActionsProps {
  month: string;
  rows: ReportCsvRow[];
}

/**
 * Tombol cetak (bisa "Simpan sebagai PDF" dari dialog cetak browser) dan
 * unduh CSV. Pemisah ";" + BOM UTF-8 agar langsung terbaca benar oleh Excel
 * berbahasa Indonesia.
 */
export function ReportActions({ month, rows }: ReportActionsProps) {
  function handleDownloadCsv() {
    downloadCsv(
      `laporan-keuangan-merakit-${month}.csv`,
      ["Tanggal", "Jenis", "Kategori", "Keterangan", "Jumlah (Rp)"],
      rows.map((row) => [row.date, row.type, row.category, row.description, row.amount])
    );
  }

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button
        type="button"
        onClick={handleDownloadCsv}
        className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Unduh CSV
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="flex items-center gap-1.5 rounded-lg bg-primary-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-800"
      >
        <Printer className="h-4 w-4" aria-hidden="true" />
        Cetak / PDF
      </button>
    </div>
  );
}
