"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/error-state";
import { ProductionSummary } from "@/components/produksi/production-summary";
import { ProductionFilters } from "@/components/produksi/production-filters";
import { ProductionTable } from "@/components/produksi/production-table";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { deleteProductionAction } from "@/lib/produksi/actions";
import { isWithinPeriod, type ProductionPeriod } from "@/lib/production-status";
import type { ProductionRecord } from "@/lib/types";

const PAGE_SIZE = 5;

interface ProductionPageClientProps {
  records: ProductionRecord[];
  loadError: boolean;
}

/** Bagian interaktif halaman Riwayat Produksi (filter, paginasi, hapus). Data dimuat di server. */
export function ProductionPageClient({ records, loadError }: ProductionPageClientProps) {
  const router = useRouter();
  const { toast, showToast, dismissToast } = useToast();

  const [period, setPeriod] = useState<ProductionPeriod>("semua");
  const [member, setMember] = useState<string>("semua");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const referenceDate = useMemo(() => new Date(), []);

  const memberOptions = useMemo(
    () => Array.from(new Set(records.map((record) => record.memberName))).sort((a, b) => a.localeCompare(b)),
    [records]
  );

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      if (!isWithinPeriod(record.productionDate, period, referenceDate)) return false;
      if (member !== "semua" && record.memberName !== member) return false;
      if (query && !record.productName.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [records, period, member, search, referenceDate]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedRecords = filteredRecords.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasActiveFilters = period !== "semua" || member !== "semua" || search.trim() !== "";

  function handleResetFilters() {
    setPeriod("semua");
    setMember("semua");
    setSearch("");
    setPage(1);
  }

  function handleFilterChange<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  async function handleDelete(id: string) {
    const result = await deleteProductionAction(id);
    if (result.error) {
      showToast(result.error, "danger");
      return;
    }
    showToast("Catatan produksi berhasil dihapus.", "success");
    router.refresh();
  }

  if (loadError) {
    return (
      <ErrorState
        message="Gagal memuat data produksi. Periksa koneksi Anda dan coba lagi."
        onRetry={() => router.refresh()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <ProductionSummary records={filteredRecords} />

      <ProductionFilters
        period={period}
        onPeriodChange={handleFilterChange(setPeriod)}
        member={member}
        onMemberChange={handleFilterChange(setMember)}
        memberOptions={memberOptions}
        search={search}
        onSearchChange={handleFilterChange(setSearch)}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <ProductionTable
        records={paginatedRecords}
        loading={false}
        page={safePage}
        totalPages={totalPages}
        totalRecords={filteredRecords.length}
        onPageChange={setPage}
        onDelete={handleDelete}
      />

      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
