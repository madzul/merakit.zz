import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export default function PesananPage() {
  return (
    <div>
      <PageHeader title="Pesanan" description="Pantau dan kelola pesanan yang masuk dari pelanggan." />
      <ComingSoon
        title="Manajemen pesanan segera hadir"
        description="Halaman untuk melacak status pesanan dari mulai diterima hingga selesai dikirim sedang dalam pengembangan."
        icon={ClipboardList}
      />
    </div>
  );
}
