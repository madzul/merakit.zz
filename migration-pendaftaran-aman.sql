-- =========================================================
-- MERAKIT — Migrasi: tutup celah pendaftaran mandiri
-- Jalankan SEKALI di Supabase SQL Editor. Aman diulang (idempoten).
--
-- 1. Peran profil baru TIDAK lagi diambil dari raw_user_meta_data. Metadata
--    itu diisi sendiri oleh pendaftar (supabase.auth.signUp({ options: { data } }))
--    sehingga siapa pun bisa mendaftar sebagai admin bila pendaftaran publik
--    Supabase aktif. Peran kini hanya dari raw_app_meta_data (hanya bisa diisi
--    dengan service role / Dashboard) dan bawaannya 'anggota'.
-- 2. Data internal hanya bisa dibaca "staf": admin, atau akun yang terhubung ke
--    anggota berstatus aktif. Akun yang terdaftar sendiri tetapi belum
--    dihubungkan admin tidak bisa membaca pesanan (nama & HP pelanggan), bahan
--    baku, promo, riwayat stok, maupun sisa bahan.
-- Tetap disarankan: matikan "Allow new users to sign up" di Supabase
-- (Authentication → Sign In / Providers).
-- =========================================================

-- ---------- 1. Profil baru ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := new.raw_app_meta_data ->> 'role';
begin
  insert into public.profiles (id, email, name, role, avatar_initial)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), new.email),
    case when requested_role in ('admin', 'anggota') then requested_role::user_role else 'anggota' end,
    left(new.raw_user_meta_data ->> 'avatar_initial', 3)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------- 2. Fungsi staf ----------
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_admin() or exists (
    select 1 from public.members where profile_id = auth.uid() and status = 'aktif'
  );
$$;
revoke execute on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

-- ---------- 3. Kebijakan baca: staf saja ----------
drop policy if exists "orders_select_staff" on public.orders;
create policy "orders_select_staff" on public.orders
  for select to authenticated using (public.is_staff());

drop policy if exists "promotions_select_staff" on public.promotions;
create policy "promotions_select_staff" on public.promotions
  for select to authenticated using (public.is_staff());

drop policy if exists "products_staff_read_all" on public.products;
create policy "products_staff_read_all" on public.products
  for select to authenticated using (is_active or public.is_staff());

drop policy if exists "materials_select_staff" on public.materials;
create policy "materials_select_staff" on public.materials
  for select to authenticated using (public.is_staff());

drop policy if exists "material_movements_select_staff" on public.material_movements;
create policy "material_movements_select_staff" on public.material_movements
  for select to authenticated using (public.is_staff());

drop policy if exists "product_materials_select_staff" on public.product_materials;
create policy "product_materials_select_staff" on public.product_materials
  for select to authenticated using (public.is_staff());

drop policy if exists "product_stock_movements_select_staff" on public.product_stock_movements;
create policy "product_stock_movements_select_staff" on public.product_stock_movements
  for select to authenticated using (public.is_staff());

drop policy if exists "material_leftovers_select_staff" on public.material_leftovers;
create policy "material_leftovers_select_staff" on public.material_leftovers
  for select to authenticated using (public.is_staff());

drop policy if exists "material_leftovers_insert_staff" on public.material_leftovers;
create policy "material_leftovers_insert_staff" on public.material_leftovers
  for insert to authenticated
  with check (public.is_admin() or (public.is_staff() and created_by = auth.uid()));
