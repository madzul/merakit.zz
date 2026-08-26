import { ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export default function ProdukPage() {
  return (
    <div>
      <PageHeader title="Produk" description="Kelola katalog produk rajut yang dihasilkan komunitas." />
      <ComingSoon
        title="Katalog produk segera hadir"
        description="Halaman untuk mengelola daftar produk, harga, dan stok sedang dalam pengembangan."
        icon={ShoppingBag}
      />
    </div>
  );
}
