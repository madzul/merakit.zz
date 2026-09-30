# MERAKIT — Sistem Informasi Komunitas Rajut Inklusif

MERAKIT ("Merajut Asa Kita") adalah sistem informasi untuk mengelola produksi, keanggotaan, produk, dan pesanan komunitas rajut inklusif.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Auth + Postgres) · GitHub · Vercel.

## Daftar isi

- [Menjalankan secara lokal](#menjalankan-secara-lokal)
- [Environment variable](#environment-variable)
- [Database Supabase](#database-supabase)
- [Arsitektur & catatan penting](#arsitektur--catatan-penting)
- [Status modul (data mock vs Supabase)](#status-modul-data-mock-vs-supabase)
- [Checklist deployment ke Vercel](#checklist-deployment-ke-vercel)
- [Checklist pengujian production](#checklist-pengujian-production)
- [Troubleshooting build](#troubleshooting-build)

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local   # lalu isi nilai Supabase kamu
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Script yang tersedia (`package.json`):

| Script | Perintah | Kegunaan |
| --- | --- | --- |
| `npm run dev` | `next dev` | Server pengembangan |
| `npm run build` | `next build` | Build production |
| `npm run start` | `next start` | Menjalankan hasil build production |
| `npm run lint` | `eslint` | Linting kode |

## Environment variable

Lihat [`.env.example`](./.env.example) untuk daftar lengkap dan penjelasan tiap variabel. Ringkasan:

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Ya | Project URL Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ya | Anon/public key Supabase (aman untuk browser, dibatasi RLS) |
| `NEXT_PUBLIC_SITE_URL` | Disarankan | Origin production, dipakai untuk tautan reset password & tautan produk di pesan WhatsApp |
| `MERAKIT_WHATSAPP_NUMBER` | Opsional | Nomor WhatsApp pemesanan untuk tombol "Pesan via WhatsApp" di katalog publik |

`.env.local` tidak boleh dikomit (sudah diblokir lewat `.gitignore`). Di Vercel, isi variabel yang sama lewat **Project Settings → Environment Variables** — jangan pernah menaruh *service role key* di kode maupun di variabel `NEXT_PUBLIC_*`.

## Database Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Jalankan `database-schema.sql` sekali di Supabase SQL Editor (membuat tabel, enum, RLS policy, trigger), lalu jalankan migrasi berikut **berurutan** (keduanya aman diulang):
   - `migration-members-update-own.sql` — anggota boleh mengedit profilnya sendiri (hanya untuk database lama; `database-schema.sql` baru sudah memuatnya).
   - `migration-bahan-baku.sql` — tabel bahan baku, riwayat stok, resep produk, dan trigger pemakaian bahan otomatis dari produksi.
   - `migration-foto-produk.sql` — bucket Storage publik `product-images` untuk foto produk (unggah/hapus khusus admin).
   - `migration-promo-pemasaran.sql` — kolom `source`, `promotion_id`, `discount_amount` pada `orders` (sumber pesanan & diskon promo).
   - `migration-indikator-dampak.sql` — indikator Laporan Akhir: kolom `reject_quantity` (jumlah cacat) pada `production_records` (stok produk hanya bertambah sebanyak produk layak) dan tabel `material_leftovers` (sisa bahan: disimpan / dimanfaatkan ulang / dibuang).
   - `migration-label-inklusif.sql` — kolom `members.show_inclusive_badge`: label "Sobat Istimewa" hanya tampil bila anggota menyetujui (bawaan: tidak tampil).
   - `migration-akun-anggota-unik.sql` — indeks unik: satu akun login hanya terhubung ke satu anggota.
   - `migration-stok-produk.sql` — stok produk jadi otomatis: riwayat `product_stock_movements`, trigger dari produksi & pesanan Selesai, fungsi `set_product_stock` untuk hitung fisik. Stok yang tampil saat migrasi dijalankan tidak berubah.
3. (Opsional, untuk data contoh) jalankan `seed.sql` — perhatikan seed ini membuat baris berdasarkan email (`admin@merakit.id`, `lina@merakit.id`); buat dulu user tersebut lewat Supabase Auth sebelum menjalankan seed.
4. **Akun login anggota:** buat akunnya di Supabase **Authentication → Users → Add user** (email + kirim undangan atau kata sandi). Lalu, sebagai admin, buka **Anggota → (pilih anggota) → Akun Login → Hubungkan**. Tanpa langkah ini anggota bisa login tetapi tidak bisa mencatat produksi.
4. Ambil **Project URL** dan **anon/publishable key**: buka project di Supabase Dashboard, klik tombol **Connect** di bagian atas halaman → tab **App Frameworks** (pilih **Next.js**) — kedua nilai sudah siap salin dalam format `.env`. Alternatif lewat menu: sidebar **Project Settings → API Keys** (Project URL ada di sana juga, kadang di sub-tab **Data API**); untuk key, tab **API Keys** menampilkan *publishable key* (format baru `sb_publishable_...`) dan tab **Legacy API Keys** menampilkan *anon key* lama (format JWT `eyJ...`) — keduanya sama-sama valid untuk diisi ke `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Tempel ke `.env.local` untuk lokal, dan ke Environment Variables Vercel untuk deployment.

## Arsitektur & catatan penting

Ringkasan hasil audit kesiapan deployment:

- **Client vs Server Component** — halaman yang murni menampilkan data (mis. `dashboard/page.tsx`) adalah Server Component async; komponen yang butuh interaktivitas/browser API (form, chart Recharts, sidebar, dsb.) diberi `"use client"` secara eksplisit. Layout dashboard (`src/app/(dashboard)/layout.tsx`) adalah Client Component karena memuat profil pengguna via `supabase.auth.getUser()` di `useEffect`.
- **Middleware** (`middleware.ts` → `src/lib/supabase/middleware.ts`) — merefresh sesi Supabase di setiap request, melindungi path `/dashboard`, `/produksi`, `/keuangan`, `/pemasaran`, `/promo` dari akses tanpa login, dan membatasi `/dashboard/anggota` & `/keuangan` khusus role `admin` (lapisan kedua selain RLS).
- **Supabase client** — tiga varian sesuai konteks: `src/lib/supabase/client.ts` (Client Component, `createBrowserClient`), `src/lib/supabase/server.ts` (Server Component/Action/Route Handler, `createServerClient` + `next/headers`), `src/lib/supabase/middleware.ts` (Edge Middleware). Sudah mengikuti pola resmi `@supabase/ssr`.
- **Route handler auth callback** — `src/app/auth/confirm/route.ts` menangani callback verifikasi tautan email (reset password) dari Supabase. *(Diperbaiki saat audit ini — sebelumnya berkas ini keliru berada di `src/lib/auth/confirm/route.ts`, di luar folder `app/`, sehingga Next.js **tidak pernah** mendaftarkannya sebagai endpoint dan tautan reset password akan 404. Lihat [Checklist deployment](#checklist-deployment-ke-vercel) poin konfigurasi Redirect URL.)*
- **Dynamic route** — `[id]` dipakai di `dashboard/anggota/[id]`, `dashboard/produk/[id]`, `dashboard/pesanan/[id]`. Semua sudah pakai signature App Router terbaru (`params: Promise<{ id: string }>` + `await params`).
- **Error handling** — komponen `ErrorState`/`EmptyState` dipakai di level halaman untuk data kosong/gagal muat. Belum ada `error.tsx` (error boundary) atau `not-found.tsx` di level route — direkomendasikan ditambahkan sebelum go-live penuh (lihat catatan di bawah).
- **Loading UI** — baru ada satu `loading.tsx` (`(dashboard)/dashboard/loading.tsx`, untuk `/dashboard`). Sub-rute lain memakai skeleton manual di dalam komponen client (`loading` state). Cukup untuk saat ini, tapi menambahkan `loading.tsx` di rute lain akan memperbaiki *perceived performance* saat navigasi.
- **Konfigurasi gambar** — foto produk diunggah ke bucket Supabase Storage `product-images` (diperkecil & dikompres di browser, maks. 1200 px, WebP/JPEG) dan ditampilkan lewat `<img>` biasa (komponen `ProductImage`), bukan `next/image`, sehingga `images.remotePatterns` tidak perlu diisi. Server hanya menerima `image_url` berupa placeholder lokal `/products/*` atau URL bucket project sendiri (`src/lib/produk/images.ts`). Foto lama dihapus dari Storage saat diganti atau produknya dihapus.
- **Font** — `src/app/layout.tsx` di-self-host lewat `next/font/local` (berkas `src/app/fonts/Inter-Variable.woff2`), bukan `next/font/google`. Perubahan ini dilakukan agar `npm run build` tidak bergantung pada koneksi keluar ke `fonts.googleapis.com` saat build (lihat [Troubleshooting build](#troubleshooting-build)). Hasil visual identik (Inter, variable weight 100–900).
- **Berkas dibersihkan saat audit ini**: `src/login/__page__._tsx_` (berkas duplikat/rusak di luar `src/app`, tidak pernah ter-routing, tidak dipakai di mana pun) dihapus. Halaman login aktif tetap di `src/app/login/page.tsx`.

## Status modul (data mock vs Supabase)

Seluruh modul data di bawah ini **sudah membaca & menulis ke Supabase** (tidak ada lagi in-memory mock store). Mutasi lewat Server Action (`src/lib/*/actions.ts`) yang memvalidasi input & peran di server, dengan RLS di `database-schema.sql` sebagai lapisan pertahanan utama.

| Modul | Sumber data | Hak akses |
| --- | --- | --- |
| Autentikasi | Supabase Auth | — |
| Anggota | `members` | Admin: semua. Anggota: profil sendiri |
| Produksi (`/produksi`) | `production_records` | Admin: semua & pilih anggota. Anggota: catatan sendiri (member_id dikunci dari sesi) |
| Produk (`/dashboard/produk`) | `products`, `product_stock_movements` | Semua login bisa lihat (termasuk riwayat stok); tambah/edit/hapus & penyesuaian stok khusus admin |
| Pesanan (`/dashboard/pesanan`) | `orders` | Semua login bisa lihat; tambah/edit/ubah status/hapus khusus admin |
| Keuangan (`/keuangan`) | `expenses` + pesanan `Selesai` dari `orders` | Khusus admin (middleware, cek server, RLS) |
| Katalog publik (`/katalog`) | `products` aktif (tanpa login) | Siapa pun; produk nonaktif tidak tampil. `/` mengarahkan pengunjung ke sini |
| Promo (`/promo`) | `promotions` + pemakaian di `orders` | Semua login bisa lihat; kelola khusus admin. Promo lewat tanggal berlaku otomatis dianggap kedaluwarsa |
| Pemasaran (`/pemasaran`) | Analisis `orders` & `products` | Semua login: produk terlaris, sumber pesanan, rencana produksi. Daftar pelanggan (nama & HP) khusus admin |
| Bahan Baku (`/bahan-baku`) | `materials`, `material_movements`, `product_materials` | Semua login bisa lihat stok; kelola bahan, catat stok & resep khusus admin |
| Dashboard | Agregasi dari tabel di atas | Angka produksi anggota biasa hanya mencakup produksinya sendiri (RLS) |

**Catatan modul Keuangan:** pemasukan = penjualan otomatis dari pesanan berstatus *Selesai* (berdasarkan tanggal pesanan) + pemasukan lain yang dicatat manual (iuran, hibah, penjualan di luar modul Pesanan). Jangan mencatat ulang penjualan pesanan sebagai transaksi manual agar tidak terhitung dua kali. Laporan bulanan (`/keuangan/laporan?bulan=YYYY-MM`) bisa dicetak/disimpan PDF dari browser dan diunduh sebagai CSV (pemisah `;`, terbaca langsung oleh Excel berbahasa Indonesia).

**Catatan modul Bahan Baku:** stok bahan **tidak pernah diubah langsung** — selalu dihitung ulang oleh trigger dari riwayat `material_movements` (masuk, keluar, penyesuaian). Setiap catatan produksi yang tidak dibatalkan otomatis mencatat pemakaian bahan sesuai resep produknya (`product_materials`); mengubah jumlah/status/produk atau menghapus catatan produksi ikut menyesuaikan pemakaiannya. HPP di detail produk = Σ kebutuhan bahan × harga beli terakhir (belum termasuk upah & overhead). Pembelian bahan bisa sekaligus dicatat sebagai pengeluaran "Bahan Baku" di Keuangan.

**Catatan stok produk jadi:** sama seperti bahan baku, `products.stock` **dihitung ulang oleh trigger** dari riwayat `product_stock_movements`. Catatan produksi berstatus `selesai` menambah stok; pesanan berstatus `Selesai` menguranginya; mengubah status/jumlah/produk atau menghapus catatan tersebut ikut mengoreksi stok. Angka stok di form Edit Produk dianggap hasil hitung fisik — selisihnya dicatat sebagai penyesuaian lewat `set_product_stock` (khusus admin). Riwayat tidak bisa diubah/dihapus lewat API; koreksi selalu berupa penyesuaian baru. Stok boleh menjadi minus bila pesanan diselesaikan sebelum produksinya dicatat — tanda ada catatan produksi yang terlewat.

**Catatan indikator dampak (Laporan Akhir PKM):**
- *Tingkat cacat* — isi "Jumlah Cacat / Reject" saat mencatat produksi. Halaman Produksi menampilkan tingkat cacat dan **Rekap per Anggota** (jumlah catatan, pcs, cacat, jam) sesuai filter periode, dan bisa diunduh CSV — bukti indikator ≥80% produksi tercatat.
- *Sisa bahan* (`/bahan-baku/sisa`) — semua pengguna login bisa mencatat sisa benang/bahan per bulan; ringkasan menampilkan proporsi yang dimanfaatkan ulang (SDG 12). Anggota hanya bisa mengubah/menghapus catatannya sendiri.
- *Produksi mingguan* — dashboard menampilkan produksi 8 minggu terakhir (layak jual vs cacat). "Produksi bulan ini" di data anggota dihitung otomatis dari catatan produksi, bukan diisi manual.
- *Label Sobat Istimewa* — admin mencentang "Tampilkan label" di form anggota hanya setelah anggota setuju; keterangan kebutuhan dukungan tetap internal.
- *Arus kas* — halaman Keuangan menampilkan grafik pemasukan vs pengeluaran 6 bulan terakhir.
- *Jumlah pesanan* — halaman Pemasaran membandingkan pesanan, nilai, dan pelanggan dengan periode sebelumnya yang sama panjang, plus tren pesanan per bulan.

**Catatan Promo & Pemasaran:** kode promo diketik admin saat mencatat pesanan; potongan **dihitung ulang di server** (persen atau nominal, tidak pernah melebihi subtotal) dan disimpan di `orders.discount_amount`, sehingga `total_amount` = jumlah × harga − diskon — angka ini yang dipakai Dashboard, Keuangan, dan Pemasaran. Rencana produksi di halaman Pemasaran = pesanan terbuka (Menunggu/Diproses) − stok produk, ditambah cadangan ±2 minggu rata-rata penjualan.

Modul Bahan Baku membutuhkan `migration-bahan-baku.sql`, foto produk membutuhkan `migration-foto-produk.sql`, Promo/Pemasaran membutuhkan `migration-promo-pemasaran.sql`, stok produk otomatis membutuhkan `migration-stok-produk.sql`, dan indikator cacat/sisa bahan membutuhkan `migration-indikator-dampak.sql` (lihat [Database Supabase](#database-supabase)). Setelah deploy, data yang tampil adalah data sungguhan di Supabase; jalankan `seed.sql` bila perlu data contoh.

Alamat lama `/anggota`, `/pesanan`, `/produk` (tanpa prefiks `/dashboard`) kini otomatis diarahkan ke `/dashboard/anggota`, `/dashboard/pesanan`, dan `/dashboard/produk`.

## Checklist deployment ke Vercel

Deployment dilakukan **manual** — tidak ada langkah di bawah ini yang dijalankan otomatis oleh asisten.

1. **Push ke GitHub** — pastikan branch kerja bersih (`git status`), lalu `git push origin <branch>` ke `github.com/madzul/merakit.zz`.
2. **Import repository ke Vercel** — buka [vercel.com/new](https://vercel.com/new), pilih repo `merakit.zz`.
3. **Pilih framework preset "Next.js"** — Vercel biasanya mendeteksi otomatis dari `next.config.ts`; verifikasi Build Command `next build` dan Output tetap default.
4. **Tambahkan environment variable** di Project Settings → Environment Variables (isi untuk Production **dan** Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (isi dengan domain production setelah domain final diketahui; untuk Preview bisa dikosongkan dulu karena ada fallback ke header Host)
5. **Konfigurasi Redirect URL Supabase** — di Supabase Dashboard → Authentication → URL Configuration:
   - **Site URL**: domain production Vercel (mis. `https://merakit.vercel.app`).
   - **Redirect URLs**: tambahkan `https://merakit.vercel.app/auth/confirm` (dan domain preview/staging bila dipakai, mis. `https://*.vercel.app/auth/confirm` sesuai dukungan wildcard Supabase saat ini). Tanpa ini, tautan "lupa password" dari email akan gagal redirect.
6. **Deploy preview** — buat Pull Request atau push ke branch non-default; Vercel otomatis membuat Preview Deployment dengan URL unik.
7. **Uji preview** — jalankan checklist di bawah ([Checklist pengujian production](#checklist-pengujian-production)) terhadap URL preview sebelum promote ke production.
8. **Deploy production** — merge PR ke branch default (atau klik "Promote to Production" di Vercel) setelah preview lolos uji.

## Checklist pengujian production

Jalankan manual terhadap URL production (dan idealnya juga preview) setelah deploy:

- [ ] **Login** — email/password admin & anggota berhasil masuk; pesan error yang jelas untuk kredensial salah.
- [ ] **Logout** — sesi benar-benar berakhir; mencoba mengakses `/dashboard` setelah logout mengarahkan ke `/login`.
- [ ] **Refresh session** — buka tab baru / reload halaman dashboard setelah beberapa saat, pastikan sesi tetap tervalidasi (tidak ter-*log out* mendadak) berkat `middleware.ts`.
- [ ] **Hubungkan akun** — buat user baru di Supabase Auth; di detail anggota (admin) pilih akun itu → Hubungkan; login sebagai anggota tsb → bisa mencatat produksi sendiri; akun yang sudah terhubung tidak muncul lagi di pilihan anggota lain.
- [ ] **Role admin** — akun `admin` bisa mengakses `/dashboard/anggota` dan `/keuangan`.
- [ ] **Promo** — buat kode promo persen & nominal; terapkan di form pesanan (diskon tampil, total berkurang); promo lewat tanggal ditolak di pesanan baru.
- [ ] **Pemasaran** — ganti periode; produk terlaris & sumber pesanan sesuai data; rencana produksi menampilkan kekurangan untuk pesanan terbuka; akun anggota tidak melihat daftar pelanggan.
- [ ] **Katalog publik** — buka `/katalog` di jendela penyamaran: produk aktif tampil lengkap dengan foto, produk nonaktif tidak; filter kategori & pencarian; tombol WhatsApp membuka chat dengan pesan terisi (bila `MERAKIT_WHATSAPP_NUMBER` diisi).
- [ ] **Foto produk** — unggah foto dari HP di form produk, simpan, cek tampil di dashboard & katalog; ganti foto → foto lama terhapus dari Storage.
- [ ] **Bahan Baku** — tambah bahan dengan stok awal; catat masuk (centang "catat ke Keuangan" → muncul di Keuangan); atur resep di detail produk dan lihat HPP/margin; catat produksi produk itu → stok bahan berkurang otomatis; batalkan produksi → stok kembali.
- [ ] **Stok produk otomatis** — catat produksi lalu ubah statusnya ke Selesai → stok produk bertambah dan tercatat di Riwayat Stok (detail produk); ubah pesanan ke Selesai → stok berkurang; batalkan → stok kembali; ubah angka stok di Edit Produk → muncul baris Penyesuaian.
- [ ] **Indikator dampak** — catat produksi dengan jumlah cacat → tingkat cacat & rekap per anggota tampil, CSV terunduh; produksi selesai hanya menambah stok sebanyak produk layak; catat sisa bahan lalu ubah statusnya → persentase dimanfaatkan ulang berubah; grafik arus kas tampil di Keuangan; kartu Pemasaran menampilkan perubahan vs periode sebelumnya.
- [ ] **Keuangan** — catat/edit/hapus pemasukan & pengeluaran; ganti bulan; ringkasan menghitung penjualan pesanan selesai; laporan bulanan tercetak rapi (tanpa sidebar) dan CSV terbuka benar di Excel.
- [ ] **Role member (anggota)** — akun non-admin **tidak** bisa membuka `/dashboard/anggota` atau `/keuangan` (di-redirect ke `/dashboard`), dan menu tersebut tidak tampil di sidebar.
- [ ] **Dashboard** — statistik, grafik produksi-penjualan, dan kartu ringkasan tampil tanpa error.
- [ ] **Produksi** — daftar, filter periode/anggota, tambah/edit/hapus berjalan; data tetap ada setelah reload. Akun anggota hanya melihat & mencatat produksinya sendiri.
- [ ] **Anggota** — daftar, detail (termasuk riwayat produksi anggota), tambah anggota berjalan.
- [ ] **Produk** — daftar/grid produk, filter, detail berjalan; tombol tambah/edit/hapus hanya muncul untuk admin.
- [ ] **Pesanan** — daftar, detail, tambah pesanan, ubah status berjalan (admin); akun anggota hanya bisa melihat.
- [ ] **Mobile layout** — sidebar berubah jadi menu mobile (`MobileSidebar`), tabel/kartu tidak overflow horizontal, tombol & form tetap terjangkau di layar kecil.
- [ ] **Error handling** — matikan/salahkan sementara env var Supabase di Preview untuk memastikan halaman gagal-muat menampilkan `ErrorState`/pesan yang wajar, bukan crash tanpa penjelasan; juga cek halaman untuk ID yang tidak ada (mis. `/dashboard/anggota/id-tidak-ada`) menampilkan `EmptyState`.

## Troubleshooting build

**Gejala:** `npm run build` gagal dengan pesan seperti:

```
Error: next/font: error:
Failed to fetch Inter from Google Fonts.
If you are offline or behind a proxy, self-host the font with next/font/local, ...
```

**Penyebab:** lingkungan build tidak punya akses jaringan keluar ke `fonts.googleapis.com` (mis. sandbox CI dengan allowlist domain terbatas, atau jaringan kantor di balik proxy/firewall).

**Bukan penyebabnya:** kode aplikasi. Build Vercel normal punya akses internet penuh dan pola `next/font/google` adalah pola default `create-next-app` yang bekerja di jutaan deployment Vercel.

**Perbaikan yang sudah diterapkan di project ini:** font Inter sudah di-self-host lewat `next/font/local` (`src/app/layout.tsx` + `src/app/fonts/Inter-Variable.woff2`), sehingga `npm run build` tidak lagi butuh koneksi keluar sama sekali untuk font — lebih tahan terhadap lingkungan CI/jaringan terbatas apa pun, termasuk Vercel. Tidak ada fitur yang dihapus untuk mencapai ini; hasil visual (Inter, variable weight 100–900) tetap sama.

Jika mengalami kegagalan build lain di masa depan:

1. Baca pesan error lengkap dan **Import trace**-nya untuk menemukan berkas sumber masalah.
2. Jalankan `npx tsc --noEmit` untuk memisahkan error TypeScript dari error build/bundling.
3. Jangan menghapus fitur/halaman untuk "melewati" error — perbaiki akar masalah (tipe data, import path, env var yang hilang, dll.) atau, bila terkait ketersediaan jaringan/layanan eksternal saat build, cari alternatif yang tidak bergantung jaringan (seperti solusi font di atas).
