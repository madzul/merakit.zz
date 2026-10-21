import type { Metadata } from "next";
import { OrderLookupForm } from "@/components/katalog/order-lookup-form";

export const metadata: Metadata = {
  title: "Lacak Pesanan — Katalog MERAKIT",
  description: "Cek status pesanan produk rajut MERAKIT dengan kode pesanan dan nomor WhatsApp.",
};

export default function LacakPesananPage() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-800">Lacak Pesanan</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Masukkan kode pesanan (mis. MRK-261021-00001) dan nomor WhatsApp yang dipakai saat memesan.
        </p>
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
        <OrderLookupForm />
      </div>
    </div>
  );
}
