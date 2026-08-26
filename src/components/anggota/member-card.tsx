"use client";

import Link from "next/link";
import { MessageCircle, Pencil, Trash2 } from "lucide-react";
import { cn, formatPhoneDisplay, getAvatarColorClass, toWhatsAppLink } from "@/lib/utils";
import { MEMBER_STATUS_BADGE_STYLES, MEMBER_STATUS_LABELS } from "@/lib/member-status";
import type { Member } from "@/lib/types";

interface MemberCardProps {
  member: Member;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
}

/**
 * Kartu anggota untuk tampilan mobile (menggantikan baris tabel di layar
 * sempit). Keterangan kebutuhan dukungan hanya tampil di sini karena
 * komponen ini dipakai di area admin (dashboard di balik login), bukan
 * halaman publik.
 */
export function MemberCard({ member, onEdit, onDelete }: MemberCardProps) {
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/dashboard/anggota/${member.id}`} className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              getAvatarColorClass(member.id)
            )}
          >
            {member.avatar}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-800">{member.name}</p>
            <p className="truncate text-xs text-neutral-500">{formatPhoneDisplay(member.phone)}</p>
          </div>
        </Link>
        <span
          className={cn(
            "flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
            MEMBER_STATUS_BADGE_STYLES[member.status]
          )}
        >
          {MEMBER_STATUS_LABELS[member.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600">
        <p>
          <span className="text-neutral-400">Produksi bulan ini: </span>
          {member.monthlyProduction} pcs
        </p>
        <p>
          <span className="text-neutral-400">Bergabung: </span>
          {member.joinedAt}
        </p>
      </div>

      <p className="text-xs text-neutral-500">
        <span className="text-neutral-400">Keterangan: </span>
        {member.disabilityDescription || "-"}
      </p>

      <div className="flex items-center justify-between gap-2 pt-1">
        <a
          href={toWhatsAppLink(member.phone)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-md border border-success-500/30 px-2.5 py-1.5 text-xs font-medium text-success-600 hover:bg-success-50"
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
          WhatsApp
        </a>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(member)}
            className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(member)}
            className="flex items-center gap-1.5 rounded-md border border-danger-200 px-2.5 py-1.5 text-xs font-medium text-danger-600 hover:bg-danger-50"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
