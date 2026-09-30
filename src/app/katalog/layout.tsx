import Link from "next/link";
import { MerakitLogo } from "@/components/merakit-logo";

/** Kerangka halaman publik katalog (tanpa login, tanpa sidebar dashboard). */
export default function KatalogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/katalog" aria-label="Katalog MERAKIT" className="flex items-center gap-2">
            <MerakitLogo size="sm" showWordmark={false} />
            <span className="leading-tight">
              <span className="block text-sm font-semibold text-neutral-800">MERAKIT</span>
              <span className="block text-xs text-neutral-500">Rajut Inklusif · Binong, Bandung</span>
            </span>
          </Link>
          <Link href="/login" className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
            Masuk
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl space-y-1 px-4 py-6 text-sm text-neutral-500 sm:px-6">
          <p className="font-medium text-neutral-700">Komunitas Rajut Inklusif MERAKIT (Merajut Asa Kita)</p>
          <p>Kampung Wisata Rajut Binong · Jl. Binong Jati No. 124, Kel. Binong, Kec. Batununggal, Kota Bandung</p>
          <p className="text-xs text-neutral-400">
            Setiap produk dirajut oleh perempuan, pemuda, dan sobat istimewa anggota komunitas MERAKIT.
          </p>
        </div>
      </footer>
    </div>
  );
}
