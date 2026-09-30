"use client";

import { Download, Printer } from "lucide-react";

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

function escapeCsv(value: string | number): string {
  const text = String(value);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Tombol cetak (bisa "Simpan sebagai PDF" dari dialog cetak browser) dan
 * unduh CSV. Pemisah ";" + BOM UTF-8 agar langsung terbaca benar oleh Excel
 * berbahasa Indonesia.
 */
export function ReportActions({ month, rows }: ReportActionsProps) {
  function handleDownloadCsv() {
    const header = ["Tanggal", "Jenis", "Kategori", "Keterangan", "Jumlah (Rp)"];
    const lines = [header, ...rows.map((row) => [row.date, row.type, row.category, row.description, row.amount])]
      .map((line) => line.map(escapeCsv).join(";"))
      .join("\r\n");
    const blob = new Blob(["﻿" + lines], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan-keuangan-merakit-${month}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
