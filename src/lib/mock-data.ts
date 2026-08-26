import type {
  CurrentUser,
  ProductionRecord,
  Member,
  Product,
  Order,
  Transaction,
  Campaign,
  Promo,
  DashboardStat,
  ProductionTrendPoint,
} from "@/lib/types";

export const CURRENT_USER: CurrentUser = {
  id: "usr-001",
  name: "Bu Sri Wahyuni",
  role: "admin",
  avatarInitial: "SW",
  email: "sri.wahyuni@merakit.id",
};

export const PRODUCTION_RECORDS: ProductionRecord[] = [
  { id: "prod-1", productName: "Syal Rajut Motif Bunga", memberName: "Rina Marlina", quantity: 12, unit: "pcs", status: "selesai", date: "2026-08-20" },
  { id: "prod-2", productName: "Tas Rajut Serut", memberName: "Dewi Anggraini", quantity: 8, unit: "pcs", status: "diproses", date: "2026-08-22" },
  { id: "prod-3", productName: "Topi Rajut Anak", memberName: "Wulan Sari", quantity: 20, unit: "pcs", status: "diajukan", date: "2026-08-23" },
  { id: "prod-4", productName: "Sarung Bantal Rajut", memberName: "Rina Marlina", quantity: 15, unit: "pcs", status: "selesai", date: "2026-08-18" },
  { id: "prod-5", productName: "Dompet Rajut Mini", memberName: "Yuni Kartika", quantity: 10, unit: "pcs", status: "dibatalkan", date: "2026-08-15" },
];

export const MEMBERS: Member[] = [
  { id: "mem-1", name: "Rina Marlina", role: "Perajin Senior", city: "Bandung", joinDate: "2023-02-10", status: "aktif" },
  { id: "mem-2", name: "Dewi Anggraini", role: "Perajin", city: "Cimahi", joinDate: "2023-06-01", status: "aktif" },
  { id: "mem-3", name: "Wulan Sari", role: "Perajin", city: "Bandung", joinDate: "2024-01-15", status: "aktif" },
  { id: "mem-4", name: "Yuni Kartika", role: "Pengurus", city: "Bandung", joinDate: "2022-11-20", status: "aktif" },
  { id: "mem-5", name: "Siti Aminah", role: "Perajin", city: "Sumedang", joinDate: "2024-05-05", status: "nonaktif" },
];

export const PRODUCTS: Product[] = [
  { id: "prd-1", name: "Syal Rajut Motif Bunga", category: "Syal", price: 85000, stock: 24, status: "tersedia" },
  { id: "prd-2", name: "Tas Rajut Serut", category: "Tas", price: 120000, stock: 6, status: "stok menipis" },
  { id: "prd-3", name: "Topi Rajut Anak", category: "Topi", price: 45000, stock: 0, status: "habis" },
  { id: "prd-4", name: "Sarung Bantal Rajut", category: "Dekorasi Rumah", price: 65000, stock: 18, status: "tersedia" },
  { id: "prd-5", name: "Dompet Rajut Mini", category: "Aksesoris", price: 40000, stock: 30, status: "tersedia" },
];

export const ORDERS: Order[] = [
  { id: "ord-1", orderNumber: "INV-2026-0091", customerName: "Melati Putri", itemCount: 2, total: 170000, status: "diproses", date: "2026-08-24" },
  { id: "ord-2", orderNumber: "INV-2026-0090", customerName: "Agus Setiawan", itemCount: 1, total: 120000, status: "dikirim", date: "2026-08-23" },
  { id: "ord-3", orderNumber: "INV-2026-0089", customerName: "Nadia Ramadhani", itemCount: 3, total: 210000, status: "selesai", date: "2026-08-21" },
  { id: "ord-4", orderNumber: "INV-2026-0088", customerName: "Bagus Prasetyo", itemCount: 1, total: 45000, status: "menunggu", date: "2026-08-25" },
  { id: "ord-5", orderNumber: "INV-2026-0087", customerName: "Citra Lestari", itemCount: 2, total: 130000, status: "dibatalkan", date: "2026-08-19" },
];

export const TRANSACTIONS: Transaction[] = [
  { id: "trx-1", description: "Penjualan produk - INV-2026-0089", category: "Penjualan", amount: 210000, type: "pemasukan", date: "2026-08-21" },
  { id: "trx-2", description: "Pembelian benang wol", category: "Bahan Baku", amount: 350000, type: "pengeluaran", date: "2026-08-20" },
  { id: "trx-3", description: "Penjualan produk - INV-2026-0090", category: "Penjualan", amount: 120000, type: "pemasukan", date: "2026-08-23" },
  { id: "trx-4", description: "Ongkos kirim pesanan", category: "Operasional", amount: 45000, type: "pengeluaran", date: "2026-08-23" },
  { id: "trx-5", description: "Iuran pelatihan anggota", category: "Pelatihan", amount: 100000, type: "pemasukan", date: "2026-08-17" },
];

export const CAMPAIGNS: Campaign[] = [
  { id: "cmp-1", title: "Promo Ramadan Rajut Ceria", channel: "Instagram", reach: 4200, status: "aktif", date: "2026-08-10" },
  { id: "cmp-2", title: "Bazar Komunitas Inklusif", channel: "Offline", reach: 800, status: "selesai", date: "2026-07-28" },
  { id: "cmp-3", title: "Kolaborasi UMKM Lokal", channel: "TikTok", reach: 1500, status: "draf", date: "2026-08-26" },
  { id: "cmp-4", title: "Konten Edukasi Rajut", channel: "YouTube", reach: 2300, status: "aktif", date: "2026-08-05" },
];

export const PROMOS: Promo[] = [
  { id: "prm-1", code: "MERAKIT10", description: "Diskon 10% untuk pembelian pertama", discountType: "persen", discountValue: 10, validUntil: "2026-09-30", status: "aktif" },
  { id: "prm-2", code: "GRATISONGKIR", description: "Gratis ongkos kirim se-Jawa Barat", discountType: "nominal", discountValue: 15000, validUntil: "2026-09-15", status: "aktif" },
  { id: "prm-3", code: "RAJUT50K", description: "Potongan Rp50.000 minimal belanja Rp250.000", discountType: "nominal", discountValue: 50000, validUntil: "2026-08-31", status: "nonaktif" },
  { id: "prm-4", code: "LEBARAN2026", description: "Diskon spesial Lebaran", discountType: "persen", discountValue: 15, validUntil: "2026-04-10", status: "kedaluwarsa" },
];

export const DASHBOARD_STATS: DashboardStat[] = [
  { label: "Total Anggota Aktif", value: "4", icon: "Users", tone: "primary", trend: { value: "+1 bulan ini", direction: "up" } },
  { label: "Produksi Bulan Ini", value: "65 pcs", icon: "Boxes", tone: "secondary", trend: { value: "+12% dari bulan lalu", direction: "up" } },
  { label: "Pesanan Baru", value: "5", icon: "ClipboardList", tone: "info", trend: { value: "2 menunggu diproses", direction: "down" } },
  { label: "Saldo Kas Komunitas", value: "Rp 2.350.000", icon: "Wallet", tone: "success", trend: { value: "+Rp 235.000 minggu ini", direction: "up" } },
];

export const PRODUCTION_TREND: ProductionTrendPoint[] = [
  { bulan: "Mar", jumlah: 38 },
  { bulan: "Apr", jumlah: 42 },
  { bulan: "Mei", jumlah: 35 },
  { bulan: "Jun", jumlah: 50 },
  { bulan: "Jul", jumlah: 58 },
  { bulan: "Ags", jumlah: 65 },
];
