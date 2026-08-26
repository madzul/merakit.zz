"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, RotateCcw, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/error-state";
import { MemberTable } from "@/components/anggota/member-table";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { getMembers, deleteMember } from "@/lib/member-store";
import { MEMBER_STATUS_FILTER_OPTIONS } from "@/lib/member-status";
import type { Member, MemberStatus } from "@/lib/types";

const PAGE_SIZE = 5;

function AnggotaPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast, showToast, dismissToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [status, setStatus] = useState<MemberStatus | "semua">("semua");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    // Simulasi pemanggilan data (data dummy, belum terhubung backend/database).
    // Sesekali disimulasikan gagal untuk mendemonstrasikan error state.
    const timeout = window.setTimeout(() => {
      const shouldFail = Math.random() < 0.15;
      if (shouldFail) {
        setLoadError(true);
        setLoading(false);
        return;
      }
      setMembers(getMembers());
      setLoading(false);
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [loadAttempt]);

  // Toast simulasi setelah redirect dari form tambah/edit.
  useEffect(() => {
    const toastParam = searchParams.get("toast");
    if (toastParam === "created") {
      showToast("Anggota baru berhasil ditambahkan.", "success");
    } else if (toastParam === "updated") {
      showToast("Data anggota berhasil diperbarui.", "success");
    }
    if (toastParam) {
      router.replace("/dashboard/anggota");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return members.filter((member) => {
      if (status !== "semua" && member.status !== status) return false;
      if (query && !member.name.toLowerCase().includes(query) && !member.phone.includes(query)) return false;
      return true;
    });
  }, [members, status, search]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedMembers = filteredMembers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasActiveFilters = status !== "semua" || search.trim() !== "";

  function handleFilterChange<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function handleResetFilters() {
    setStatus("semua");
    setSearch("");
    setPage(1);
  }

  function handleDelete(member: Member) {
    deleteMember(member.id);
    setMembers(getMembers());
    showToast(`Anggota "${member.name}" berhasil dihapus.`, "danger");
  }

  function handleRetry() {
    setLoading(true);
    setLoadError(false);
    setLoadAttempt((attempt) => attempt + 1);
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

      {loadError ? (
        <ErrorState
          message="Gagal memuat data anggota. Periksa koneksi Anda dan coba lagi."
          onRetry={handleRetry}
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-card">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-1 lg:flex-wrap lg:items-end">
                <div className="flex flex-col gap-1.5 lg:w-48">
                  <label htmlFor="filter-status" className="text-xs font-medium text-neutral-600">
                    Status
                  </label>
                  <select
                    id="filter-status"
                    value={status}
                    onChange={(event) =>
                      handleFilterChange(setStatus)(event.target.value as MemberStatus | "semua")
                    }
                    className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-3 pr-8 text-sm text-neutral-700 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  >
                    {MEMBER_STATUS_FILTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2 lg:w-72">
                  <label htmlFor="filter-search" className="text-xs font-medium text-neutral-600">
                    Cari Anggota
                  </label>
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                      aria-hidden="true"
                    />
                    <input
                      id="filter-search"
                      type="text"
                      value={search}
                      onChange={(event) => handleFilterChange(setSearch)(event.target.value)}
                      placeholder="Cari nama atau nomor telepon..."
                      className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-700 placeholder:text-neutral-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  disabled={!hasActiveFilters}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Reset Filter</span>
                </button>
              </div>
            </div>
          </div>

          <MemberTable
            members={paginatedMembers}
            loading={loading}
            page={safePage}
            totalPages={totalPages}
            totalMembers={filteredMembers.length}
            onPageChange={setPage}
            onDelete={handleDelete}
          />
        </div>
      )}

      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

export default function AnggotaPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-neutral-100" />}>
      <AnggotaPageContent />
    </Suspense>
  );
}
