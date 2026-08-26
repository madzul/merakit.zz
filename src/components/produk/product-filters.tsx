"use client";

import Link from "next/link";
import { Plus, RotateCcw, Search } from "lucide-react";
import { PRODUCT_CATEGORY_FILTER_OPTIONS } from "@/lib/product-status";

interface ProductFiltersProps {
  category: string;
  onCategoryChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

const selectClassName =
  "w-full rounded-lg border border-neutral-200 bg-white py-2 pl-3 pr-8 text-sm text-neutral-700 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40";

/** Bar filter kategori & pencarian nama produk, plus tautan tambah produk. */
export function ProductFilters({
  category,
  onCategoryChange,
  search,
  onSearchChange,
  onReset,
  hasActiveFilters,
}: ProductFiltersProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-card">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-1 lg:flex-wrap lg:items-end">
          <div className="flex flex-col gap-1.5 lg:w-48">
            <label htmlFor="filter-kategori" className="text-xs font-medium text-neutral-600">
              Kategori
            </label>
            <select
              id="filter-kategori"
              value={category}
              onChange={(event) => onCategoryChange(event.target.value)}
              className={selectClassName}
            >
              {PRODUCT_CATEGORY_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:w-72">
            <label htmlFor="filter-produk" className="text-xs font-medium text-neutral-600">
              Cari Produk
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                aria-hidden="true"
              />
              <input
                id="filter-produk"
                type="text"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Cari nama produk..."
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
            href="/dashboard/produk/tambah"
            className="flex items-center gap-1.5 rounded-lg bg-primary-700 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah Produk
          </Link>
        </div>
      </div>
    </div>
  );
}
