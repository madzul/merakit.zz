/** Utilitas CSV sisi browser. Pemisah ";" + BOM UTF-8 agar langsung terbaca benar oleh Excel berbahasa Indonesia. */

function escapeCsv(value: string | number): string {
  const text = String(value);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: (string | number)[][]): string {
  return [header, ...rows].map((line) => line.map(escapeCsv).join(";")).join("\r\n");
}

/** Unduh CSV di browser. Hanya dipanggil dari event handler komponen client. */
export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]): void {
  const blob = new Blob(["﻿" + toCsv(header, rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
