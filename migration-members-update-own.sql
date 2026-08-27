-- =========================================================
-- MERAKIT — Migrasi: izinkan anggota mengubah datanya sendiri di tabel members
-- Jalankan SEKALI di Supabase SQL Editor project yang SUDAH menjalankan
-- database-schema.sql sebelumnya (fresh install cukup pakai database-schema.sql
-- yang sudah memuat kebijakan ini langsung, tidak perlu file ini).
--
-- Sebelumnya kebijakan UPDATE pada tabel members hanya mengizinkan admin.
-- Migrasi ini menggantinya menjadi admin ATAU pemilik baris (profile_id
-- miliknya sendiri), agar anggota bisa mengedit profilnya sendiri (nama &
-- nomor telepon) lewat menu Anggota yang kini juga tampil untuk role anggota.
-- =========================================================

drop policy if exists "members_update_admin_only" on public.members;

create policy "members_update_admin_or_own" on public.members
  for update using (public.is_admin() or profile_id = auth.uid())
  with check (public.is_admin() or profile_id = auth.uid());
