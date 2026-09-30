-- =========================================================
-- MERAKIT — Migrasi: indikator dampak (kualitas produksi & sisa bahan)
-- Jalankan SEKALI di Supabase SQL Editor, SETELAH migration-bahan-baku.sql
-- dan migration-stok-produk.sql. Aman diulang (idempoten).
--
-- Mendukung pengukuran yang dijanjikan di Laporan Akhir PKM:
--   1. Tingkat cacat/reject produk  → production_records.reject_quantity
--      (produk layak / Grade A = jumlah − cacat). Stok produk jadi hanya
--      bertambah sebanyak produk layak.
--   2. Sisa bahan & proporsi yang dimanfaatkan ulang (SDG 12)
--      → tabel material_leftovers.
-- =========================================================

-- ---------- 1. JUMLAH CACAT PADA CATATAN PRODUKSI ----------

alter table public.production_records
  add column if not exists reject_quantity integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'production_records_reject_quantity_check' and conrelid = 'public.production_records'::regclass
  ) then
    alter table public.production_records
      add constraint production_records_reject_quantity_check
      check (reject_quantity >= 0 and reject_quantity <= quantity);
  end if;
end;
$$;

-- Stok produk jadi: hanya produk layak (jumlah − cacat) yang masuk stok.
create or replace function public.sync_production_product_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  good_quantity integer := new.quantity - coalesce(new.reject_quantity, 0);
begin
  delete from public.product_stock_movements where production_record_id = new.id;
  if new.status = 'selesai' and new.product_id is not null and good_quantity > 0 then
    insert into public.product_stock_movements (product_id, type, quantity, movement_date, production_record_id, notes)
    values (new.product_id, 'masuk', good_quantity, new.production_date, new.id, 'Otomatis dari produksi selesai (produk layak)');
  end if;
  return null;
end;
$$;

drop trigger if exists production_records_product_stock_trigger on public.production_records;
create trigger production_records_product_stock_trigger
  after insert or update of product_id, quantity, reject_quantity, status, production_date on public.production_records
  for each row execute function public.sync_production_product_stock();

revoke execute on function public.sync_production_product_stock() from public, anon, authenticated;

-- ---------- 2. SISA BAHAN / LIMBAH PRODUKSI ----------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'leftover_status' and typnamespace = 'public'::regnamespace) then
    create type public.leftover_status as enum ('disimpan', 'dimanfaatkan', 'dibuang');
  end if;
end;
$$;

create table if not exists public.material_leftovers (
  id uuid primary key default gen_random_uuid(),
  -- Boleh kosong untuk sisa campuran (mis. potongan benang berbagai jenis).
  material_id uuid references public.materials (id) on delete set null,
  quantity numeric(12, 2) not null check (quantity > 0),
  -- Satuan pencatatan sisa (mis. gram), bisa berbeda dari satuan stok bahan.
  unit text not null default 'gram',
  leftover_date date not null default current_date,
  -- disimpan     : belum dipakai, masih disimpan
  -- dimanfaatkan : sudah diolah jadi produk turunan/aksesori (didaur ulang)
  -- dibuang      : tidak bisa dipakai lagi
  status public.leftover_status not null default 'disimpan',
  notes text,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists material_leftovers_date_idx on public.material_leftovers (leftover_date desc);

alter table public.material_leftovers enable row level security;

-- Semua staf (admin & anggota) boleh melihat dan mencatat sisa bahan;
-- anggota hanya bisa mengubah/menghapus catatannya sendiri, admin semuanya.
drop policy if exists "material_leftovers_select_staff" on public.material_leftovers;
create policy "material_leftovers_select_staff" on public.material_leftovers
  for select to authenticated using (true);

drop policy if exists "material_leftovers_insert_staff" on public.material_leftovers;
create policy "material_leftovers_insert_staff" on public.material_leftovers
  for insert to authenticated
  with check (public.is_admin() or created_by = auth.uid());

drop policy if exists "material_leftovers_update_admin_or_own" on public.material_leftovers;
create policy "material_leftovers_update_admin_or_own" on public.material_leftovers
  for update to authenticated
  using (public.is_admin() or created_by = auth.uid())
  with check (public.is_admin() or created_by = auth.uid());

drop policy if exists "material_leftovers_delete_admin_or_own" on public.material_leftovers;
create policy "material_leftovers_delete_admin_or_own" on public.material_leftovers
  for delete to authenticated
  using (public.is_admin() or created_by = auth.uid());

revoke all on public.material_leftovers from anon;
grant select, insert, update, delete on public.material_leftovers to authenticated;
