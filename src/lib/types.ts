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

export type DashboardStatIcon = "Boxes" | "ClipboardList" | "Users" | "Wallet";

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

export type ProductionStatus = "diajukan" | "diproses" | "selesai" | "dibatalkan";

export interface ProductionRecord {
  id: string;
  productName: string;
  memberName: string;
  quantity: number;
  unit: string;
  status: ProductionStatus;
  date: string;
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
