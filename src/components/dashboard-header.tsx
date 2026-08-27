"use client";

import { useTransition } from "react";
import { usePathname } from "next/navigation";
import { Menu, Bell, LogOut, LoaderCircle, ChevronRight } from "lucide-react";
import { NAV_ITEMS } from "@/lib/navigation";
import { CURRENT_USER } from "@/lib/mock-data";
import { logout } from "@/lib/auth/actions";

function useBreadcrumbLabel() {
  const pathname = usePathname();
  const current = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  return current?.label ?? "Dashboard";
}

export function DashboardHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const currentLabel = useBreadcrumbLabel();
  const [isLoggingOut, startLogoutTransition] = useTransition();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-neutral-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <button
        onClick={onMenuClick}
        aria-label="Buka menu navigasi"
        className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex min-w-0 items-center gap-1.5 text-sm text-neutral-500">
        <span className="truncate">MERAKIT</span>
        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="truncate font-medium text-neutral-800">{currentLabel}</span>
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <button aria-label="Notifikasi" className="relative rounded-md p-2 text-neutral-600 hover:bg-neutral-100">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white" />
        </button>

        <div className="mx-1 hidden h-8 w-px bg-neutral-200 sm:block" />

        <div className="flex items-center gap-2 rounded-md px-1.5 py-1 sm:px-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
            {CURRENT_USER.avatarInitial}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-medium text-neutral-800">{CURRENT_USER.name}</p>
            <p className="text-xs capitalize text-neutral-500">{CURRENT_USER.role}</p>
          </div>
        </div>

        <button
          aria-label="Keluar"
          disabled={isLoggingOut}
          onClick={() => startLogoutTransition(() => logout())}
          className="rounded-md p-2 text-neutral-500 hover:bg-danger-50 hover:text-danger-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingOut ? (
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <LogOut className="h-5 w-5" />
          )}
        </button>
      </div>
    </header>
  );
}
