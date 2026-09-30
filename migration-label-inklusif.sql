-- =========================================================
-- MERAKIT — Migrasi: label "Sobat Istimewa" atas persetujuan anggota
-- Jalankan SEKALI di Supabase SQL Editor. Aman diulang (idempoten).
--
-- Label hanya tampil bila show_inclusive_badge = true, yang diisi admin
-- SETELAH anggota yang bersangkutan setuju. Bawaan: tidak tampil.
-- Keterangan kebutuhan dukungan (disability_description) tetap internal
-- admin dan tidak pernah ditampilkan bersama label ini.
-- =========================================================

alter table public.members
  add column if not exists show_inclusive_badge boolean not null default false;
