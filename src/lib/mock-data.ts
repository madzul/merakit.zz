import type {
  ProductionRecord,
  Member,
  ProductListItem,
  OrderListItem,
  Product,
  Order,
  Transaction,
  Campaign,
  Promo,
  DashboardStat,
  ProductionTrendPoint,
  ProductionSalesPoint,
  MaterialStockItem,
  TopMember,
  ActivityItem,
  QuickAction,
} from "@/lib/types";
import { formatRupiah } from "@/lib/utils";

export const PRODUCTION_RECORDS: ProductionRecord[] = [
  { id: "prod-1", productionDate: "2026-08-20", memberName: "Rina Marlina", productName: "Syal Rajut Motif Bunga", quantity: 12, duration: 4, status: "selesai", notes: "Batch reguler, kualitas benang katun." },
  { id: "prod-2", productionDate: "2026-08-22", memberName: "Dewi Anggraini", productName: "Tas Rajut Serut", quantity: 8, duration: 6, status: "diproses", notes: "Menunggu aksesori tali serut." },
  { id: "prod-3", productionDate: "2026-08-23", memberName: "Wulan Sari", productName: "Topi Rajut Anak", quantity: 20, duration: 5, status: "diajukan", notes: "" },
  { id: "prod-4", productionDate: "2026-08-18", memberName: "Rina Marlina", productName: "Sarung Bantal Rajut", quantity: 15, duration: 3, status: "selesai", notes: "Pesanan bazar komunitas." },
  { id: "prod-5", productionDate: "2026-08-15", memberName: "Yuni Kartika", productName: "Dompet Rajut Mini", quantity: 10, duration: 2, status: "dibatalkan", notes: "Stok benang tidak sesuai warna pesanan." },
  { id: "prod-6", productionDate: "2026-08-10", memberName: "Siti Aminah", productName: "Syal Rajut Motif Bunga", quantity: 6, duration: 3, status: "selesai", notes: "" },
  { id: "prod-7", productionDate: "2026-08-05", memberName: "Wulan Sari", productName: "Sarung Bantal Rajut", quantity: 9, duration: 4, status: "selesai", notes: "Motif custom permintaan pelanggan." },
  { id: "prod-8", productionDate: "2026-07-28", memberName: "Dewi Anggraini", productName: "Dompet Rajut Mini", quantity: 14, duration: 2, status: "selesai", notes: "" },
  { id: "prod-9", productionDate: "2026-07-22", memberName: "Yuni Kartika", productName: "Topi Rajut Anak", quantity: 18, duration: 5, status: "diproses", notes: "Perlu tambahan 2 hari untuk finishing." },
  { id: "prod-10", productionDate: "2026-07-15", memberName: "Rina Marlina", productName: "Tas Rajut Serut", quantity: 7, duration: 6, status: "selesai", notes: "Kolaborasi dengan Dewi Anggraini." },
  { id: "prod-11", productionDate: "2026-07-08", memberName: "Siti Aminah", productName: "Topi Rajut Anak", quantity: 11, duration: 4, status: "diajukan", notes: "" },
  { id: "prod-12", productionDate: "2026-06-30", memberName: "Wulan Sari", productName: "Dompet Rajut Mini", quantity: 16, duration: 3, status: "selesai", notes: "Stok tambahan untuk katalog online." },
  { id: "prod-13", productionDate: "2026-06-18", memberName: "Dewi Anggraini", productName: "Syal Rajut Motif Bunga", quantity: 5, duration: 2, status: "dibatalkan", notes: "Anggota berhalangan, dijadwalkan ulang." },
  { id: "prod-14", productionDate: "2026-06-05", memberName: "Yuni Kartika", productName: "Sarung Bantal Rajut", quantity: 13, duration: 4, status: "selesai", notes: "" },
];

/**
 * Data dummy anggota. `disabilityDescription` & `notes` adalah keterangan
 * kebutuhan dukungan yang hanya boleh ditampilkan di area admin (lihat
 * catatan privasi pada definisi tipe `Member`).
 */
export const MEMBERS: Member[] = [
  {
    id: "mem-1",
    name: "Rina Marlina",
    phone: "6281234567801",
    avatar: "RM",
    disabilityDescription: "Menggunakan kursi roda; membutuhkan meja kerja dengan tinggi yang disesuaikan.",
    monthlyProduction: 27,
    status: "aktif",
    joinedAt: "2023-02-10",
    notes: "Pendampingan rutin bulanan, perkembangan produksi stabil.",
  },
  {
    id: "mem-2",
    name: "Dewi Anggraini",
    phone: "6281234567802",
    avatar: "DA",
    disabilityDescription: "",
    monthlyProduction: 22,
    status: "aktif",
    joinedAt: "2023-06-01",
    notes: "",
  },
  {
    id: "mem-3",
    name: "Wulan Sari",
    phone: "6281234567803",
    avatar: "WS",
    disabilityDescription: "Tuli; komunikasi melalui pesan teks/WhatsApp dan bahasa isyarat.",
    monthlyProduction: 20,
    status: "aktif",
    joinedAt: "2024-01-15",
    notes: "Koordinasi jadwal pelatihan dilakukan tertulis via grup WhatsApp.",
  },
  {
    id: "mem-4",
    name: "Yuni Kartika",
    phone: "6281234567804",
    avatar: "YK",
    disabilityDescription: "",
    monthlyProduction: 18,
    status: "aktif",
    joinedAt: "2022-11-20",
    notes: "Merangkap sebagai pengurus, membantu pelatihan anggota baru.",
  },
  {
    id: "mem-5",
    name: "Siti Aminah",
    phone: "6281234567805",
    avatar: "SA",
    disabilityDescription: "Low vision; membutuhkan pencahayaan tambahan dan materi cetak berukuran besar.",
    monthlyProduction: 6,
    status: "nonaktif",
    joinedAt: "2024-05-05",
    notes: "Nonaktif sementara karena kendala kesehatan, dijadwalkan kunjungan pendampingan.",
  },
  {
    id: "mem-6",
    name: "Lina Marlina",
    phone: "6281234567806",
    avatar: "LM",
    disabilityDescription: "",
    monthlyProduction: 28,
    status: "aktif",
    joinedAt: "2022-08-14",
    notes: "Kontributor produksi tertinggi bulan ini.",
  },
  {
    id: "mem-7",
    name: "Sari Kusuma",
    phone: "6281234567807",
    avatar: "SK",
    disabilityDescription: "Disabilitas fisik pada tangan kanan; menggunakan alat bantu jarum adaptif.",
    monthlyProduction: 15,
    status: "aktif",
    joinedAt: "2023-09-02",
    notes: "Menggunakan alat bantu jarum rajut adaptif hasil pelatihan komunitas.",
  },
  {
    id: "mem-8",
    name: "Andi Permana",
    phone: "6281234567808",
    avatar: "AP",
    disabilityDescription: "",
    monthlyProduction: 12,
    status: "nonaktif",
    joinedAt: "2023-12-01",
    notes: "Tidak aktif sejak pindah domisili luar kota.",
  },
];

/** Item produk ringkas untuk dropdown pilih produk di modul Data Produksi. */
export const PRODUCTS: ProductListItem[] = [
  { id: "prd-1", name: "Syal Rajut Motif Bunga", category: "Syal", price: 85000, stock: 24, status: "tersedia" },
  { id: "prd-2", name: "Tas Rajut Serut", category: "Tas", price: 120000, stock: 6, status: "stok menipis" },
  { id: "prd-3", name: "Topi Rajut Anak", category: "Topi", price: 45000, stock: 0, status: "habis" },
  { id: "prd-4", name: "Sarung Bantal Rajut", category: "Dekorasi Rumah", price: 65000, stock: 18, status: "tersedia" },
  { id: "prd-5", name: "Dompet Rajut Mini", category: "Aksesoris", price: 40000, stock: 30, status: "tersedia" },
];

/** Ringkasan pesanan (data placeholder, belum dipakai oleh komponen mana pun). */
export const ORDERS: OrderListItem[] = [
  { id: "ord-1", orderNumber: "INV-2026-0091", customerName: "Melati Putri", itemCount: 2, total: 170000, status: "diproses", date: "2026-08-24" },
  { id: "ord-2", orderNumber: "INV-2026-0090", customerName: "Agus Setiawan", itemCount: 1, total: 120000, status: "dikirim", date: "2026-08-23" },
  { id: "ord-3", orderNumber: "INV-2026-0089", customerName: "Nadia Ramadhani", itemCount: 3, total: 210000, status: "selesai", date: "2026-08-21" },
  { id: "ord-4", orderNumber: "INV-2026-0088", customerName: "Bagus Prasetyo", itemCount: 1, total: 45000, status: "menunggu", date: "2026-08-25" },
  { id: "ord-5", orderNumber: "INV-2026-0087", customerName: "Citra Lestari", itemCount: 2, total: 130000, status: "dibatalkan", date: "2026-08-19" },
];

/**
 * Katalog produk MERAKIT (modul Katalog Produk — tahap 6). Data dummy
 * in-memory, gambar memakai placeholder lokal di /public/products (bukan
 * URL eksternal), belum terhubung database/backend/Supabase.
 */
export const PRODUCT_CATALOG: Product[] = [
  {
    id: "ktp-1",
    name: "Syal Rajut Motif Bunga",
    category: "Syal",
    description: "Syal rajut lembut dengan motif bunga khas, cocok untuk cuaca sejuk sehari-hari.",
    price: 85000,
    stock: 24,
    imageUrl: "/products/placeholder-syal.svg",
    isActive: true,
    createdAt: "2026-03-12",
  },
  {
    id: "ktp-2",
    name: "Tas Rajut Serut",
    category: "Tas",
    description: "Tas rajut serut serbaguna, muat untuk kebutuhan belanja maupun jalan-jalan santai.",
    price: 120000,
    stock: 6,
    imageUrl: "/products/placeholder-tas.svg",
    isActive: true,
    createdAt: "2026-04-02",
  },
  {
    id: "ktp-3",
    name: "Topi Rajut Anak",
    category: "Topi",
    description: "Topi rajut hangat untuk anak-anak, tersedia dalam berbagai warna cerah.",
    price: 45000,
    stock: 0,
    imageUrl: "/products/placeholder-topi.svg",
    isActive: false,
    createdAt: "2026-02-20",
  },
  {
    id: "ktp-4",
    name: "Sarung Bantal Rajut",
    category: "Dekorasi Rumah",
    description: "Sarung bantal rajut motif geometris untuk mempercantik ruang tamu.",
    price: 65000,
    stock: 18,
    imageUrl: "/products/placeholder-dekorasi.svg",
    isActive: true,
    createdAt: "2026-05-08",
  },
  {
    id: "ktp-5",
    name: "Dompet Rajut Mini",
    category: "Aksesoris",
    description: "Dompet rajut mini yang ringkas, pas untuk menyimpan kartu dan uang receh.",
    price: 40000,
    stock: 30,
    imageUrl: "/products/placeholder-aksesoris.svg",
    isActive: true,
    createdAt: "2026-01-15",
  },
  {
    id: "ktp-6",
    name: "Selimut Rajut Bayi",
    category: "Dekorasi Rumah",
    description: "Selimut rajut lembut dan hipoalergenik, aman untuk kulit bayi.",
    price: 150000,
    stock: 4,
    imageUrl: "/products/placeholder-dekorasi.svg",
    isActive: true,
    createdAt: "2026-06-01",
  },
  {
    id: "ktp-7",
    name: "Cardigan Rajut Dewasa",
    category: "Syal",
    description: "Cardigan rajut hangat dengan potongan longgar, cocok untuk pria dan wanita.",
    price: 175000,
    stock: 9,
    imageUrl: "/products/placeholder-syal.svg",
    isActive: true,
    createdAt: "2026-06-18",
  },
  {
    id: "ktp-8",
    name: "Gantungan Kunci Rajut",
    category: "Aksesoris",
    description: "Gantungan kunci rajut lucu berbagai karakter, cocok untuk oleh-oleh.",
    price: 15000,
    stock: 0,
    imageUrl: "/products/placeholder-aksesoris.svg",
    isActive: false,
    createdAt: "2026-07-05",
  },
];

/**
 * Daftar pesanan pelanggan (modul Data Pesanan — tahap 6). Data dummy
 * in-memory, belum terhubung database/backend/Supabase.
 */
export const ORDER_LIST: Order[] = [
  {
    id: "psn-1",
    orderDate: "2026-08-24",
    customerName: "Melati Putri",
    customerPhone: "6281234509001",
    productName: "Syal Rajut Motif Bunga",
    quantity: 2,
    unitPrice: 85000,
    totalAmount: 170000,
    status: "Diproses",
    notes: "Tolong dibungkus kado.",
  },
  {
    id: "psn-2",
    orderDate: "2026-08-23",
    customerName: "Agus Setiawan",
    customerPhone: "6281234509002",
    productName: "Tas Rajut Serut",
    quantity: 1,
    unitPrice: 120000,
    totalAmount: 120000,
    status: "Selesai",
    notes: "",
  },
  {
    id: "psn-3",
    orderDate: "2026-08-21",
    customerName: "Nadia Ramadhani",
    customerPhone: "6281234509003",
    productName: "Dompet Rajut Mini",
    quantity: 3,
    unitPrice: 40000,
    totalAmount: 120000,
    status: "Selesai",
    notes: "Warna campur, sesuai stok yang ada.",
  },
  {
    id: "psn-4",
    orderDate: "2026-08-25",
    customerName: "Bagus Prasetyo",
    customerPhone: "6281234509004",
    productName: "Topi Rajut Anak",
    quantity: 1,
    unitPrice: 45000,
    totalAmount: 45000,
    status: "Menunggu",
    notes: "Konfirmasi ketersediaan stok dulu.",
  },
  {
    id: "psn-5",
    orderDate: "2026-08-19",
    customerName: "Citra Lestari",
    customerPhone: "6281234509005",
    productName: "Sarung Bantal Rajut",
    quantity: 2,
    unitPrice: 65000,
    totalAmount: 130000,
    status: "Dibatalkan",
    notes: "Pembeli membatalkan karena salah pesan warna.",
  },
  {
    id: "psn-6",
    orderDate: "2026-08-26",
    customerName: "Rangga Wibowo",
    customerPhone: "6281234509006",
    productName: "Cardigan Rajut Dewasa",
    quantity: 1,
    unitPrice: 175000,
    totalAmount: 175000,
    status: "Menunggu",
    notes: "",
  },
  {
    id: "psn-7",
    orderDate: "2026-08-20",
    customerName: "Putri Ayu",
    customerPhone: "6281234509007",
    productName: "Selimut Rajut Bayi",
    quantity: 1,
    unitPrice: 150000,
    totalAmount: 150000,
    status: "Diproses",
    notes: "Kirim sebelum akhir bulan.",
  },
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
  { label: "Total Produk", value: "75 Produk", icon: "ShoppingBag", tone: "secondary", trend: { value: "+5 produk baru", direction: "up" } },
  { label: "Pendapatan", value: formatRupiah(5_600_000), icon: "Wallet", tone: "success", trend: { value: "+8% dari bulan lalu", direction: "up" } },
  { label: "Pesanan Aktif", value: "12 Pesanan", icon: "ClipboardList", tone: "info", trend: { value: "4 menunggu diproses", direction: "down" } },
  { label: "Anggota Aktif", value: "12 Anggota", icon: "Users", tone: "primary", trend: { value: "+2 anggota baru", direction: "up" } },
];

export const PRODUCTION_TREND: ProductionTrendPoint[] = [
  { bulan: "Mar", jumlah: 38 },
  { bulan: "Apr", jumlah: 42 },
  { bulan: "Mei", jumlah: 35 },
  { bulan: "Jun", jumlah: 50 },
  { bulan: "Jul", jumlah: 58 },
  { bulan: "Ags", jumlah: 65 },
];

/** Data gabungan tren produksi (pcs) & penjualan (Rp) untuk grafik dashboard. */
export const PRODUCTION_SALES_TREND: ProductionSalesPoint[] = [
  { bulan: "Mar", produksi: 38, penjualan: 3_200_000 },
  { bulan: "Apr", produksi: 42, penjualan: 3_550_000 },
  { bulan: "Mei", produksi: 35, penjualan: 2_980_000 },
  { bulan: "Jun", produksi: 50, penjualan: 4_300_000 },
  { bulan: "Jul", produksi: 58, penjualan: 4_950_000 },
  { bulan: "Ags", produksi: 65, penjualan: 5_600_000 },
];

export const MATERIAL_STOCK: MaterialStockItem[] = [
  { id: "mat-1", name: "Benang Katun", quantity: 15, unit: "gulung", status: "aman" },
  { id: "mat-2", name: "Benang Rajut", quantity: 9, unit: "gulung", status: "menipis" },
  { id: "mat-3", name: "Aksesori Rajut", quantity: 7, unit: "gulung", status: "menipis" },
];

export const TOP_MEMBERS: TopMember[] = [
  { id: "top-1", name: "Lina", role: "Perajin Senior", contribution: 28, unit: "pcs" },
  { id: "top-2", name: "Sari", role: "Perajin", contribution: 22, unit: "pcs" },
  { id: "top-3", name: "Andi", role: "Perajin", contribution: 18, unit: "pcs" },
];

export const RECENT_ACTIVITIES: ActivityItem[] = [
  { id: "act-1", type: "produksi", message: "Sari menyelesaikan produksi 12 pcs Syal Rajut Motif Bunga.", timestamp: "2 jam lalu" },
  { id: "act-2", type: "pesanan", message: "Pesanan baru INV-2026-0091 dari Melati Putri.", timestamp: "4 jam lalu" },
  { id: "act-3", type: "produk", message: "Andi menambahkan produk baru: Dompet Rajut Mini.", timestamp: "6 jam lalu" },
  { id: "act-4", type: "stok", message: "Stok Benang Rajut menipis, tersisa 9 gulung.", timestamp: "10 jam lalu" },
  { id: "act-5", type: "anggota", message: "Lina mencatat 28 pcs produksi bulan ini, tertinggi di komunitas.", timestamp: "1 hari lalu" },
];

export const QUICK_ACTIONS: QuickAction[] = [
  { id: "qa-1", key: "produksi", label: "Input Produksi", description: "Catat hasil produksi terbaru", href: "/produksi" },
  { id: "qa-2", key: "anggota", label: "Tambah Anggota", description: "Daftarkan perajin baru", href: "/dashboard/anggota/tambah" },
  { id: "qa-3", key: "produk", label: "Tambah Produk", description: "Tambahkan produk ke katalog", href: "/dashboard/produk/tambah" },
  { id: "qa-4", key: "pesanan", label: "Buat Pesanan", description: "Buat pesanan pelanggan baru", href: "/dashboard/pesanan/tambah" },
];
