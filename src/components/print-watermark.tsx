import { Icon } from "lucide-react";
import { yarnBall } from "@lucide/lab";

/**
 * Watermark logo MERAKIT yang hanya muncul saat dicetak / disimpan PDF.
 * `position: fixed` di media print diulang browser di setiap halaman, jadi
 * logo tampil di tengah tiap lembar. Dibuat dari garis (stroke) SVG, bukan
 * background, sehingga tetap tercetak walau opsi "Background graphics" mati.
 * Opasitas rendah dan pointer-events-none agar tidak mengganggu isi laporan.
 */
export function PrintWatermark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 hidden select-none flex-col items-center justify-center opacity-[0.06] print:flex"
    >
      <Icon iconNode={yarnBall} className="h-[110mm] w-[110mm] text-primary-700" strokeWidth={1.25} />
      <p className="mt-4 text-[18mm] font-bold leading-none tracking-[0.12em] text-primary-700">MERAKIT</p>
    </div>
  );
}
