"use client";

import { Printer } from "lucide-react";

/** Cetak / simpan manual sebagai PDF lewat dialog cetak browser. */
export function PrintGuideButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 print:hidden"
    >
      <Printer className="h-4 w-4" aria-hidden="true" />
      Cetak / Simpan PDF
    </button>
  );
}
