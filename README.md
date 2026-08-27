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
| `NEXT_PUBLIC_SITE_URL` | Disarankan | Origin production, dipakai untuk tautan reset password |

`.env.local` tidak boleh dikomit (sudah diblokir lewat `.gitignore`). Di Vercel, isi variabel yang sama lewat **Project Settings → Environment Variables** — jangan pernah menaruh *service role key* di kode maupun di variabel `NEXT_PUBLIC_*`.

## Database Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Jalankan `database-schema.sql` sekali di Supabase SQL Editor (membuat tabel, enum, RLS policy, trigger).
3. (Opsional, untuk data contoh) jalankan `seed.sql` — perhatikan seed ini membuat baris berdasarkan email (`admin@merakit.id`, `lina@merakit.id`); buat dulu user tersebut lewat Supabase Auth sebelum menjalankan seed.
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
- **Konfigurasi gambar** — belum ada penggunaan `next/image`; gambar produk memakai placeholder SVG lokal via `<img>` (didokumentasikan dengan komentar eslint-disable). `next.config.ts` belum mengisi `images.remotePatterns`. Jika ke depan foto produk diunggah ke Supabase Storage (kolom `image_url` sudah ada di skema), tambahkan hostname project Supabase ke `images.remotePatterns` di `next.config.ts` sebelum memakai `next/image` untuk gambar tersebut.
- **Font** — `src/app/layout.tsx` di-self-host lewat `next/font/local` (berkas `src/app/fonts/Inter-Variable.woff2`), bukan `next/font/google`. Perubahan ini dilakukan agar `npm run build` tidak bergantung pada koneksi keluar ke `fonts.googleapis.com` saat build (lihat [Troubleshooting build](#troubleshooting-build)). Hasil visual identik (Inter, variable weight 100–900).
- **Berkas dibersihkan saat audit ini**: `src/login/__page__._tsx_` (berkas duplikat/rusak di luar `src/app`, tidak pernah ter-routing, tidak dipakai di mana pun) dihapus. Halaman login aktif tetap di `src/app/login/page.tsx`.

## Status modul (data mock vs Supabase)

Autentikasi (`src/lib/auth/actions.ts`, login/logout/reset password) **sudah** memakai Supabase Auth sungguhan. Namun modul data berikut **masih memakai in-memory mock store** (`src/lib/*-store.ts`, diseed dari `src/lib/mock-data.ts`) meski repository Supabase untuk modul tersebut sudah tersedia di `src/lib/supabase/repositories/`:

- Data Anggota (`member-store.ts`)
- Produk (`product-store.ts`)
- Pesanan (`order-store.ts`)
- Produksi (`production-store.ts`)
- Dashboard (`dashboard-data.ts`)

Ini disebutkan langsung di komentar kode sumbernya sebagai data dummy sementara. Konsekuensinya untuk deployment: perubahan data pada modul-modul ini **tidak tersimpan permanen** dan **tidak sinkron antar pengguna/sesi** di production — data akan kembali ke seed setiap reload penuh/redeploy. Ini bukan bug dari proses deployment, tapi status pengembangan fitur yang perlu diketahui sebelum uji terima pengguna. Menyambungkan halaman-halaman ini ke `src/lib/supabase/repositories/*` yang sudah ada adalah pekerjaan tahap berikutnya di luar cakupan persiapan deployment ini.

Halaman `/anggota`, `/pesanan`, `/produk` (tanpa prefiks `/dashboard`) juga masih ada sebagai halaman "Coming Soon" — sudah tidak ditautkan dari sidebar (menu mengarah ke `/dashboard/anggota`, dll.) tapi tetap bisa diakses langsung lewat URL. Aman untuk di-deploy (tidak error), namun disarankan dirapikan/dihapus di iterasi berikutnya agar tidak membingungkan pengguna.

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
- [ ] **Role admin** — akun `admin` bisa mengakses `/dashboard/anggota` dan `/keuangan`.
- [ ] **Role member (anggota)** — akun non-admin **tidak** bisa membuka `/dashboard/anggota` atau `/keuangan` (di-redirect ke `/dashboard`), dan menu tersebut tidak tampil di sidebar.
- [ ] **Dashboard** — statistik, grafik produksi-penjualan, dan kartu ringkasan tampil tanpa error.
- [ ] **Produksi** — daftar, filter periode/anggota, tambah data produksi berjalan.
- [ ] **Anggota** — daftar, detail, tambah anggota berjalan (ingat: masih data mock, lihat [Status modul](#status-modul-data-mock-vs-supabase)).
- [ ] **Produk** — daftar/grid produk, filter, detail, tambah produk berjalan.
- [ ] **Pesanan** — daftar, detail, tambah pesanan, ubah status pesanan berjalan.
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
