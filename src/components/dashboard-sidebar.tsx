"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { NAV_ITEMS } from "@/lib/navigation";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

function BrandMark() {
  return (
    <div className="flex items-center gap-2 px-5 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-white">
        <Sparkles className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold leading-tight text-neutral-800">MERAKIT</p>
        <p className="text-xs leading-tight text-neutral-500">Merajut Asa Kita</p>
      </div>
    </div>
  );
}

function SidebarNav({ onNavigate, role }: { onNavigate?: () => void; role?: UserRole }) {
  const pathname = usePathname();

  // Sembunyikan menu khusus admin (mis. Anggota, Keuangan) dari role "anggota",
  // selaras dengan kebijakan RLS di database (lihat database-schema.sql).
  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || role === "admin");

  // Pilih item nav dengan kecocokan prefix terpanjang, agar mis. "/dashboard"
  // tidak ikut aktif ketika pathname sebenarnya "/dashboard/anggota".
  const activeHref = visibleItems.reduce<string | null>((longest, item) => {
    const matches = pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (!matches) return longest;
    if (!longest || item.href.length > longest.length) return item.href;
    return longest;
  }, null);

  return (
    <nav className="flex flex-col gap-1 px-3">
      {visibleItems.map((item) => {
        const isActive = item.href === activeHref;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary-50 text-primary-700"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800"
            )}
          >
            <Icon className={cn("h-[18px] w-[18px]", isActive ? "text-primary-600" : "text-neutral-400")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardSidebar({ role }: { role?: UserRole }) {
  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-shrink-0 lg:flex-col lg:border-r lg:border-neutral-200 lg:bg-white">
      <BrandMark />
      <SidebarNav role={role} />
      <div className="mt-auto p-4">
        <div className="rounded-lg bg-secondary-50 p-3 text-xs text-neutral-600">
          Komunitas rajut inklusif untuk semua. 🧶
        </div>
      </div>
    </aside>
  );
}

export function MobileSidebar({
  open,
  onOpenChange,
  role,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: UserRole;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Menu navigasi">
      <BrandMark />
      <SidebarNav onNavigate={() => onOpenChange(false)} role={role} />
    </Sheet>
  );
}
