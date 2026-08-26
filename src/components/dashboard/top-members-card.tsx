import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import type { TopMember } from "@/lib/types";

const RANK_STYLES = ["bg-primary-500 text-white", "bg-secondary-500 text-white", "bg-neutral-300 text-neutral-700"];

interface TopMembersCardProps {
  members: TopMember[];
}

export function TopMembersCard({ members }: TopMembersCardProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
      <h2 className="text-sm font-semibold text-neutral-800">Anggota Aktif Teratas</h2>
      <p className="mt-1 text-xs text-neutral-500">Berdasarkan jumlah produksi bulan ini.</p>

      {members.length === 0 ? (
        <EmptyState className="mt-4" message="Belum ada data anggota aktif." />
      ) : (
        <ul className="mt-4 space-y-3">
          {members.map((member, index) => (
            <li key={member.id} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  RANK_STYLES[index] ?? "bg-neutral-200 text-neutral-600"
                )}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-800">{member.name}</p>
                <p className="truncate text-xs text-neutral-500">{member.role}</p>
              </div>
              <span className="flex-shrink-0 text-sm font-semibold text-primary-700">
                {member.contribution} {member.unit}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
