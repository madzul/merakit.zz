import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { MemberListClient } from "@/components/anggota/member-list-client";
import { getCurrentMemberId, getMembers } from "@/lib/supabase/repositories/members-repository";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";

/**
 * Daftar anggota — hanya admin yang melihat daftar lengkap semua anggota
 * (dengan aksi tambah/edit/hapus). Anggota biasa yang membuka menu ini
 * langsung diarahkan ke halaman detail profilnya sendiri (lihat
 * [id]/page.tsx), sesuai kebijakan "anggota hanya bisa melihat & mengedit
 * profilnya sendiri" — juga ditegakkan di RLS members_select_admin_or_own /
 * members_update_admin_or_own (database-schema.sql).
 */
export default async function AnggotaPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "admin") {
    const ownMemberId = await getCurrentMemberId();
    if (ownMemberId) {
      redirect(`/dashboard/anggota/${ownMemberId}`);
    }
    // Profil "anggota" ada tapi belum terhubung ke baris members mana pun —
    // kasus tepi (mis. akun baru dibuat admin, belum dilengkapi datanya).
    return (
      <div>
        <PageHeader
          title="Profil Anggota"
          description="Data keanggotaan Anda belum terhubung ke akun ini."
        />
        <EmptyState message="Profil anggota Anda belum terhubung. Hubungi admin untuk menautkan akun Anda ke data keanggotaan." />
      </div>
    );
  }

  let members: Awaited<ReturnType<typeof getMembers>> = [];
  let loadError = false;
  try {
    members = await getMembers();
  } catch {
    loadError = true;
  }

  return (
    <div>
      <PageHeader
        title="Daftar Anggota"
        description="Kelola data anggota komunitas rajut inklusif MERAKIT."
        actions={
          <Link
            href="/dashboard/anggota/tambah"
            className="flex items-center gap-1.5 rounded-lg bg-primary-700 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah Anggota
          </Link>
        }
      />

      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-neutral-100" />}>
        <MemberListClient initialMembers={members} initialLoadError={loadError} />
      </Suspense>
    </div>
  );
}
