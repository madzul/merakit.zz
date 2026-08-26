import { AlertTriangle, Boxes, ClipboardList, PackagePlus, UserPlus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import type { ActivityItem, ActivityType } from "@/lib/types";

const TYPE_STYLES: Record<ActivityType, { icon: LucideIcon; badge: string }> = {
  produksi: { icon: Boxes, badge: "bg-primary-50 text-primary-600" },
  pesanan: { icon: ClipboardList, badge: "bg-info-50 text-info-600" },
  produk: { icon: PackagePlus, badge: "bg-secondary-100 text-secondary-700" },
  anggota: { icon: UserPlus, badge: "bg-success-50 text-success-600" },
  stok: { icon: AlertTriangle, badge: "bg-warning-50 text-warning-600" },
};

interface RecentActivityCardProps {
  activities: ActivityItem[];
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
      <h2 className="text-sm font-semibold text-neutral-800">Aktivitas Terbaru</h2>
      <p className="mt-1 text-xs text-neutral-500">Riwayat aktivitas komunitas terkini.</p>

      {activities.length === 0 ? (
        <EmptyState className="mt-4" message="Belum ada aktivitas terbaru." />
      ) : (
        <ul className="mt-4 space-y-4">
          {activities.map((activity) => {
            const style = TYPE_STYLES[activity.type];
            const Icon = style.icon;
            return (
              <li key={activity.id} className="flex gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                    style.badge
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-neutral-700">{activity.message}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">{activity.timestamp}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
