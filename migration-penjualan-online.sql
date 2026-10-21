-- =========================================================
-- MERAKIT — Migrasi: Penjualan Online (keranjang & checkout di katalog publik)
-- Jalankan SEKALI di Supabase SQL Editor SETELAH migration-stok-produk.sql.
-- Aman diulang (idempoten). Hanya MENAMBAH tabel/kolom — data lama tetap utuh.
--
-- Diadaptasi dari modul transaksi merchandise IOM-ITB (keranjang multi-produk,
-- ongkir flat per wilayah, bukti transfer, konfirmasi admin, lacak pesanan
-- lewat tautan rahasia), disesuaikan dengan struktur MERAKIT:
--
--   online_sales      — satu checkout pembeli (kode, data pembeli, alamat,
--                       ongkir, status bayar, status kirim, resi, bukti bayar).
--   orders.sale_id    — setiap produk di keranjang menjadi SATU baris pesanan
--                       biasa (sumber "Katalog Online"), sehingga Keuangan,
--                       Pemasaran, Dashboard, dan stok produk otomatis ikut
--                       menghitungnya tanpa perubahan.
--   shipping_zones    — tarif ongkir per wilayah, bisa diubah admin.
--
-- Pembeli (anon) TIDAK punya akses tabel. Semua lewat fungsi SECURITY DEFINER
-- yang menghitung harga dari tabel products — harga dari browser tidak dipakai.
-- =========================================================

-- ---------- ENUM ----------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'online_payment_status') then
    create type online_payment_status as enum ('belum_bayar', 'menunggu_verifikasi', 'lunas', 'ditolak');
  end if;
  if not exists (select 1 from pg_type where typname = 'online_sale_status') then
    create type online_sale_status as enum ('Baru', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan');
  end if;
  if not exists (select 1 from pg_type where typname = 'delivery_method') then
    create type delivery_method as enum ('kirim', 'ambil');
  end if;
end;
$$;

-- ---------- TARIF ONGKIR ----------
-- Tarif flat per pesanan. Kode wilayah dicocokkan dengan pengenal alamat di
-- src/lib/penjualan/shipping.ts. Nilai awal mengikuti tarif IOM-ITB (asal
-- kirim sama-sama Bandung) — sesuaikan di menu Penjualan Online → Tarif Ongkir.
create table if not exists public.shipping_zones (
  id text primary key,
  label text not null,
  cost numeric(12, 2) not null check (cost >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0
);

insert into public.shipping_zones (id, label, cost, sort_order) values
  ('bandung', 'Bandung Raya', 10000, 1),
  ('jabodetabek', 'Jabodetabek dan sekitarnya', 15000, 2),
  ('priangan_timur', 'Garut, Tasikmalaya, Priangan Timur', 15000, 3),
  ('jateng_jatim', 'Jawa Tengah dan Jawa Timur', 25000, 4),
  ('sumsel', 'Sumatera Selatan', 25000, 5),
  ('batam', 'Batam', 45000, 6),
  ('balikpapan', 'Balikpapan', 60000, 7),
  ('sumut', 'Sumatera Utara', 70000, 8),
  ('aceh', 'Aceh', 70000, 9),
  ('palu', 'Palu', 90000, 10)
on conflict (id) do nothing;

-- ---------- PENJUALAN ONLINE ----------
create sequence if not exists public.online_sale_code_seq;

create table if not exists public.online_sales (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  -- Rahasia untuk tautan lacak pesanan (/katalog/pesanan/<token>). 64 hex.
  public_token text not null unique
    default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  delivery_method delivery_method not null default 'kirim',
  address text,
  shipping_zone text references public.shipping_zones (id) on delete set null,
  shipping_zone_label text,
  shipping_cost numeric(12, 2) not null default 0 check (shipping_cost >= 0),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  notes text,
  payment_status online_payment_status not null default 'belum_bayar',
  payment_proof_path text,
  payment_proof_uploaded_at timestamptz,
  payment_note text,
  paid_at timestamptz,
  status online_sale_status not null default 'Baru',
  courier text,
  tracking_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint online_sales_address_required check (delivery_method = 'ambil' or coalesce(trim(address), '') <> '')
);

create index if not exists online_sales_created_at_idx on public.online_sales (created_at desc);
create index if not exists online_sales_phone_idx on public.online_sales (customer_phone);

alter table public.orders
  add column if not exists sale_id uuid references public.online_sales (id) on delete cascade;
create index if not exists orders_sale_id_idx on public.orders (sale_id);

-- ---------- RLS ----------
alter table public.online_sales enable row level security;
alter table public.shipping_zones enable row level security;

drop policy if exists "online_sales_select_admin" on public.online_sales;
create policy "online_sales_select_admin" on public.online_sales
  for select to authenticated using (public.is_admin());
drop policy if exists "online_sales_update_admin" on public.online_sales;
create policy "online_sales_update_admin" on public.online_sales
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "online_sales_delete_admin" on public.online_sales;
create policy "online_sales_delete_admin" on public.online_sales
  for delete to authenticated using (public.is_admin());
-- Tidak ada kebijakan INSERT: penjualan hanya dibuat lewat create_online_sale().

drop policy if exists "shipping_zones_read_all" on public.shipping_zones;
create policy "shipping_zones_read_all" on public.shipping_zones
  for select to anon, authenticated using (true);
drop policy if exists "shipping_zones_admin_update" on public.shipping_zones;
create policy "shipping_zones_admin_update" on public.shipping_zones
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.online_sales from anon;
revoke all on public.shipping_zones from anon;
grant select on public.shipping_zones to anon;

-- ---------- updated_at ----------
create or replace function public.touch_online_sale()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists online_sales_touch on public.online_sales;
create trigger online_sales_touch
  before update on public.online_sales
  for each row execute function public.touch_online_sale();

-- ---------- STATUS PENJUALAN → STATUS PESANAN ----------
-- Baru → Menunggu · Diproses/Dikirim → Diproses · Selesai → Selesai (stok
-- produk berkurang & masuk pemasukan Keuangan) · Dibatalkan → Dibatalkan.
create or replace function public.sync_online_sale_orders()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target order_status;
begin
  if new.status is not distinct from old.status then
    return null;
  end if;
  target := case new.status
    when 'Baru' then 'Menunggu'
    when 'Diproses' then 'Diproses'
    when 'Dikirim' then 'Diproses'
    when 'Selesai' then 'Selesai'
    else 'Dibatalkan'
  end;
  update public.orders set status = target where sale_id = new.id and status is distinct from target;
  return null;
end;
$$;
revoke execute on function public.sync_online_sale_orders() from public, anon, authenticated;

drop trigger if exists online_sales_sync_orders on public.online_sales;
create trigger online_sales_sync_orders
  after update of status on public.online_sales
  for each row execute function public.sync_online_sale_orders();

-- ---------- CHECKOUT (dipanggil pembeli tanpa login) ----------
-- p_items: [{ "product_id": "<uuid>", "quantity": 2 }, ...]
-- Produk harus aktif. Stok kosong tetap boleh (produk rajut bisa dibuat dulu,
-- sama seperti tampilan katalog). Ongkir diambil dari shipping_zones.
create or replace function public.create_online_sale(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_delivery_method text,
  p_address text,
  p_shipping_zone text,
  p_notes text,
  p_items jsonb
)
returns table (code text, public_token text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(coalesce(p_customer_name, ''));
  v_phone text := regexp_replace(coalesce(p_customer_phone, ''), '\D', '', 'g');
  v_email text := nullif(lower(trim(coalesce(p_customer_email, ''))), '');
  v_method delivery_method;
  v_address text := nullif(trim(coalesce(p_address, '')), '');
  v_notes text := nullif(left(trim(coalesce(p_notes, '')), 500), '');
  v_zone public.shipping_zones%rowtype;
  v_shipping numeric(12, 2) := 0;
  v_subtotal numeric(12, 2) := 0;
  v_today date := (now() at time zone 'Asia/Jakarta')::date;
  v_sale_id uuid;
  v_code text;
  v_token text;
  v_line record;
begin
  if char_length(v_name) < 2 or char_length(v_name) > 100 then
    raise exception 'Nama pembeli wajib diisi (2–100 karakter).' using errcode = '22023';
  end if;
  if v_phone like '0%' then
    v_phone := '62' || substr(v_phone, 2);
  elsif v_phone like '8%' then
    v_phone := '62' || v_phone;
  end if;
  if v_phone !~ '^62\d{8,13}$' then
    raise exception 'Nomor WhatsApp tidak valid.' using errcode = '22023';
  end if;
  if v_email is not null and (char_length(v_email) > 120 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'Alamat email tidak valid.' using errcode = '22023';
  end if;
  if p_delivery_method not in ('kirim', 'ambil') then
    raise exception 'Metode pengiriman tidak valid.' using errcode = '22023';
  end if;
  v_method := p_delivery_method::delivery_method;

  if v_method = 'kirim' then
    if v_address is null or char_length(v_address) < 10 or char_length(v_address) > 500 then
      raise exception 'Alamat pengiriman wajib diisi lengkap.' using errcode = '22023';
    end if;
    select * into v_zone from public.shipping_zones where id = p_shipping_zone and is_active;
    if not found then
      raise exception 'Wilayah pengiriman belum dikenali. Lengkapi kota/kabupaten pada alamat.' using errcode = '22023';
    end if;
    v_shipping := v_zone.cost;
  else
    v_address := left(v_address, 500);
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 20 then
    raise exception 'Keranjang harus berisi 1–20 produk.' using errcode = '22023';
  end if;

  -- Rem sederhana untuk spam: maks. 5 checkout per nomor per jam.
  if (select count(*) from public.online_sales s
      where s.customer_phone = v_phone and s.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Terlalu banyak pesanan dari nomor ini. Coba lagi nanti atau hubungi kami via WhatsApp.' using errcode = '22023';
  end if;

  -- Gabungkan baris produk yang sama, lalu ambil harga dari tabel products.
  create temp table if not exists _sale_lines (product_id uuid, quantity integer, unit_price numeric(12, 2)) on commit drop;
  truncate _sale_lines;

  insert into _sale_lines (product_id, quantity, unit_price)
  select p.id, sum(i.quantity)::integer, p.price
  from (
    select (elem ->> 'product_id')::uuid as product_id, (elem ->> 'quantity')::integer as quantity
    from jsonb_array_elements(p_items) as elem
  ) i
  join public.products p on p.id = i.product_id and p.is_active
  group by p.id, p.price;

  if (select count(*) from _sale_lines) <> (
    select count(distinct elem ->> 'product_id') from jsonb_array_elements(p_items) as elem
  ) then
    raise exception 'Ada produk yang sudah tidak tersedia. Muat ulang keranjang.' using errcode = '22023';
  end if;
  if exists (select 1 from _sale_lines where quantity is null or quantity < 1 or quantity > 99) then
    raise exception 'Jumlah tiap produk harus 1–99.' using errcode = '22023';
  end if;

  select coalesce(sum(quantity * unit_price), 0) into v_subtotal from _sale_lines;

  v_code := 'MRK-' || to_char(now() at time zone 'Asia/Jakarta', 'YYMMDD') || '-'
    || lpad((nextval('public.online_sale_code_seq') % 100000)::text, 5, '0');

  insert into public.online_sales (
    code, customer_name, customer_phone, customer_email, delivery_method, address,
    shipping_zone, shipping_zone_label, shipping_cost, subtotal, total_amount, notes
  ) values (
    v_code, v_name, v_phone, v_email, v_method, v_address,
    case when v_method = 'kirim' then v_zone.id end,
    case when v_method = 'kirim' then v_zone.label end,
    v_shipping, v_subtotal, v_subtotal + v_shipping, v_notes
  )
  returning id, online_sales.public_token into v_sale_id, v_token;

  for v_line in select * from _sale_lines loop
    insert into public.orders (
      order_date, customer_name, customer_phone, product_id, quantity, unit_price,
      total_amount, status, notes, source, discount_amount, sale_id
    ) values (
      v_today, v_name, v_phone, v_line.product_id, v_line.quantity, v_line.unit_price,
      v_line.quantity * v_line.unit_price, 'Menunggu', 'Penjualan online ' || v_code,
      'Katalog Online', 0, v_sale_id
    );
  end loop;

  return query select v_code, v_token;
end;
$$;
revoke execute on function public.create_online_sale(text, text, text, text, text, text, text, jsonb) from public;
grant execute on function public.create_online_sale(text, text, text, text, text, text, text, jsonb) to anon, authenticated;

-- ---------- LACAK PESANAN (tanpa login, lewat token rahasia) ----------
create or replace function public.get_online_sale(p_token text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'code', s.code,
    'created_at', s.created_at,
    'customer_name', s.customer_name,
    -- Nomor disamarkan: halaman lacak bisa dibuka siapa pun yang memegang tautan.
    'customer_phone_masked', left(s.customer_phone, 4) || repeat('•', greatest(char_length(s.customer_phone) - 7, 0)) || right(s.customer_phone, 3),
    'delivery_method', s.delivery_method,
    'address', s.address,
    'shipping_zone_label', s.shipping_zone_label,
    'shipping_cost', s.shipping_cost,
    'subtotal', s.subtotal,
    'total_amount', s.total_amount,
    'notes', s.notes,
    'payment_status', s.payment_status,
    'payment_note', s.payment_note,
    'has_payment_proof', s.payment_proof_path is not null,
    'paid_at', s.paid_at,
    'status', s.status,
    'courier', s.courier,
    'tracking_number', s.tracking_number,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'product_id', o.product_id,
        'product_name', coalesce(p.name, 'Produk'),
        'image_url', p.image_url,
        'quantity', o.quantity,
        'unit_price', o.unit_price,
        'total_amount', o.total_amount
      ) order by o.created_at, p.name)
      from public.orders o
      left join public.products p on p.id = o.product_id
      where o.sale_id = s.id
    ), '[]'::jsonb)
  )
  from public.online_sales s
  where s.public_token = p_token and char_length(p_token) = 64;
$$;
revoke execute on function public.get_online_sale(text) from public;
grant execute on function public.get_online_sale(text) to anon, authenticated;

-- Cari tautan lacak dari kode pesanan + nomor WhatsApp (keduanya harus cocok).
create or replace function public.find_online_sale_token(p_code text, p_phone text)
returns text
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  if v_phone like '0%' then v_phone := '62' || substr(v_phone, 2);
  elsif v_phone like '8%' then v_phone := '62' || v_phone;
  end if;
  return (
    select s.public_token from public.online_sales s
    where s.code = upper(trim(coalesce(p_code, ''))) and s.customer_phone = v_phone
  );
end;
$$;
revoke execute on function public.find_online_sale_token(text, text) from public;
grant execute on function public.find_online_sale_token(text, text) to anon, authenticated;

-- ---------- BUKTI PEMBAYARAN ----------
-- Bucket privat: pembeli hanya bisa MENGUNGGAH ke folder <token>/ milik
-- pesanannya yang belum lunas; hanya admin yang bisa melihat isinya.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.can_upload_payment_proof(p_folder text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.online_sales s
    where s.public_token = p_folder
      and s.payment_status in ('belum_bayar', 'ditolak', 'menunggu_verifikasi')
      and s.status <> 'Dibatalkan'
  );
$$;
revoke execute on function public.can_upload_payment_proof(text) from public;
grant execute on function public.can_upload_payment_proof(text) to anon, authenticated;

drop policy if exists "payment_proofs_buyer_insert" on storage.objects;
create policy "payment_proofs_buyer_insert" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'payment-proofs'
    and public.can_upload_payment_proof((storage.foldername(name))[1])
  );

drop policy if exists "payment_proofs_admin_select" on storage.objects;
create policy "payment_proofs_admin_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());

drop policy if exists "payment_proofs_admin_delete" on storage.objects;
create policy "payment_proofs_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());

-- Catat bukti yang sudah diunggah ke pesanan → menunggu verifikasi admin.
create or replace function public.attach_payment_proof(p_token text, p_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_path is null or split_part(p_path, '/', 1) <> p_token or p_path like '%..%' then
    raise exception 'Berkas bukti pembayaran tidak valid.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from storage.objects o where o.bucket_id = 'payment-proofs' and o.name = p_path
  ) then
    raise exception 'Berkas bukti pembayaran tidak ditemukan.' using errcode = '22023';
  end if;
  update public.online_sales
    set payment_proof_path = p_path,
        payment_proof_uploaded_at = now(),
        payment_status = 'menunggu_verifikasi',
        payment_note = null
  where public_token = p_token
    and payment_status in ('belum_bayar', 'ditolak', 'menunggu_verifikasi')
    and status <> 'Dibatalkan';
  if not found then
    raise exception 'Pesanan tidak ditemukan atau sudah lunas.' using errcode = '22023';
  end if;
end;
$$;
revoke execute on function public.attach_payment_proof(text, text) from public;
grant execute on function public.attach_payment_proof(text, text) to anon, authenticated;
