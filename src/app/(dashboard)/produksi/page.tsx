"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ProductionSummary } from "@/components/produksi/production-summary";
import { ProductionFilters } from "@/components/produksi/production-filters";
import { ProductionTable } from "@/components/produksi/production-table";
import { MEMBERS } from "@/lib/mock-data";
import { getProductionRecords, deleteProductionRecord } from "@/lib/production-store";
import { isWithinPeriod, type ProductionPeriod } from "@/lib/production-status";
import type { ProductionRecord } from "@/lib/types";

const PAGE_SIZE = 5;

export default function ProduksiPage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<ProductionRecord[]>([]);

  const [period, setPeriod] = useState<ProductionPeriod>("semua");
  const [member, setMember] = useState<string>("semua");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Simulasi pemanggilan data (data dummy, belum terhubung backend/Supabase).
  // `loading` sudah diinisialisasi `true` di atas, jadi cukup di-nonaktifkan
  // setelah data "termuat" tanpa memanggil setState sinkron di badan efek.
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setRecords(getProductionRecords());
      setLoading(false);
    }, 500);
    return () => window.clearTimeout(timeout);
  }, []);

  const referenceDate = useMemo(() => new Date(), []);

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

  function handleDelete(id: string) {
    deleteProductionRecord(id);
    setRecords(getProductionRecords());
  }

  return (
    <div>
      <PageHeader
        title="Riwayat Produksi"
        description="Catat dan pantau proses produksi produk rajut anggota komunitas."
      />

      <div className="space-y-4">
        <ProductionSummary records={filteredRecords} />

        <ProductionFilters
          period={period}
          onPeriodChange={handleFilterChange(setPeriod)}
          member={member}
          onMemberChange={handleFilterChange(setMember)}
          memberOptions={MEMBERS.map((m) => m.name)}
          search={search}
          onSearchChange={handleFilterChange(setSearch)}
          onReset={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        />

        <ProductionTable
          records={paginatedRecords}
          loading={loading}
          page={safePage}
          totalPages={totalPages}
          totalRecords={filteredRecords.length}
          onPageChange={setPage}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
