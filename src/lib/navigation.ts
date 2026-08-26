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
  { label: "Anggota", href: "/anggota", icon: Users },
  { label: "Produk", href: "/produk", icon: ShoppingBag },
  { label: "Pesanan", href: "/pesanan", icon: ClipboardList },
  { label: "Keuangan", href: "/keuangan", icon: Wallet },
  { label: "Pemasaran", href: "/pemasaran", icon: Megaphone },
  { label: "Promo & Diskon", href: "/promo", icon: BadgePercent },
];
