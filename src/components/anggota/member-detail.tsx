"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CalendarDays, MessageCircle, Pencil, Phone } from "lucide-react";
import { cn, formatDate, formatPhoneDisplay, getAvatarColorClass, toWhatsAppLink } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { PRODUCTION_STATUS_BADGE_STYLES, PRODUCTION_STATUS_LABELS } from "@/lib/production-status";
import { MEMBER_STATUS_BADGE_STYLES, MEMBER_STATUS_LABELS } from "@/lib/member-status";
import { PRODUCTION_RECORDS } from "@/lib/mock-data";
import type { Member } from "@/lib/types";

interface MemberDetailProps {
  member: Member;
  /** True jika viewer boleh mengedit profil ini (admin, atau ini profilnya sendiri). */
  canEdit?: boolean;
  /**
   * True hanya untuk role admin. Mengontrol tampil/tidaknya bagian "Catatan
   * Pendampingan (Internal)" — data sensitif (lihat catatan privasi pada
   * tipe `Member`) yang TETAP disembunyikan dari anggota biasa walau sedang
   * melihat profilnya sendiri.
   */
  isAdmin?: boolean;
}

/**
 * Detail anggota. Dipakai baik oleh admin (melihat siapa saja) maupun
 * anggota biasa (hanya bisa sampai di sini untuk profilnya sendiri — dibatasi
 * RLS members_select_admin_or_own). Bagian "Catatan Pendampingan (Internal)"
 * berisi keterangan kebutuhan dukungan yang sensitif — selalu disembunyikan
 * dari non-admin, siapa pun subjeknya.
 */
export function MemberDetail({ member, canEdit = false, isAdmin = false }: MemberDetailProps) {
  const productionHistory = useMemo(
    () =>
      PRODUCTION_RECORDS.filter((record) => record.memberName === member.name).sort((a, b) =>
        b.productionDate.localeCompare(a.productionDate)
      ),
    [member.name]
  );

  const totalProduction = useMemo(
    () =>
      productionHistory
        .filter((record) => record.status === "selesai")
        .reduce((sum, record) => sum + record.quantity, 0),
    [productionHistory]
  );

  const productsWorkedOn = useMemo(
    () => Array.from(new Set(productionHistory.map((record) => record.productName))),
    [productionHistory]
  );

  return (
    <div className="space-y-4">
      {/* Identitas */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span
              className={cn(
                "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full text-lg font-semibold",
                getAvatarColorClass(member.id)
              )}
            >
              {member.avatar}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-neutral-800">{member.name}</h2>
              <span
                className={cn(
                  "mt-1 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                  MEMBER_STATUS_BADGE_STYLES[member.status]
                )}
              >
                {MEMBER_STATUS_LABELS[member.status]}
              </span>

              <dl className="mt-3 space-y-1.5 text-sm text-neutral-600">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
                  <dt className="sr-only">Telepon</dt>
                  <dd>{formatPhoneDisplay(member.phone)}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
                  <dt className="sr-only">Tanggal bergabung</dt>
                  <dd>Bergabung sejak {formatDate(member.joinedAt)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="flex flex-shrink-0 gap-2">
            <a
              href={toWhatsAppLink(member.phone)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-success-500/30 px-3.5 py-2 text-sm font-medium text-success-600 hover:bg-success-50"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </a>
            {canEdit && (
              <Link
                href={`/dashboard/anggota/tambah?id=${member.id}`}
                className="flex items-center gap-1.5 rounded-lg bg-primary-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-800"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Statistik produksi */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
          <p className="text-sm font-medium text-neutral-500">Total Produksi (selesai)</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-800">{totalProduction} pcs</p>
          <p className="mt-1 text-xs text-neutral-400">Akumulasi seluruh riwayat produksi.</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
          <p className="text-sm font-medium text-neutral-500">Produksi Bulan Ini</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-800">{member.monthlyProduction} pcs</p>
          <p className="mt-1 text-xs text-neutral-400">Diperbarui setiap laporan produksi masuk.</p>
        </div>
      </div>

      {/* Produk yang dikerjakan */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card sm:p-6">
        <h3 className="text-sm font-semibold text-neutral-800">Produk yang Dikerjakan</h3>
        {productsWorkedOn.length === 0 ? (
          <EmptyState className="mt-3" message="Belum ada produk yang tercatat untuk anggota ini." />
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {productsWorkedOn.map((product) => (
              <span
                key={product}
                className="rounded-full bg-secondary-100 px-3 py-1 text-xs font-medium text-secondary-700"
              >
                {product}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Riwayat produksi */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card sm:p-6">
        <h3 className="text-sm font-semibold text-neutral-800">Riwayat Produksi</h3>
        {productionHistory.length === 0 ? (
          <EmptyState className="mt-3" message="Belum ada riwayat produksi untuk anggota ini." />
        ) : (
          <div className="mt-3 space-y-2">
            {productionHistory.map((record) => (
              <div
                key={record.id}
                className="flex flex-col gap-1 rounded-lg border border-neutral-100 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-800">{record.productName}</p>
                  <p className="text-xs text-neutral-500">
                    {formatDate(record.productionDate)} &middot; {record.quantity} pcs
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium",
                    PRODUCTION_STATUS_BADGE_STYLES[record.status]
                  )}
                >
                  {PRODUCTION_STATUS_LABELS[record.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Catatan pendampingan — internal/admin, disembunyikan dari anggota biasa */}
      {isAdmin && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card sm:p-6">
          <h3 className="text-sm font-semibold text-neutral-800">Catatan Pendampingan (Internal)</h3>
          <p className="mt-1 text-xs text-neutral-400">
            Informasi berikut sensitif dan hanya terlihat oleh admin/pengurus, tidak ditampilkan pada halaman publik.
          </p>
          <div className="mt-3 space-y-3 text-sm text-neutral-600">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Keterangan Kebutuhan Dukungan
              </p>
              <p className="mt-1">{member.disabilityDescription || "Tidak ada keterangan khusus."}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Catatan</p>
              <p className="mt-1">{member.notes || "Belum ada catatan pendampingan."}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
