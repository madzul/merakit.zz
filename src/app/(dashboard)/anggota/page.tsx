import { Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export default function AnggotaPage() {
  return (
    <div>
      <PageHeader title="Anggota" description="Kelola data anggota komunitas rajut inklusif MERAKIT." />
      <ComingSoon
        title="Manajemen anggota segera hadir"
        description="Halaman untuk menambah, mengubah, dan memantau status keanggotaan sedang dalam pengembangan."
        icon={Users}
      />
    </div>
  );
}
