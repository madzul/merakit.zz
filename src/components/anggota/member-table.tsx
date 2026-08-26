"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { cn, formatPhoneDisplay, getAvatarColorClass, toWhatsAppLink } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MemberCard } from "@/components/anggota/member-card";
import { MEMBER_STATUS_BADGE_STYLES, MEMBER_STATUS_LABELS } from "@/lib/member-status";
import type { Member } from "@/lib/types";

interface MemberTableProps {
  members: Member[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalMembers: number;
  onPageChange: (page: number) => void;
  onDelete: (member: Member) => void;
}

const COLUMN_COUNT = 6;

/**
 * Tabel daftar anggota untuk desktop/tablet, dengan tampilan kartu (lihat
 * `MemberCard`) di mobile. Kolom "Keterangan" berisi data kebutuhan
 * dukungan yang sensitif — komponen ini hanya dipakai di area admin.
 */
export function MemberTable({
  members,
  loading,
  page,
  totalPages,
  totalMembers,
  onPageChange,
  onDelete,
}: MemberTableProps) {
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState(false);

  function handleEdit(member: Member) {
    router.push(`/dashboard/anggota/tambah?id=${member.id}`);
  }

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    // Simulasi proses penghapusan (data dummy, belum terhubung backend/database).
    window.setTimeout(() => {
      onDelete(pendingDelete);
      setDeleting(false);
      setPendingDelete(null);
    }, 500);
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-card">
      {/* Desktop / tablet */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs font-medium uppercase tracking-wide text-neutral-500">
              <th className="px-4 py-3">Anggota</th>
              <th className="px-4 py-3">Telepon/WhatsApp</th>
              <th className="px-4 py-3">Produksi Bulan Ini</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Keterangan</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <TableSkeletonRows />
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-4 py-10">
                  <EmptyState message="Tidak ada anggota yang sesuai dengan pencarian/filter." />
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="text-neutral-700">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/anggota/${member.id}`} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                          getAvatarColorClass(member.id)
                        )}
                      >
                        {member.avatar}
                      </span>
                      <span className="font-medium text-neutral-800 hover:text-primary-700">{member.name}</span>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <a
                      href={toWhatsAppLink(member.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-neutral-600 hover:text-success-600"
                    >
                      <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatPhoneDisplay(member.phone)}
                    </a>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{member.monthlyProduction} pcs</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                        MEMBER_STATUS_BADGE_STYLES[member.status]
                      )}
                    >
                      {MEMBER_STATUS_LABELS[member.status]}
                    </span>
                  </td>
                  <td
                    className="max-w-[220px] truncate px-4 py-3 text-neutral-500"
                    title={member.disabilityDescription || "-"}
                  >
                    {member.disabilityDescription || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(member)}
                        aria-label={`Edit anggota ${member.name}`}
                        className="rounded-md p-1.5 text-neutral-500 hover:bg-primary-50 hover:text-primary-700"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(member)}
                        aria-label={`Hapus anggota ${member.name}`}
                        className="rounded-md p-1.5 text-neutral-500 hover:bg-danger-50 hover:text-danger-600"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: kartu menggantikan tabel */}
      <div className="divide-y divide-neutral-100 sm:hidden">
        {loading ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-neutral-100" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="p-4">
            <EmptyState message="Tidak ada anggota yang sesuai dengan pencarian/filter." />
          </div>
        ) : (
          members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onEdit={handleEdit}
              onDelete={(m) => setPendingDelete(m)}
            />
          ))
        )}
      </div>

      {/* Pagination (dummy — hanya mengiris data lokal, belum terhubung backend) */}
      {!loading && totalMembers > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-neutral-100 px-4 py-3 sm:flex-row">
          <p className="text-xs text-neutral-500">
            Menampilkan halaman {page} dari {totalPages} ({totalMembers} anggota)
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label="Halaman sebelumnya"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium",
                  p === page
                    ? "bg-primary-700 text-white"
                    : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                )}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              aria-label="Halaman berikutnya"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Hapus anggota?"
        description={
          pendingDelete
            ? `Data anggota "${pendingDelete.name}" akan dihapus dan tidak dapat dikembalikan.`
            : undefined
        }
        confirmLabel="Ya, Hapus"
        tone="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />
    </div>
  );
}

function TableSkeletonRows() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <tr key={i}>
          {Array.from({ length: COLUMN_COUNT }, (_, cellIndex) => (
            <td key={cellIndex} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded bg-neutral-100" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
