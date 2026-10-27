import {
  BadgePercent,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Layers,
  LifeBuoy,
  LogIn,
  Megaphone,
  ShoppingBag,
  ShoppingCart,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

/**
 * Isi Manual Penggunaan SI-MERAKIT.
 *
 * Setiap bagian/topik/langkah boleh diberi `roles`. Tanpa `roles` berarti
 * berlaku untuk semua pengguna login. Halaman /panduan hanya menampilkan isi
 * yang sesuai peran pengguna (lihat `guideForRole`), selaras dengan hak akses
 * di middleware & RLS — admin melihat semuanya, anggota hanya bagian miliknya.
 *
 * Saat menambah/mengubah fitur, perbarui juga teks di berkas ini.
 */

export interface GuideStep {
  text: string;
  roles?: UserRole[];
}

export interface GuideTopic {
  title: string;
  steps: GuideStep[];
  roles?: UserRole[];
}

export interface GuideSection {
  id: string;
  title: string;
  icon: LucideIcon;
  /** Menu terkait di aplikasi (tombol "Buka menu"). */
  href?: string;
  summary: string;
  /** Ringkasan hak akses per peran. Peran tanpa entri tidak melihat bagian ini. */
  access?: Partial<Record<UserRole, string>>;
  topics: GuideTopic[];
  tips?: GuideStep[];
  roles?: UserRole[];
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  anggota: "Anggota",
};

const ADMIN: UserRole[] = ["admin"];
const ANGGOTA: UserRole[] = ["anggota"];

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "memulai",
    title: "Memulai",
    icon: LogIn,
    summary: "Masuk ke aplikasi, mengganti kata sandi, berpindah menu, dan keluar.",
    access: {
      admin: "Admin mengelola semua data dan membuat akun login untuk anggota.",
      anggota: "Anggota mencatat produksinya sendiri dan melihat data bersama komunitas.",
    },
    topics: [
      {
        title: "Masuk (login)",
        steps: [
          { text: "Buka alamat aplikasi MERAKIT, lalu klik tombol masuk atau buka halaman /login." },
          { text: "Ketik email dan password yang diberikan oleh admin, lalu tekan LOGIN." },
          { text: "Setelah berhasil, Anda langsung masuk ke halaman Dashboard." },
        ],
      },
      {
        title: "Lupa password",
        steps: [
          { text: "Di halaman login, klik Lupa Password?." },
          { text: "Ketik email akun Anda, lalu kirim. Buka email dari MERAKIT dan klik tautannya." },
          { text: "Ketik password baru dua kali, lalu tekan Simpan Password Baru." },
          { text: "Bila email tidak datang, periksa folder Spam atau minta admin membantu mengatur ulang." },
        ],
      },
      {
        title: "Ganti kata sandi",
        steps: [
          { text: "Klik ikon kunci (Ganti kata sandi) di pojok kanan atas." },
          { text: "Ketik password baru dan konfirmasinya, lalu simpan." },
          { text: "Akun baru dari admin memakai kata sandi sementara — segera ganti setelah login pertama.", roles: ANGGOTA },
        ],
      },
      {
        title: "Berpindah menu & keluar",
        steps: [
          { text: "Di komputer, daftar menu ada di sisi kiri layar." },
          { text: "Di HP, tekan ikon garis tiga (☰) di kiri atas untuk membuka menu." },
          { text: "Untuk keluar, klik ikon Keluar di pojok kanan atas. Selalu keluar bila memakai HP/komputer bersama." },
        ],
      },
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    summary: "Ringkasan kegiatan komunitas: produksi, penjualan, stok bahan, dan aktivitas terbaru.",
    access: {
      admin: "Melihat angka seluruh komunitas.",
      anggota: "Angka produksi hanya mencakup produksi Anda sendiri.",
    },
    topics: [
      {
        title: "Membaca dashboard",
        steps: [
          { text: "Kartu di bagian atas menampilkan angka penting bulan ini." },
          { text: "Grafik Produksi Mingguan menampilkan 8 minggu terakhir: produk layak jual dan produk cacat." },
          { text: "Kartu Stok Bahan memberi tanda bila ada bahan yang hampir habis." },
          { text: "Kartu Aksi Cepat berisi pintasan untuk tugas yang sering dilakukan, mis. mencatat produksi." },
        ],
      },
    ],
  },
  {
    id: "produksi",
    title: "Data Produksi",
    icon: Boxes,
    href: "/produksi",
    summary: "Mencatat hasil rajutan: produk apa, berapa pcs, berapa yang cacat, dan berapa jam pengerjaan.",
    access: {
      admin: "Melihat & mencatat produksi semua anggota (pilih nama anggota di form).",
      anggota: "Melihat & mencatat produksi Anda sendiri. Nama anggota terisi otomatis.",
    },
    topics: [
      {
        title: "Mencatat produksi baru",
        steps: [
          { text: "Buka menu Data Produksi, lalu klik Tambah Produksi." },
          { text: "Pilih Anggota yang mengerjakan.", roles: ADMIN },
          { text: "Pilih Produk, isi Tanggal Produksi dan Jumlah (pcs)." },
          { text: "Isi Jumlah Cacat / Reject (pcs) bila ada produk yang tidak layak jual. Isi 0 bila tidak ada." },
          { text: "Isi Durasi (jam) pengerjaan dan Catatan bila perlu, lalu tekan Simpan." },
        ],
      },
      {
        title: "Status produksi",
        steps: [
          { text: "Diajukan → Diproses → Selesai. Pilih Dibatalkan bila produksi tidak jadi." },
          { text: "Saat status menjadi Selesai, stok produk bertambah otomatis sebanyak produk yang layak (jumlah − cacat)." },
          { text: "Bahan baku berkurang otomatis sesuai resep produk, kecuali produksi yang dibatalkan." },
        ],
      },
      {
        title: "Mengubah atau menghapus catatan",
        steps: [
          { text: "Klik catatan di daftar, lalu pilih Edit untuk memperbaiki data, atau Hapus bila salah catat." },
          { text: "Anda hanya bisa mengubah catatan produksi milik Anda sendiri.", roles: ANGGOTA },
          { text: "Stok produk dan bahan baku ikut menyesuaikan setelah catatan diubah atau dihapus." },
        ],
      },
      {
        title: "Filter, rekap & unduh CSV",
        roles: ADMIN,
        steps: [
          { text: "Gunakan filter periode (7 Hari, 30 Hari, Bulan Ini) dan filter anggota di atas daftar." },
          { text: "Kartu Rekap per Anggota menampilkan jumlah catatan, pcs, cacat, dan jam sesuai filter." },
          { text: "Klik Unduh CSV untuk menyimpan rekap ke Excel — dipakai sebagai bukti indikator laporan PKM." },
        ],
      },
    ],
    tips: [
      { text: "Catat produksi setiap selesai merajut, jangan ditunda sampai akhir bulan, agar stok selalu tepat." },
    ],
  },
  {
    id: "bahan-baku",
    title: "Bahan Baku & Sisa Bahan",
    icon: Layers,
    href: "/bahan-baku",
    summary: "Stok benang dan bahan lain, riwayat masuk/keluar, serta catatan sisa bahan setiap bulan.",
    access: {
      admin: "Mengelola daftar bahan, mencatat stok masuk/keluar, dan mengatur resep produk.",
      anggota: "Melihat stok bahan dan mencatat sisa bahan Anda sendiri.",
    },
    topics: [
      {
        title: "Melihat stok bahan",
        steps: [
          { text: "Buka menu Bahan Baku untuk melihat semua bahan dan jumlah stoknya." },
          { text: "Bahan yang stoknya di bawah Stok Minimum diberi tanda hampir habis." },
          { text: "Klik nama bahan untuk melihat riwayat masuk dan keluarnya." },
        ],
      },
      {
        title: "Menambah bahan baru",
        roles: ADMIN,
        steps: [
          { text: "Klik Tambah Bahan Baku, isi nama, Satuan, harga beli, Stok Awal, dan Stok Minimum." },
          { text: "Harga beli dipakai untuk menghitung HPP (biaya bahan) produk." },
        ],
      },
      {
        title: "Mencatat stok masuk/keluar",
        roles: ADMIN,
        steps: [
          { text: "Buka detail bahan, lalu isi form Catat Stok: pilih Masuk (pembelian/terima), Keluar (pemakaian manual), atau Penyesuaian (stok opname)." },
          { text: "Untuk pembelian, centang Catat juga sebagai pengeluaran agar otomatis masuk ke Keuangan." },
          { text: "Stok tidak pernah diketik langsung — selalu dihitung dari riwayat. Koreksi dilakukan dengan penyesuaian baru." },
          { text: "Pemakaian bahan untuk produksi tercatat otomatis, tidak perlu dicatat manual." },
        ],
      },
      {
        title: "Mencatat sisa bahan (bulanan)",
        steps: [
          { text: "Buka Bahan Baku → Sisa Bahan, pilih bulan dengan tombol panah." },
          { text: "Klik Catat Sisa Bahan, pilih bahan (atau Campuran / lainnya), isi jumlah sisa." },
          { text: "Pilih statusnya: Disimpan, Dimanfaatkan ulang (jadi produk turunan), atau Dibuang." },
          { text: "Anda hanya bisa mengubah/menghapus catatan sisa bahan milik Anda sendiri.", roles: ANGGOTA },
        ],
      },
    ],
  },
  {
    id: "anggota",
    title: "Anggota",
    icon: Users,
    href: "/dashboard/anggota",
    summary: "Data anggota komunitas, riwayat produksi masing-masing, dan akun login.",
    access: {
      admin: "Melihat semua anggota, menambah/mengedit/menghapus, dan membuat akun login.",
      anggota: "Membuka menu ini akan langsung menampilkan profil Anda sendiri.",
    },
    topics: [
      {
        title: "Melihat & mengedit profil saya",
        roles: ANGGOTA,
        steps: [
          { text: "Buka menu Anggota — profil Anda tampil beserta riwayat produksi Anda." },
          { text: "Klik Edit Profil Saya untuk memperbarui nama atau nomor telepon/WhatsApp, lalu Simpan." },
        ],
      },
      {
        title: "Menambah anggota baru",
        roles: ADMIN,
        steps: [
          { text: "Klik Tambah Anggota, isi Nama Lengkap, Nomor Telepon/WhatsApp, dan Tanggal Bergabung." },
          { text: "Keterangan Kebutuhan Dukungan dan Catatan Pendampingan bersifat internal, hanya untuk admin." },
          { text: "Centang Tampilkan label “Sobat Istimewa” hanya bila anggota yang bersangkutan sudah setuju." },
        ],
      },
      {
        title: "Membuat akun login untuk anggota",
        roles: ADMIN,
        steps: [
          { text: "Buka detail anggota → kartu Akun Login → Buat akun baru." },
          { text: "Isi email dan kata sandi sementara. Akun langsung aktif dengan peran anggota." },
          { text: "Bila akun sudah dibuat di Supabase, pilih di Atau hubungkan akun yang sudah ada → Hubungkan." },
          { text: "Peran admin/anggota bisa diubah dari kartu yang sama. Satu akun hanya untuk satu anggota." },
          { text: "Berikan email & kata sandi sementara langsung kepada anggota, dan minta segera diganti." },
        ],
      },
    ],
  },
  {
    id: "produk",
    title: "Produk",
    icon: ShoppingBag,
    href: "/dashboard/produk",
    summary: "Daftar produk rajut, harga, stok, foto, dan resep bahan.",
    access: {
      admin: "Menambah, mengedit, menghapus produk, mengatur resep, dan menyesuaikan stok.",
      anggota: "Melihat produk, stok, dan riwayat stok.",
    },
    topics: [
      {
        title: "Melihat produk & stok",
        steps: [
          { text: "Buka menu Produk. Gunakan kolom cari dan filter kategori untuk menemukan produk." },
          { text: "Klik produk untuk melihat detail, stok, dan Riwayat Stok (bertambah dari produksi, berkurang dari pesanan Selesai)." },
        ],
      },
      {
        title: "Menambah atau mengedit produk",
        roles: ADMIN,
        steps: [
          { text: "Klik Tambah Produk, isi Nama Produk, Kategori, Harga (Rp), Deskripsi, dan Berat (gram) termasuk kemasan." },
          { text: "Unggah Foto Produk langsung dari HP — foto otomatis diperkecil." },
          { text: "Pilih Aktif agar produk tampil di katalog publik, atau Nonaktif untuk menyembunyikannya." },
          { text: "Angka stok di Edit Produk dianggap hasil hitung fisik; selisihnya tercatat sebagai Penyesuaian." },
        ],
      },
      {
        title: "Resep bahan & HPP",
        roles: ADMIN,
        steps: [
          { text: "Di detail produk, kartu Resep Bahan & HPP → Tambah bahan, isi kebutuhan per pcs." },
          { text: "HPP bahan/pcs dan Margin dihitung otomatis dari harga beli terakhir (belum termasuk upah & overhead)." },
        ],
      },
    ],
  },
  {
    id: "pesanan",
    title: "Pesanan",
    icon: ClipboardList,
    href: "/dashboard/pesanan",
    summary: "Pesanan dari pelanggan (langsung, WhatsApp, bazar, maupun katalog online).",
    access: {
      admin: "Membuat, mengedit, mengubah status, dan menghapus pesanan.",
      anggota: "Melihat daftar dan detail pesanan untuk mengetahui apa yang perlu dibuat.",
    },
    topics: [
      {
        title: "Melihat pesanan",
        steps: [
          { text: "Buka menu Pesanan. Gunakan filter status untuk melihat pesanan Menunggu atau Diproses." },
          { text: "Pesanan yang masih terbuka adalah dasar rencana produksi minggu ini." },
        ],
      },
      {
        title: "Mencatat pesanan baru",
        roles: ADMIN,
        steps: [
          { text: "Klik Tambah Pesanan, isi Nama Pemesan, nomor WhatsApp, Produk, Jumlah, dan Tanggal Pesanan." },
          { text: "Pilih Sumber Pesanan (Langsung, WhatsApp, Instagram, Bazar/Pameran, Kunjungan Wisata, Reseller, dll.) agar analisis pemasaran akurat." },
          { text: "Bila pelanggan punya kode promo, ketik di Kode Promo (opsional) — potongan dihitung otomatis." },
          { text: "Tekan Buat Pesanan." },
        ],
      },
      {
        title: "Mengubah status pesanan",
        roles: ADMIN,
        steps: [
          { text: "Menunggu → Diproses → Selesai, atau Dibatalkan." },
          { text: "Status Selesai mengurangi stok produk dan tercatat sebagai pemasukan di Keuangan." },
          { text: "Pesanan bersumber Katalog Online hanya bisa diubah dari menu Penjualan Online." },
        ],
      },
    ],
  },
  {
    id: "penjualan-online",
    title: "Penjualan Online",
    icon: ShoppingCart,
    href: "/penjualan",
    roles: ADMIN,
    summary: "Pesanan pembeli dari katalog online: bukti bayar, pengiriman, dan tarif ongkir.",
    access: { admin: "Khusus admin, karena memuat alamat dan bukti bayar pembeli." },
    topics: [
      {
        title: "Memproses pesanan online",
        steps: [
          { text: "Buka Penjualan Online, klik pesanan dengan pembayaran Menunggu Verifikasi." },
          { text: "Periksa foto bukti bayar, lalu klik Konfirmasi Lunas — atau Tolak Bukti dengan menuliskan alasannya." },
          { text: "Ubah status: Sedang Dibuat/Dikemas → Dikirim / Siap Diambil (isi kurir & nomor resi) → Selesai." },
          { text: "Status Dikirim dan Selesai hanya bisa dipilih setelah pembayaran lunas." },
          { text: "Pembayaran online (Midtrans) ditandai lunas otomatis; bila terlambat, klik Cek status Midtrans." },
        ],
      },
      {
        title: "Mengabari pembeli",
        steps: [
          { text: "Klik Kabari pembeli untuk membuka WhatsApp dengan pesan sesuai tahap pesanan." },
          { text: "Bila notifikasi otomatis aktif, log email/WA (Terkirim/Gagal/Dilewati) tampil di detail penjualan." },
        ],
      },
      {
        title: "Tarif ongkir",
        steps: [
          { text: "Kartu Tarif Ongkir per Wilayah berisi tarif 1 kg pertama dan per kg berikutnya — sesuaikan bila tarif kurir berubah." },
          { text: "Ongkir dihitung dari total berat; pastikan Berat (gram) setiap produk sudah diisi." },
        ],
      },
    ],
  },
  {
    id: "keuangan",
    title: "Keuangan",
    icon: Wallet,
    href: "/keuangan",
    roles: ADMIN,
    summary: "Pemasukan, pengeluaran, arus kas, dan laporan bulanan.",
    access: { admin: "Khusus admin." },
    topics: [
      {
        title: "Mencatat transaksi",
        steps: [
          { text: "Klik Catat Transaksi, pilih Jenis Transaksi (pemasukan/pengeluaran), Kategori, Tanggal, dan Jumlah (Rp)." },
          { text: "Penjualan dari pesanan Selesai sudah masuk otomatis — jangan dicatat ulang agar tidak dobel." },
          { text: "Catat manual hanya pemasukan lain (iuran, hibah, penjualan di luar modul Pesanan) dan pengeluaran." },
        ],
      },
      {
        title: "Laporan bulanan",
        steps: [
          { text: "Pilih bulan dengan tombol panah, lalu buka Laporan Bulanan." },
          { text: "Klik Simpan sebagai PDF untuk mencetak, atau Unduh CSV untuk dibuka di Excel." },
          { text: "Grafik arus kas menampilkan pemasukan vs pengeluaran 6 bulan terakhir." },
        ],
      },
    ],
  },
  {
    id: "pemasaran",
    title: "Pemasaran",
    icon: Megaphone,
    href: "/pemasaran",
    summary: "Analisis pesanan: produk terlaris, sumber pesanan, dan rencana produksi.",
    access: {
      admin: "Melihat semua analisis termasuk daftar pelanggan (nama & nomor HP).",
      anggota: "Melihat produk terlaris, sumber pesanan, dan rencana produksi.",
    },
    topics: [
      {
        title: "Membaca analisis",
        steps: [
          { text: "Pilih periode di kanan atas: 30 hari, 90 hari, 6 bulan, atau 1 tahun." },
          { text: "Kartu ringkasan membandingkan jumlah pesanan & nilai dengan periode sebelumnya." },
          { text: "Produk Terlaris dan Sumber Pesanan membantu memilih produk dan saluran promosi." },
        ],
      },
      {
        title: "Rencana produksi",
        steps: [
          { text: "Tabel rencana produksi = pesanan terbuka − stok, ditambah cadangan ±2 minggu penjualan." },
          { text: "Gunakan angka ini untuk membagi tugas merajut minggu ini." },
        ],
      },
      {
        title: "Pelanggan setia",
        roles: ADMIN,
        steps: [{ text: "Daftar pelanggan menampilkan pembeli berulang; klik ikon WhatsApp untuk menghubungi mereka." }],
      },
    ],
  },
  {
    id: "promo",
    title: "Promo & Diskon",
    icon: BadgePercent,
    href: "/promo",
    summary: "Kode promo untuk pelanggan.",
    access: {
      admin: "Membuat, mengedit, dan menghapus promo.",
      anggota: "Melihat promo yang sedang berlaku untuk diinformasikan ke pelanggan.",
    },
    topics: [
      {
        title: "Melihat promo",
        steps: [{ text: "Buka Promo & Diskon. Promo yang lewat tanggal berlaku otomatis ditandai kedaluwarsa." }],
      },
      {
        title: "Membuat promo",
        roles: ADMIN,
        steps: [
          { text: "Klik Buat Promo, isi Kode Promo, pilih Jenis Diskon (persen atau nominal), dan nilainya." },
          { text: "Isi Berlaku sampai (opsional) agar promo berakhir otomatis." },
          { text: "Bagikan kode ke pelanggan; kode diketik admin saat mencatat pesanan." },
        ],
      },
    ],
  },
  {
    id: "katalog",
    title: "Katalog Online (untuk Pembeli)",
    icon: Store,
    href: "/katalog",
    summary: "Cara pembeli memesan tanpa login — untuk membantu menjelaskan kepada pelanggan.",
    access: {
      admin: "Bagikan tautan /katalog ke pelanggan. Produk Nonaktif tidak tampil.",
      anggota: "Bagikan tautan /katalog ke calon pembeli dan bantu mereka memesan.",
    },
    topics: [
      {
        title: "Langkah pembeli",
        steps: [
          { text: "Buka /katalog, pilih produk, atur jumlah, lalu tekan Tambah ke Keranjang." },
          { text: "Buka keranjang, isi nama, nomor WhatsApp, dan alamat (atau pilih Ambil sendiri di Kampung Rajut Binong — gratis ongkir)." },
          { text: "Ongkir muncul otomatis. Buat pesanan, lalu catat kode pesanan (MRK-…)." },
          { text: "Bayar lewat transfer/QRIS lalu unggah foto bukti bayar, atau pilih bayar online bila tersedia." },
          { text: "Pantau status di /katalog/pesanan dengan kode pesanan + nomor WhatsApp." },
        ],
      },
    ],
  },
  {
    id: "bantuan",
    title: "Bantuan & Tips",
    icon: LifeBuoy,
    summary: "Masalah yang sering terjadi dan cara mengatasinya.",
    topics: [
      {
        title: "Masalah umum",
        steps: [
          { text: "Tidak bisa login: periksa email/password, coba Lupa Password?, atau hubungi admin." },
          { text: "Menu tertentu tidak muncul: menu tersebut khusus admin. Hubungi admin bila Anda membutuhkannya.", roles: ANGGOTA },
          { text: "Data tidak muncul/terlambat: muat ulang halaman, pastikan internet stabil." },
          { text: "Stok produk minus: ada pesanan yang diselesaikan sebelum produksinya dicatat — catat produksinya.", roles: ADMIN },
        ],
      },
      {
        title: "Data contoh",
        roles: ADMIN,
        steps: [
          { text: "Data berpenanda [DATA CONTOH] hanya untuk latihan. Hapus sebelum mitra mencatat data sungguhan dan sebelum mengambil tangkapan layar laporan PKM." },
        ],
      },
    ],
  },
];

function visibleTo(role: UserRole, roles?: UserRole[]) {
  return !roles || roles.includes(role);
}

/**
 * Saring manual sesuai peran. Admin melihat seluruh isi (termasuk langkah
 * khusus anggota, diberi label) agar bisa memandu anggota; anggota hanya
 * melihat bagian yang berlaku untuknya.
 */
export function guideForRole(role: UserRole): GuideSection[] {
  const canSee = (roles?: UserRole[]) => role === "admin" || visibleTo(role, roles);
  return GUIDE_SECTIONS.filter((section) => visibleTo(role, section.roles))
    .map((section) => ({
      ...section,
      topics: section.topics
        .filter((topic) => canSee(topic.roles))
        .map((topic) => ({ ...topic, steps: topic.steps.filter((step) => canSee(step.roles)) }))
        .filter((topic) => topic.steps.length > 0),
      tips: section.tips?.filter((tip) => canSee(tip.roles)),
    }))
    .filter((section) => section.topics.length > 0);
}
