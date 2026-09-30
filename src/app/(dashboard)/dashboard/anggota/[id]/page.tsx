import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { MemberDetail } from "@/components/anggota/member-detail";
import { getCurrentMemberId, getMemberById } from "@/lib/supabase/repositories/members-repository";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import { getProductionRecordsByMember } from "@/lib/supabase/repositories/production-repository";
import { getLoginAccounts } from "@/lib/supabase/repositories/accounts-repository";
import { MemberAccountLink } from "@/components/anggota/member-account-link";

interface AnggotaDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Detail (& untuk anggota biasa: profil) satu anggota. RLS
 * members_select_admin_or_own di database sudah membatasi baris yang bisa
 * diambil — anggota biasa yang mencoba membuka id milik orang lain akan
 * mendapat `null` dari getMemberById (bukan galat), sehingga tampil sebagai
 * "tidak ditemukan" alih-alih membocorkan info bahwa data itu ada.
 */
export default async function AnggotaDetailPage({ params }: AnggotaDetailPageProps) {
  const { id } = await params;

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const isAdmin = profile.role === "admin";
  const [member, ownMemberId, productionRecords, accounts] = await Promise.all([
    getMemberById(id),
    isAdmin ? Promise.resolve(null) : getCurrentMemberId(),
    // RLS production_select_admin_or_own tetap membatasi baris yang terbaca.
    getProductionRecordsByMember(id).catch(() => []),
    // Daftar akun login hanya untuk admin (kartu "Akun Login").
    isAdmin ? getLoginAccounts().catch(() => null) : Promise.resolve(null),
  ]);

  const canEdit = isAdmin || ownMemberId === id;

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
        <div className="space-y-4">
          <MemberDetail member={member} isAdmin={isAdmin} canEdit={canEdit} productionRecords={productionRecords} />
          {isAdmin && accounts && <MemberAccountLink memberId={member.id} memberName={member.name} accounts={accounts} />}
        </div>
      ) : (
        <EmptyState message="Data anggota tidak ditemukan. Mungkin sudah dihapus atau tautan tidak valid." />
      )}
    </div>
  );
}
