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

/**
 * Data anggota komunitas rajut inklusif (modul Data Anggota — tahap 5).
 * Seluruh data masih dummy (in-memory), belum terhubung database/backend.
 *
 * Catatan privasi: `disabilityDescription` & `notes` berisi keterangan
 * kebutuhan dukungan/pendampingan yang sifatnya sensitif. Field ini HANYA
 * ditampilkan pada area admin (dashboard di balik login), dan tidak boleh
 * dirender pada halaman publik mana pun. Gunakan istilah yang hormat dan
 * tidak stigmatis (person-first, fokus pada kebutuhan dukungan, bukan label).
 */
export interface Member {
  id: string;
  name: string;
  /** Nomor telepon/WhatsApp, format internasional tanpa "+", mis. "6281234567890". */
  phone: string;
  /** Inisial nama untuk avatar (dummy, tanpa foto/URL eksternal), mis. "RM". */
  avatar: string;
  /** Keterangan kebutuhan dukungan — data sensitif, khusus area admin. */
  disabilityDescription: string;
  /** Jumlah produksi (pcs) pada bulan berjalan. */
  monthlyProduction: number;
  status: MemberStatus;
  /** Tanggal bergabung, format ISO ("YYYY-MM-DD"). */
  joinedAt: string;
  /** Catatan pendampingan dari pengurus/admin. */
  notes: string;
}

/**
 * Status ringkas untuk `ProductListItem` (dipakai dropdown pilih produk pada
 * modul Data Produksi). Terpisah dari `Product` (katalog produk — tahap 6)
 * agar kedua modul bisa berkembang independen tanpa saling memutus tipe.
 */
export type ProductListStatus = "tersedia" | "stok menipis" | "habis";

/** Item produk ringkas — hanya dipakai untuk dropdown pilih produk di modul Data Produksi. */
export interface ProductListItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: ProductListStatus;
}

/**
 * Status ringkas untuk `OrderListItem` (data placeholder, belum dipakai oleh
 * komponen mana pun). Terpisah dari `OrderStatus`/`Order` (modul Data
 * Pesanan — tahap 6) agar tidak saling memutus tipe.
 */
export type OrderListStatus = "menunggu" | "diproses" | "dikirim" | "selesai" | "dibatalkan";

/** Ringkasan pesanan (data placeholder untuk kebutuhan lain di masa depan). */
export interface OrderListItem {
  id: string;
  orderNumber: string;
  customerName: string;
  itemCount: number;
  total: number;
  status: OrderListStatus;
  date: string;
}

/**
 * Kategori katalog produk (modul Katalog Produk — tahap 6). Data masih dummy
 * (in-memory), belum terhubung database/backend/Supabase.
 */
export const PRODUCT_CATEGORIES = ["Syal", "Tas", "Topi", "Dekorasi Rumah", "Aksesoris"] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/**
 * Produk katalog MERAKIT (modul Katalog Produk — tahap 6). Data masih dummy
 * (in-memory), belum terhubung database/backend/Supabase.
 */
export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  /** Path gambar placeholder lokal (mis. "/products/placeholder-1.svg"), bukan URL eksternal. */
  imageUrl: string;
  isActive: boolean;
  /** Tanggal dibuat, format ISO ("YYYY-MM-DD"). */
  createdAt: string;
}

/**
 * Status pesanan (modul Data Pesanan — tahap 6). Menggunakan istilah
 * berkapital sesuai spesifikasi tahap 6.
 */
export type OrderStatus = "Menunggu" | "Diproses" | "Selesai" | "Dibatalkan";

/**
 * Pesanan pelanggan (modul Data Pesanan — tahap 6). Data masih dummy
 * (in-memory), belum terhubung database/backend/Supabase.
 */
export interface Order {
  id: string;
  /** Tanggal pesanan, format ISO ("YYYY-MM-DD"). */
  orderDate: string;
  customerName: string;
  /** Nomor telepon/WhatsApp pemesan, format internasional tanpa "+", mis. "6281234567890". */
  customerPhone: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: OrderStatus;
  notes: string;
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
