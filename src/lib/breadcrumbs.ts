import { NAV_ITEMS } from "@/lib/navigation";

export interface Crumb {
  label: string;
  /** Kosong untuk halaman yang sedang dibuka (crumb terakhir). */
  href?: string;
}

/** Label untuk sub-halaman di bawah sebuah menu. */
const SEGMENT_LABELS: Record<string, string> = {
  tambah: "Tambah",
  laporan: "Laporan Bulanan",
};

/**
 * Breadcrumb dari path halaman. Menu dicari berdasarkan kecocokan href
 * TERPANJANG — "/dashboard/produk/..." harus jatuh ke "Produk", bukan ke
 * "Dashboard" yang juga merupakan awalan path tersebut.
 *
 * `isEdit`: halaman "/tambah?id=..." dipakai untuk mengedit data.
 */
export function buildBreadcrumbs(pathname: string, isEdit = false): Crumb[] {
  const path = pathname.replace(/\/+$/, "") || "/";
  const item = NAV_ITEMS.filter((nav) => path === nav.href || path.startsWith(`${nav.href}/`)).sort(
    (a, b) => b.href.length - a.href.length
  )[0];

  if (!item) return [{ label: "Dashboard" }];

  const crumbs: Crumb[] = [{ label: item.label, href: item.href }];
  const rest = path.slice(item.href.length).split("/").filter(Boolean);
  rest.forEach((segment, index) => {
    const label =
      segment === "tambah" && isEdit
        ? "Edit"
        : (SEGMENT_LABELS[segment] ?? (index === 0 ? "Detail" : segment.charAt(0).toUpperCase() + segment.slice(1)));
    crumbs.push({ label, href: `${item.href}/${rest.slice(0, index + 1).join("/")}` });
  });

  // Halaman yang sedang dibuka tidak perlu tautan.
  delete crumbs[crumbs.length - 1].href;
  return crumbs;
}
