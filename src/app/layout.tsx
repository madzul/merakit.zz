import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
