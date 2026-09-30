"use client";

import { Fragment, Suspense, useTransition } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, Bell, LogOut, LoaderCircle, ChevronRight, KeyRound } from "lucide-react";
import { buildBreadcrumbs } from "@/lib/breadcrumbs";
import { logout } from "@/lib/auth/actions";
import type { UserRole } from "@/lib/types";

export interface HeaderProfile {
  name: string;
  role: UserRole;
  avatarInitial: string;
}

function BreadcrumbTrail({ isEdit }: { isEdit: boolean }) {
  const pathname = usePathname();
  const crumbs = [{ label: "MERAKIT", href: "/dashboard" }, ...buildBreadcrumbs(pathname, isEdit)];

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm text-neutral-500">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <Fragment key={`${index}-${crumb.label}`}>
              {/* Di layar kecil hanya halaman aktif yang tampil agar tidak terpotong. */}
              <li className={isLast ? "min-w-0" : "hidden min-w-0 sm:block"}>
                {isLast || !crumb.href ? (
                  <span aria-current={isLast ? "page" : undefined} className={isLast ? "block truncate font-medium text-neutral-800" : "block truncate"}>
                    {crumb.label}
                  </span>
                ) : (
                  <Link href={crumb.href} className="block truncate hover:text-primary-700 hover:underline">
                    {crumb.label}
                  </Link>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" className="hidden flex-shrink-0 sm:block">
                  <ChevronRight className="h-3.5 w-3.5" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

/** Halaman "/tambah?id=..." dipakai untuk mengedit — butuh query string. */
function BreadcrumbWithQuery() {
  const searchParams = useSearchParams();
  return <BreadcrumbTrail isEdit={searchParams.has("id")} />;
}

function Breadcrumbs() {
  // useSearchParams wajib dibungkus Suspense; sementara itu tampilkan versi tanpa query.
  return (
    <Suspense fallback={<BreadcrumbTrail isEdit={false} />}>
      <BreadcrumbWithQuery />
    </Suspense>
  );
}

export function DashboardHeader({
  onMenuClick,
  profile,
}: {
  onMenuClick: () => void;
  /** Profil pengguna yang sedang login (dari Supabase), null selagi dimuat. */
  profile: HeaderProfile | null;
}) {
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

      <Breadcrumbs />

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <button aria-label="Notifikasi" className="relative rounded-md p-2 text-neutral-600 hover:bg-neutral-100">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white" />
        </button>

        <div className="mx-1 hidden h-8 w-px bg-neutral-200 sm:block" />

        <div className="flex items-center gap-2 rounded-md px-1.5 py-1 sm:px-2">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700"
            aria-hidden="true"
          >
            {profile?.avatarInitial ?? "…"}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-medium text-neutral-800">{profile?.name ?? "Memuat…"}</p>
            <p className="text-xs capitalize text-neutral-500">{profile?.role ?? ""}</p>
          </div>
        </div>

        <Link
          href="/reset-password"
          aria-label="Ganti kata sandi"
          title="Ganti kata sandi"
          className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
        >
          <KeyRound className="h-5 w-5" aria-hidden="true" />
        </Link>

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
