-- =========================================================
-- MERAKIT — Migrasi: satu akun login hanya untuk satu anggota
-- Jalankan SEKALI di Supabase SQL Editor. Aman diulang (idempoten).
--
-- Menghubungkan akun ke anggota dilakukan admin lewat halaman detail anggota
-- (bagian "Akun Login"). Indeks unik ini mencegah satu akun terhubung ke dua
-- anggota sekaligus — current_member_id() mengandalkan hubungan 1:1 ini.
-- Bila migrasi gagal, berarti sudah ada akun ganda: lepaskan salah satunya
-- (update members set profile_id = null where id = '...') lalu jalankan lagi.
-- =========================================================

create unique index if not exists members_profile_id_unique
  on public.members (profile_id)
  where profile_id is not null;
