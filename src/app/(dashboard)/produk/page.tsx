import { redirect } from "next/navigation";

/** Alamat lama — diarahkan ke halaman modul yang sebenarnya. */
export default function LegacyProdukPage() {
  redirect("/dashboard/produk");
}
