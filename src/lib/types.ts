import type { LucideIcon } from "lucide-react";

export type UserRole = "admin" | "anggota";

export interface CurrentUser {
  id: string;
  name: string;
  role: UserRole;
  avatarInitial: string;
  email: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export type StatCardTone =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type DashboardStatIcon = "Boxes" | "ClipboardList" | "Users" | "Wallet" | "ShoppingBag";

export interface DashboardStat {
  label: string;
  value: string;
  icon: DashboardStatIcon;
  tone: StatCardTone;
  trend?: { value: string; direction: "up" | "down" };
}

export interface ProductionTrendPoint {
  bulan: string;
  jumlah: number;
}

/** Titik data gabungan untuk grafik Produksi & Penjualan pada halaman dashboard. */
export interface ProductionSalesPoint {
  bulan: string;
  produksi: number;
  penjualan: number;
}

export type MaterialStockStatus = "aman" | "menipis" | "habis";

export interface MaterialStockItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  status: MaterialStockStatus;
}

export interface TopMember {
  id: string;
  name: string;
  role: string;
  contribution: number;
  unit: string;
}

export type ActivityType = "produksi" | "pesanan" | "produk" | "anggota" | "stok";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string;
}

export type QuickActionKey = "produksi" | "anggota" | "produk" | "pesanan";

export interface QuickAction {
  id: string;
  key: QuickActionKey;
  label: string;
  description: string;
  href: string;
}

export type ProductionStatus = "diajukan" | "diproses" | "selesai" | "dibatalkan";

/**
 * Catatan produksi anggota komunitas (modul Data Produksi — tahap 4).
 * `productionDate` & `id` disimpan sebagai string (ISO date / dummy id) karena
 * seluruh data pada modul ini masih berupa data dummy TypeScript, belum
 * terhubung ke database/backend sungguhan.
 */
export interface ProductionRecord {
  id: string;
  productionDate: string;
  memberName: string;
  productName: string;
  quantity: number;
  duration: number;
  status: ProductionStatus;
  notes: string;
}

export type MemberStatus = "aktif" | "nonaktif";

export interface Member {
  id: string;
  name: string;
  role: string;
  city: string;
  joinDate: string;
  status: MemberStatus;
}

export type ProductStatus = "tersedia" | "stok menipis" | "habis";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
}

export type OrderStatus = "menunggu" | "diproses" | "dikirim" | "selesai" | "dibatalkan";

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  itemCount: number;
  total: number;
  status: OrderStatus;
  date: string;
}

export type TransactionType = "pemasukan" | "pengeluaran";

export interface Transaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  type: TransactionType;
  date: string;
}

export type CampaignStatus = "draf" | "aktif" | "selesai";

export interface Campaign {
  id: string;
  title: string;
  channel: string;
  reach: number;
  status: CampaignStatus;
  date: string;
}

export type PromoStatus = "aktif" | "nonaktif" | "kedaluwarsa";

export interface Promo {
  id: string;
  code: string;
  description: string;
  discountType: "persen" | "nominal";
  discountValue: number;
  validUntil: string;
  status: PromoStatus;
}
