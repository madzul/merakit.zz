import { Icon } from "lucide-react";
import { yarnBall } from "@lucide/lab";
import { cn } from "@/lib/utils";

/** Tinggi area cetak satu halaman A4 dengan margin 15 mm (lihat @page di globals.css). */
const PAGE_HEIGHT = "h-[267mm]";
/** Cukup untuk laporan terpanjang; sisa di luar isi laporan terpotong overflow-hidden. */
const MAX_PAGES = 30;

function Mark() {
  return (
    <div className="flex flex-col items-center opacity-[0.06]">
      <Icon iconNode={yarnBall} className="h-[110mm] w-[110mm] text-primary-700" strokeWidth={1.25} />
      <p className="mt-4 text-[18mm] font-bold leading-none tracking-[0.12em] text-primary-700">MERAKIT</p>
    </div>
  );
}

/**
 * Watermark logo MERAKIT yang hanya muncul saat dicetak / disimpan PDF, di
 * tengah setiap halaman. Dibuat dari garis SVG (bukan background) sehingga
 * tetap tercetak walau opsi "Background graphics" dimatikan.
 *
 * Dua cara, dipilih lewat CSS (globals.css):
 * - Chrome/Edge/Firefox: satu elemen position:fixed — browser mengulangnya di
 *   setiap halaman.
 * - Safari: elemen fixed hanya tercetak sekali, jadi dipakai deretan watermark
 *   setinggi tepat satu halaman (267 mm) di belakang isi laporan.
 *
 * Induknya harus `relative` dan berada di awal halaman cetak.
 */
export function PrintWatermark() {
  return (
    <div aria-hidden="true" className="pointer-events-none hidden select-none print:block">
      <div className="print-watermark-fixed fixed inset-0 flex items-center justify-center">
        <Mark />
      </div>
      <div className="print-watermark-pages absolute inset-0 overflow-hidden">
        {Array.from({ length: MAX_PAGES }, (_, index) => (
          <div key={index} className={cn(PAGE_HEIGHT, "flex items-center justify-center")}>
            <Mark />
          </div>
        ))}
      </div>
    </div>
  );
}
