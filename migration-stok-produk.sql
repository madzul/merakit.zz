-- =========================================================
-- MERAKIT — Migrasi: stok produk jadi otomatis
-- Jalankan SEKALI di Supabase SQL Editor, SETELAH database-schema.sql dan
-- migration-promo-pemasaran.sql. Aman diulang (idempoten).
--
-- Cara kerja (pola yang sama dengan stok bahan baku):
--   - products.stock TIDAK lagi diisi manual, tetapi dihitung ulang otomatis
--     dari riwayat product_stock_movements.
--   - Catatan produksi berstatus "selesai"  → stok MASUK sebanyak jumlahnya.
--   - Pesanan berstatus "Selesai"            → stok KELUAR sebanyak jumlahnya.
--   - Mengubah/membatalkan/menghapus catatan tsb otomatis mengoreksi stok.
--   - Hitung fisik (stok opname) dicatat sebagai "penyesuaian" lewat fungsi
--     set_product_stock (dipakai form Edit Produk, khusus admin).
--
-- Saat pertama dijalankan, riwayat produksi & pesanan yang sudah Selesai ikut
-- dicatat, lalu ditambah satu "saldo awal" agar angka stok yang tampil
-- SEKARANG tidak berubah.
-- =========================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'product_stock_movement_type' and typnamespace = 'public'::regnamespace) then
    create type public.product_stock_movement_type as enum ('masuk', 'keluar', 'penyesuaian');
  end if;
end;
$$;

-- ---------- TABEL ----------

create table if not exists public.product_stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  type public.product_stock_movement_type not null,
  -- masuk/keluar: selalu positif. penyesuaian: boleh negatif.
  quantity integer not null check (quantity <> 0),
  movement_date date not null default current_date,
  production_record_id uuid unique references public.production_records (id) on delete cascade,
  order_id uuid unique references public.orders (id) on delete cascade,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint product_stock_movements_quantity_sign check (type = 'penyesuaian' or quantity > 0),
  constraint product_stock_movements_single_source check (production_record_id is null or order_id is null)
);
create index if not exists product_stock_movements_product_id_idx
  on public.product_stock_movements (product_id, movement_date desc);

-- ---------- STOK DIHITUNG ULANG DARI RIWAYAT ----------

create or replace function public.recalculate_product_stock(target_product_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.products p
  set stock = coalesce((
    select sum(case psm.type when 'keluar' then -psm.quantity else psm.quantity end)
    from public.product_stock_movements psm
    where psm.product_id = target_product_id
  ), 0)
  where p.id = target_product_id;
$$;

create or replace function public.handle_product_stock_movement_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_product_stock(old.product_id);
    return null;
  end if;
  perform public.recalculate_product_stock(new.product_id);
  if tg_op = 'UPDATE' and old.product_id <> new.product_id then
    perform public.recalculate_product_stock(old.product_id);
  end if;
  return null;
end;
$$;

drop trigger if exists product_stock_movements_stock_trigger on public.product_stock_movements;
create trigger product_stock_movements_stock_trigger
  after insert or update or delete on public.product_stock_movements
  for each row execute function public.handle_product_stock_movement_change();

-- ---------- PRODUKSI SELESAI → STOK MASUK ----------

create or replace function public.sync_production_product_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.product_stock_movements where production_record_id = new.id;
  if new.status = 'selesai' and new.product_id is not null and new.quantity > 0 then
    insert into public.product_stock_movements (product_id, type, quantity, movement_date, production_record_id, notes)
    values (new.product_id, 'masuk', new.quantity, new.production_date, new.id, 'Otomatis dari produksi selesai');
  end if;
  return null;
end;
$$;

drop trigger if exists production_records_product_stock_trigger on public.production_records;
create trigger production_records_product_stock_trigger
  after insert or update of product_id, quantity, status, production_date on public.production_records
  for each row execute function public.sync_production_product_stock();

-- ---------- PESANAN SELESAI → STOK KELUAR ----------

create or replace function public.sync_order_product_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.product_stock_movements where order_id = new.id;
  if new.status = 'Selesai' and new.product_id is not null and new.quantity > 0 then
    insert into public.product_stock_movements (product_id, type, quantity, movement_date, order_id, notes)
    values (new.product_id, 'keluar', new.quantity, new.order_date, new.id, 'Otomatis dari pesanan selesai');
  end if;
  return null;
end;
$$;

drop trigger if exists orders_product_stock_trigger on public.orders;
create trigger orders_product_stock_trigger
  after insert or update of product_id, quantity, status, order_date on public.orders
  for each row execute function public.sync_order_product_stock();
-- Catatan: menghapus catatan produksi/pesanan ikut menghapus pergerakannya
-- (FK "on delete cascade") dan stok dihitung ulang oleh trigger pergerakan.

-- ---------- PRODUK BARU: STOK AWAL ----------

create or replace function public.handle_new_product_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.stock <> 0 then
    insert into public.product_stock_movements (product_id, type, quantity, notes, created_by)
    values (new.id, 'penyesuaian', new.stock, 'Stok awal produk', auth.uid());
  end if;
  return null;
end;
$$;

drop trigger if exists products_initial_stock_trigger on public.products;
create trigger products_initial_stock_trigger
  after insert on public.products
  for each row execute function public.handle_new_product_stock();

-- ---------- HITUNG FISIK (STOK OPNAME) ----------
-- Mencatat selisih antara stok sistem dan hasil hitung fisik sebagai
-- "penyesuaian". SECURITY INVOKER: RLS tetap berlaku, dan fungsi menolak
-- non-admin secara eksplisit.
create or replace function public.set_product_stock(target_product_id uuid, target_stock integer, note text default null)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_stock integer;
  delta integer;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat menyesuaikan stok produk' using errcode = '42501';
  end if;
  if target_stock is null or target_stock < 0 then
    raise exception 'Stok harus bilangan bulat 0 atau lebih' using errcode = '22023';
  end if;

  select stock into current_stock from public.products where id = target_product_id for update;
  if not found then
    raise exception 'Produk tidak ditemukan' using errcode = 'P0002';
  end if;

  delta := target_stock - current_stock;
  if delta <> 0 then
    insert into public.product_stock_movements (product_id, type, quantity, notes, created_by)
    values (target_product_id, 'penyesuaian', delta, coalesce(nullif(trim(note), ''), 'Penyesuaian hitung fisik'), auth.uid());
  end if;
  return target_stock;
end;
$$;

-- Fungsi trigger/internal tidak untuk dipanggil lewat API.
revoke execute on function public.recalculate_product_stock(uuid) from public, anon, authenticated;
revoke execute on function public.handle_product_stock_movement_change() from public, anon, authenticated;
revoke execute on function public.sync_production_product_stock() from public, anon, authenticated;
revoke execute on function public.sync_order_product_stock() from public, anon, authenticated;
revoke execute on function public.handle_new_product_stock() from public, anon, authenticated;
revoke execute on function public.set_product_stock(uuid, integer, text) from public, anon;
grant execute on function public.set_product_stock(uuid, integer, text) to authenticated;

-- ---------- ROW LEVEL SECURITY ----------
-- Riwayat bisa dibaca staf. Baris otomatis hanya dibuat trigger; admin hanya
-- boleh menambah "penyesuaian" manual. Riwayat tidak bisa diubah/dihapus
-- lewat API (jejak audit) — koreksi dilakukan dengan penyesuaian baru.
alter table public.product_stock_movements enable row level security;

drop policy if exists "product_stock_movements_select_staff" on public.product_stock_movements;
create policy "product_stock_movements_select_staff" on public.product_stock_movements
  for select to authenticated using (true);

drop policy if exists "product_stock_movements_admin_insert" on public.product_stock_movements;
create policy "product_stock_movements_admin_insert" on public.product_stock_movements
  for insert to authenticated
  with check (public.is_admin() and type = 'penyesuaian' and production_record_id is null and order_id is null);

revoke all on public.product_stock_movements from anon;
grant select, insert on public.product_stock_movements to authenticated;

-- ---------- SALDO AWAL (sekali saja) ----------
-- Dicatat hanya bila tabel riwayat masih kosong, sehingga menjalankan ulang
-- migrasi ini tidak menggandakan riwayat.
do $$
begin
  if exists (select 1 from public.product_stock_movements) then
    return;
  end if;

  -- Stok yang tampil sekarang disimpan dulu, karena setiap baris riwayat di
  -- bawah memicu hitung ulang products.stock.
  create temporary table _stok_sekarang on commit drop as
    select id, stock from public.products;

  insert into public.product_stock_movements (product_id, type, quantity, movement_date, production_record_id, notes)
  select pr.product_id, 'masuk', pr.quantity, pr.production_date, pr.id, 'Otomatis dari produksi selesai'
  from public.production_records pr
  join public.products p on p.id = pr.product_id
  where pr.status = 'selesai' and pr.quantity > 0;

  insert into public.product_stock_movements (product_id, type, quantity, movement_date, order_id, notes)
  select o.product_id, 'keluar', o.quantity, o.order_date, o.id, 'Otomatis dari pesanan selesai'
  from public.orders o
  join public.products p on p.id = o.product_id
  where o.status = 'Selesai' and o.quantity > 0;

  -- Saldo awal = stok sekarang − jumlah riwayat, sehingga hasil akhirnya sama
  -- dengan stok yang tampil sebelum migrasi (juga untuk produk tanpa riwayat).
  insert into public.product_stock_movements (product_id, type, quantity, movement_date, notes)
  select s.id, 'penyesuaian', s.stock - coalesce(h.net, 0), current_date, 'Saldo awal saat stok otomatis diaktifkan'
  from _stok_sekarang s
  left join (
    select product_id, sum(case type when 'keluar' then -quantity else quantity end) as net
    from public.product_stock_movements
    group by product_id
  ) h on h.product_id = s.id
  where s.stock - coalesce(h.net, 0) <> 0;
end;
$$;
