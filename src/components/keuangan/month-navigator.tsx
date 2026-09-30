"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthLabel, shiftMonth } from "@/lib/keuangan/constants";

interface MonthNavigatorProps {
  month: string;
  /** Path dasar, mis. "/keuangan" atau "/keuangan/laporan". */
  basePath: string;
}

/** Pemilih bulan (sebelumnya / berikutnya / pilih langsung) — memperbarui ?bulan=YYYY-MM. */
export function MonthNavigator({ month, basePath }: MonthNavigatorProps) {
  const router = useRouter();

  function goTo(nextMonth: string) {
    router.push(`${basePath}?bulan=${nextMonth}`);
  }

  return (
    <div className="flex items-center gap-1.5 print:hidden">
      <button
        type="button"
        onClick={() => goTo(shiftMonth(month, -1))}
        aria-label="Bulan sebelumnya"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
      <label htmlFor="pilih-bulan" className="sr-only">
        Pilih bulan
      </label>
      <input
        id="pilih-bulan"
        type="month"
        value={month}
        onChange={(event) => event.target.value && goTo(event.target.value)}
        aria-label={`Bulan: ${formatMonthLabel(month)}`}
        className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
      />
      <button
        type="button"
        onClick={() => goTo(shiftMonth(month, 1))}
        aria-label="Bulan berikutnya"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
