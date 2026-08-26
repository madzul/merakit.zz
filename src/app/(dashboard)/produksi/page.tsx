import { Boxes } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export default function ProduksiPage() {
  return (
    <div>
      <PageHeader
        title="Data Produksi"
        description="Catat dan pantau proses produksi produk rajut anggota komunitas."
      />
      <ComingSoon
        title="Pencatatan produksi segera hadir"
        description="Halaman untuk mencatat dan melacak progres produksi produk rajut sedang dalam pengembangan."
        icon={Boxes}
      />
    </div>
  );
}
