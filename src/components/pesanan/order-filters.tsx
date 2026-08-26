"use client";

import Link from "next/link";
import { Plus, RotateCcw, Search } from "lucide-react";
import { ORDER_STATUS_FILTER_OPTIONS } from "@/lib/order-status";
import type { OrderStatus } from "@/lib/types";

interface OrderFiltersProps {
  status: OrderStatus | "semua";
  onStatusChange: (value: OrderStatus | "semua") => void;
  search: string;
  onSearchChange: (value: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

const selectClassName =
  "w-full rounded-lg border border-neutral-200 bg-white py-2 pl-3 pr-8 text-sm text-neutral-700 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40";

/** Bar filter status & pencarian nama pemesan, plus tautan tambah pesanan. */
export function OrderFilters({
  status,
  onStatusChange,
  search,
  onSearchChange,
  onReset,
  hasActiveFilters,
}: OrderFiltersProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-card">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-1 lg:flex-wrap lg:items-end">
          <div className="flex flex-col gap-1.5 lg:w-48">
            <label htmlFor="filter-status-pesanan" className="text-xs font-medium text-neutral-600">
              Status
            </label>
            <select
              id="filter-status-pesanan"
              value={status}
              onChange={(event) => onStatusChange(event.target.value as OrderStatus | "semua")}
              className={selectClassName}
            >
              {ORDER_STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:w-72">
            <label htmlFor="filter-pemesan" className="text-xs font-medium text-neutral-600">
              Cari Pemesan
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                aria-hidden="true"
              />
              <input
                id="filter-pemesan"
                type="text"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Cari nama pemesan..."
                className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-700 placeholder:text-neutral-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Reset Filter</span>
          </button>

          <Link
            href="/dashboard/pesanan/tambah"
            className="flex items-center gap-1.5 rounded-lg bg-primary-700 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah Pesanan
          </Link>
        </div>
      </div>
    </div>
  );
}
