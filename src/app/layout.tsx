import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Font Inter di-self-host (bukan next/font/google) agar proses build tidak
// bergantung pada koneksi keluar ke fonts.googleapis.com saat build time —
// penting di lingkungan CI/sandbox dengan akses jaringan terbatas. Berkas
// variable font (subset latin) diambil dari paket @fontsource-variable/inter.
const inter = localFont({
  src: "./fonts/Inter-Variable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MERAKIT — Merajut Asa Kita",
  description: "Sistem informasi komunitas rajut inklusif MERAKIT.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body
        className={`${inter.variable} min-h-screen overflow-x-hidden bg-neutral-50 font-sans text-neutral-800 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
