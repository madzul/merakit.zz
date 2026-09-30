-- =========================================================
-- MERAKIT — Migrasi: rapikan hak akses fungsi & tabel (pertahanan berlapis)
-- Jalankan SEKALI di Supabase SQL Editor. Aman diulang (idempoten).
--
-- 1. Fungsi trigger (handle_new_user, protect_profile_role) tidak untuk
--    dipanggil lewat API /rest/v1/rpc — trigger tetap berjalan tanpa hak
--    EXECUTE pada peran pemanggil.
-- 2. is_admin() & current_member_id() dipakai aturan RLS, jadi TETAP bisa
--    dijalankan peran authenticated, tetapi tidak lagi oleh anon.
-- 3. Pengunjung tanpa login (anon) hanya butuh MEMBACA products (katalog
--    publik). Supabase memberi anon hak penuh bawaan atas tabel public; RLS
--    sudah memblokir datanya, tetapi hak tabel yang tidak perlu dicabut agar
--    kesalahan aturan RLS di masa depan tidak langsung membuka data.
-- Tabel bahan baku, riwayat stok, dan sisa bahan sudah dicabut di migrasi
-- masing-masing.
-- =========================================================

-- 1. Fungsi trigger
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_role() from public, anon, authenticated;

-- 2. Fungsi bantu RLS
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.current_member_id() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_member_id() to authenticated;

-- 3. Hak tabel untuk anon
revoke all on public.profiles, public.members, public.production_records, public.orders,
  public.expenses, public.promotions from anon;
revoke insert, update, delete, truncate, references, trigger on public.products from anon;
grant select on public.products to anon;
