import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { MemberDetail } from "@/components/anggota/member-detail";
import { getMemberById } from "@/lib/member-store";

interface AnggotaDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AnggotaDetailPage({ params }: AnggotaDetailPageProps) {
  const { id } = await params;
  const member = getMemberById(id);

  return (
    <div>
      <PageHeader
        title={member ? member.name : "Anggota Tidak Ditemukan"}
        description="Detail identitas, produksi, dan pendampingan anggota."
        actions={
          <Link
            href="/dashboard/anggota"
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Kembali
          </Link>
        }
      />

      {member ? (
        <MemberDetail member={member} />
      ) : (
        <EmptyState message="Data anggota tidak ditemukan. Mungkin sudah dihapus atau tautan tidak valid." />
      )}
    </div>
  );
}
