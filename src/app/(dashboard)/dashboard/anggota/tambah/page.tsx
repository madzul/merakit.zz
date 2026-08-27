import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { MemberForm } from "@/components/anggota/member-form";
import { getCurrentMemberId, getMemberById } from "@/lib/supabase/repositories/members-repository";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";

interface TambahAnggotaPageProps {
  searchParams: Promise<{ id?: string }>;
}

/**
 * Form tambah anggota baru (admin saja) & edit anggota (admin untuk siapa
 * saja, anggota biasa hanya untuk profilnya sendiri — via ?id=<member id
 * miliknya sendiri>). middleware.ts sudah memblokir akses tanpa "id" untuk
 * non-admin; pengecekan di bawah ini adalah lapisan kedua sekaligus yang
 * menentukan mode form (admin/self) & data awalnya.
 */
export default async function TambahAnggotaPage({ searchParams }: TambahAnggotaPageProps) {
  const { id: editId } = await searchParams;

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }
  const isAdmin = profile.role === "admin";

  if (!editId) {
    if (!isAdmin) {
      redirect("/dashboard/anggota");
    }
    return (
      <div>
        <PageHeader
          title="Tambah Anggota"
          description="Daftarkan anggota baru komunitas rajut inklusif MERAKIT."
        />
        <MemberForm mode="admin" />
      </div>
    );
  }

  const existingMember = await getMemberById(editId);
  if (!existingMember) {
    // RLS sudah mengembalikan null bila data tidak ada ATAU bukan milik
    // pengguna ini — keduanya diarahkan kembali tanpa membocorkan mana yang benar.
    redirect("/dashboard/anggota");
  }

  if (!isAdmin) {
    const ownMemberId = await getCurrentMemberId();
    if (ownMemberId !== editId) {
      redirect("/dashboard/anggota");
    }
  }

  return (
    <div>
      <PageHeader
        title={isAdmin ? "Edit Anggota" : "Edit Profil Saya"}
        description={
          isAdmin
            ? "Perbarui data anggota komunitas rajut inklusif MERAKIT."
            : "Perbarui nama & nomor telepon/WhatsApp Anda."
        }
      />
      <MemberForm member={existingMember} mode={isAdmin ? "admin" : "self"} />
    </div>
  );
}
