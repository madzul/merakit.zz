import {
  LayoutDashboard,
  Boxes,
  Users,
  ShoppingBag,
  ClipboardList,
  Wallet,
  Megaphone,
  BadgePercent,
} from "lucide-react";
import type { NavItem } from "@/lib/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Data Produksi", href: "/produksi", icon: Boxes },
  // Tidak lagi adminOnly: anggota tetap bisa membuka menu ini untuk melihat
  // & mengedit profilnya sendiri (di-redirect otomatis ke halaman detailnya
  // sendiri); hanya admin yang melihat daftar lengkap semua anggota.
  { label: "Anggota", href: "/dashboard/anggota", icon: Users },
  { label: "Produk", href: "/dashboard/produk", icon: ShoppingBag },
  { label: "Pesanan", href: "/dashboard/pesanan", icon: ClipboardList },
  { label: "Keuangan", href: "/keuangan", icon: Wallet, adminOnly: true },
  { label: "Pemasaran", href: "/pemasaran", icon: Megaphone },
  { label: "Promo & Diskon", href: "/promo", icon: BadgePercent },
];
