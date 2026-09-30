import Link from "next/link";

export default function KatalogNotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-xl font-semibold text-neutral-800">Produk tidak ditemukan</h1>
      <p className="mt-2 text-sm text-neutral-500">Produk ini mungkin sudah tidak dijual.</p>
      <Link href="/katalog" className="mt-4 inline-block rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800">
        Lihat katalog
      </Link>
    </div>
  );
}
