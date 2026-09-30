-- =========================================================
-- MERAKIT — Migrasi: modul Bahan Baku, resep produk (BOM) & HPP
-- Jalankan SEKALI di Supabase SQL Editor project yang SUDAH menjalankan
-- database-schema.sql. Aman diulang (idempoten) — objek yang sudah ada
-- dilewati / diganti dengan definisi yang sama.
--
-- Isi:
--   1. materials            — daftar bahan baku + stok, stok minimum, harga satuan
--   2. material_movements   — riwayat masuk / keluar / penyesuaian stok
--   3. product_materials    — resep bahan per produk (untuk HPP & pemakaian otomatis)
--   4. Trigger: stok bahan dihitung ulang otomatis dari riwayat pergerakan
--   5. Trigger: setiap catatan produksi (kecuali "dibatalkan") otomatis
--      mencatat pemakaian bahan sesuai resep produknya
-- =========================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'material_movement_type' and typnamespace = 'public'::regnamespace) then
    create type public.material_movement_type as enum ('masuk', 'keluar', 'penyesuaian');
  end if;
end;
$$;

-- ---------- TABEL ----------

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null default 'gulung',
  -- Dihitung otomatis oleh trigger dari material_movements; jangan diubah manual.
  stock numeric(12, 2) not null default 0,
  min_stock numeric(12, 2) not null default 0 check (min_stock >= 0),
  -- Harga per satuan terakhir (diperbarui otomatis saat ada pembelian/masuk bernilai).
  unit_cost numeric(12, 2) not null default 0 check (unit_cost >= 0),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.material_movements (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  type public.material_movement_type not null,
  -- masuk/keluar: selalu positif. penyesuaian: boleh negatif (koreksi stok opname).
  quantity numeric(12, 2) not null check (quantity <> 0),
  unit_cost numeric(12, 2) check (unit_cost is null or unit_cost >= 0),
  movement_date date not null default current_date,
  -- Terisi bila dibuat otomatis dari catatan produksi.
  production_record_id uuid references public.production_records (id) on delete cascade,
  -- Terisi bila pembelian ini juga dicatat sebagai pengeluaran di modul Keuangan.
  expense_id uuid references public.expenses (id) on delete set null,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint material_movements_quantity_sign check (type = 'penyesuaian' or quantity > 0)
);
create index if not exists material_movements_material_id_idx on public.material_movements (material_id);
create index if not exists material_movements_production_record_id_idx on public.material_movements (production_record_id);

create table if not exists public.product_materials (
  product_id uuid not null references public.products (id) on delete cascade,
  material_id uuid not null references public.materials (id) on delete cascade,
  -- Kebutuhan bahan untuk membuat 1 pcs produk, dalam satuan bahan tsb.
  quantity_per_unit numeric(12, 3) not null check (quantity_per_unit > 0),
  primary key (product_id, material_id)
);
create index if not exists product_materials_material_id_idx on public.product_materials (material_id);

-- ---------- TRIGGER: STOK DIHITUNG ULANG DARI RIWAYAT ----------

create or replace function public.recalculate_material_stock(target_material_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.materials m
  set stock = coalesce((
    select sum(case mm.type when 'keluar' then -mm.quantity else mm.quantity end)
    from public.material_movements mm
    where mm.material_id = target_material_id
  ), 0)
  where m.id = target_material_id;
$$;

create or replace function public.handle_material_movement_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_material_stock(old.material_id);
    return null;
  end if;

  perform public.recalculate_material_stock(new.material_id);
  if tg_op = 'UPDATE' and old.material_id <> new.material_id then
    perform public.recalculate_material_stock(old.material_id);
  end if;

  -- Pembelian bernilai memperbarui harga satuan terakhir bahan.
  if new.type = 'masuk' and new.unit_cost is not null and new.unit_cost > 0 then
    update public.materials set unit_cost = new.unit_cost where id = new.material_id;
  end if;
  return null;
end;
$$;

drop trigger if exists material_movements_stock_trigger on public.material_movements;
create trigger material_movements_stock_trigger
  after insert or update or delete on public.material_movements
  for each row execute function public.handle_material_movement_change();

-- ---------- TRIGGER: PEMAKAIAN BAHAN OTOMATIS DARI PRODUKSI ----------

create or replace function public.sync_production_material_usage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Hapus pemakaian lama milik catatan ini (stok ikut dihitung ulang via trigger).
  delete from public.material_movements where production_record_id = new.id;

  if new.status <> 'dibatalkan' and new.product_id is not null then
    insert into public.material_movements (material_id, type, quantity, movement_date, production_record_id, notes)
    select pm.material_id,
           'keluar',
           round(pm.quantity_per_unit * new.quantity, 2),
           new.production_date,
           new.id,
           'Pemakaian otomatis dari catatan produksi'
    from public.product_materials pm
    where pm.product_id = new.product_id
      and round(pm.quantity_per_unit * new.quantity, 2) > 0;
  end if;

  return null;
end;
$$;

drop trigger if exists production_records_material_usage_trigger on public.production_records;
create trigger production_records_material_usage_trigger
  after insert or update of product_id, quantity, status, production_date on public.production_records
  for each row execute function public.sync_production_material_usage();
-- Catatan: saat catatan produksi dihapus, pemakaiannya ikut terhapus lewat
-- FK "on delete cascade" dan stok dihitung ulang oleh trigger pergerakan.

-- Fungsi trigger tidak untuk dipanggil langsung lewat API.
revoke execute on function public.recalculate_material_stock(uuid) from public, anon, authenticated;
revoke execute on function public.handle_material_movement_change() from public, anon, authenticated;
revoke execute on function public.sync_production_material_usage() from public, anon, authenticated;

-- ---------- ROW LEVEL SECURITY ----------

alter table public.materials enable row level security;
alter table public.material_movements enable row level security;
alter table public.product_materials enable row level security;

drop policy if exists "materials_select_staff" on public.materials;
create policy "materials_select_staff" on public.materials
  for select to authenticated using (true);
drop policy if exists "materials_admin_insert" on public.materials;
create policy "materials_admin_insert" on public.materials
  for insert to authenticated with check (public.is_admin());
drop policy if exists "materials_admin_update" on public.materials;
create policy "materials_admin_update" on public.materials
  for update to authenticated using (public.is_admin());
drop policy if exists "materials_admin_delete" on public.materials;
create policy "materials_admin_delete" on public.materials
  for delete to authenticated using (public.is_admin());

drop policy if exists "material_movements_select_staff" on public.material_movements;
create policy "material_movements_select_staff" on public.material_movements
  for select to authenticated using (true);
drop policy if exists "material_movements_admin_insert" on public.material_movements;
create policy "material_movements_admin_insert" on public.material_movements
  for insert to authenticated with check (public.is_admin() and production_record_id is null);
drop policy if exists "material_movements_admin_update" on public.material_movements;
create policy "material_movements_admin_update" on public.material_movements
  for update to authenticated using (public.is_admin() and production_record_id is null);
drop policy if exists "material_movements_admin_delete" on public.material_movements;
create policy "material_movements_admin_delete" on public.material_movements
  for delete to authenticated using (public.is_admin() and production_record_id is null);

drop policy if exists "product_materials_select_staff" on public.product_materials;
create policy "product_materials_select_staff" on public.product_materials
  for select to authenticated using (true);
drop policy if exists "product_materials_admin_insert" on public.product_materials;
create policy "product_materials_admin_insert" on public.product_materials
  for insert to authenticated with check (public.is_admin());
drop policy if exists "product_materials_admin_update" on public.product_materials;
create policy "product_materials_admin_update" on public.product_materials
  for update to authenticated using (public.is_admin());
drop policy if exists "product_materials_admin_delete" on public.product_materials;
create policy "product_materials_admin_delete" on public.product_materials
  for delete to authenticated using (public.is_admin());

-- ---------- GRANT ----------
revoke all on public.materials, public.material_movements, public.product_materials from anon;
grant select, insert, update, delete on public.materials, public.material_movements, public.product_materials to authenticated;
