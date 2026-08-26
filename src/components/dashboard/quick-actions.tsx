import Link from "next/link";
import { ClipboardPlus, FilePlus2, PackagePlus, UserPlus, type LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import type { QuickAction, QuickActionKey } from "@/lib/types";

const ACTION_ICONS: Record<QuickActionKey, LucideIcon> = {
  produksi: ClipboardPlus,
  anggota: UserPlus,
  produk: PackagePlus,
  pesanan: FilePlus2,
};

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
      <h2 className="text-sm font-semibold text-neutral-800">Aksi Cepat</h2>
      <p className="mt-1 text-xs text-neutral-500">Pintasan untuk tugas yang sering dilakukan.</p>

      {actions.length === 0 ? (
        <EmptyState className="mt-4" message="Belum ada aksi cepat yang tersedia." />
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {actions.map((action) => {
            const Icon = ACTION_ICONS[action.key];
            return (
              <Link
                key={action.id}
                href={action.href}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:border-primary-300 hover:bg-primary-50"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-800">{action.label}</p>
                  <p className="truncate text-xs text-neutral-500">{action.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
