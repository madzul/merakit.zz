import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export default function PemasaranPage() {
  return (
    <div>
      <PageHeader title="Pemasaran" description="Kelola kampanye promosi produk rajut komunitas." />
      <ComingSoon
        title="Manajemen pemasaran segera hadir"
        description="Halaman untuk merencanakan dan memantau kampanye pemasaran sedang dalam pengembangan."
        icon={Megaphone}
      />
    </div>
  );
}
