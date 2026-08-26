import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export default function KeuanganPage() {
  return (
    <div>
      <PageHeader title="Keuangan" description="Catat pemasukan dan pengeluaran kas komunitas." />
      <ComingSoon
        title="Pencatatan keuangan segera hadir"
        description="Halaman untuk mencatat transaksi dan melihat ringkasan arus kas sedang dalam pengembangan."
        icon={Wallet}
      />
    </div>
  );
}
