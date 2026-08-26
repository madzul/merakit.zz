import { BadgePercent } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export default function PromoPage() {
  return (
    <div>
      <PageHeader title="Promo & Diskon" description="Kelola kode promo dan diskon untuk pelanggan." />
      <ComingSoon
        title="Pengelolaan promo segera hadir"
        description="Halaman untuk membuat dan mengatur kode diskon sedang dalam pengembangan."
        icon={BadgePercent}
      />
    </div>
  );
}
