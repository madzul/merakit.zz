-- =========================================================
-- MERAKIT — Migrasi: ongkir live kurir (RajaOngkir / AgenWebsite) + kode pos
-- Jalankan SEKALI di Supabase SQL Editor SETELAH migration-ongkir-berat.sql.
-- Aman diulang (idempoten). Pesanan lama tidak berubah.
--
-- Mengikuti pembaruan IOM-ITB (feat: ongkir live RajaOngkir + AgenWebsite,
-- round-robin, fallback tabel zona; kode pos tujuan di checkout):
--   online_sales.shipping_provider     'rajaongkir' | 'agenwebsite' | 'table'
--   online_sales.shipping_service      layanan kurir, mis. "J&T Express EZ"
--   online_sales.shipping_postal_code  kode pos tujuan
--   online_sales.shipping_etd          estimasi pengiriman dari kurir
--   create_online_sale(..., p_postal_code, p_live_shipping) — tarif live hanya
--   diterima dari service role (server), dengan cek kg ditagih.
-- =========================================================

alter table public.online_sales
  add column if not exists shipping_provider text,
  add column if not exists shipping_service text,
  add column if not exists shipping_postal_code text,
  add column if not exists shipping_etd text;

-- ---------- CHECKOUT (dipanggil pembeli tanpa login) ----------
-- p_items: [{ "product_id": "<uuid>", "quantity": 2 }, ...]
-- Produk harus aktif. Stok kosong tetap boleh (produk rajut bisa dibuat dulu,
-- sama seperti tampilan katalog). Ongkir = tarif zona (1 kg pertama) +
-- (kg ditagih − 1) × extra_per_kg; kg ditagih dari total berat produk.
-- Bila server memberi tarif live kurir (RajaOngkir/AgenWebsite) dari kode pos,
-- tarif itu yang dipakai; selain itu tabel zona.
-- Versi lama (8 parameter) diganti versi dengan kode pos & tarif live.
drop function if exists public.create_online_sale(text, text, text, text, text, text, text, jsonb);

create or replace function public.create_online_sale(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_delivery_method text,
  p_address text,
  p_shipping_zone text,
  p_notes text,
  p_items jsonb,
  p_postal_code text default null,
  -- Tarif live dari server: {"provider","service","cost","etd","billed_kg"}.
  -- HANYA diterima dari service role — pembeli tidak bisa menentukan ongkir sendiri.
  p_live_shipping jsonb default null
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
  v_weight integer := 0;
  v_billed_kg integer := 1;
  v_postal text := nullif(trim(coalesce(p_postal_code, '')), '');
  v_live boolean := p_live_shipping is not null;
  v_provider text := 'table';
  v_service text;
  v_etd text;
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

  if v_postal is not null and v_postal !~ '^\d{5}$' then
    raise exception 'Kode pos harus 5 digit angka.' using errcode = '22023';
  end if;
  if v_live then
    if coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') <> 'service_role' then
      raise exception 'Tarif ongkir live hanya dapat diberikan server.' using errcode = '42501';
    end if;
    if v_method <> 'kirim' or v_postal is null
       or coalesce(p_live_shipping ->> 'provider', '') not in ('rajaongkir', 'agenwebsite')
       or coalesce((p_live_shipping ->> 'cost')::numeric, -1) < 0
       or coalesce((p_live_shipping ->> 'billed_kg')::integer, 0) < 1 then
      raise exception 'Data ongkir live tidak valid.' using errcode = '22023';
    end if;
  end if;

  if v_method = 'kirim' then
    if v_address is null or char_length(v_address) < 10 or char_length(v_address) > 500 then
      raise exception 'Alamat pengiriman wajib diisi lengkap.' using errcode = '22023';
    end if;
    if not v_live then
      select * into v_zone from public.shipping_zones where id = p_shipping_zone and is_active;
      if not found then
        raise exception 'Wilayah pengiriman belum dikenali. Isi kode pos atau lengkapi kota/kabupaten pada alamat.' using errcode = '22023';
      end if;
    end if;
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
  create temp table if not exists _sale_lines (product_id uuid, quantity integer, unit_price numeric(12, 2), unit_weight integer) on commit drop;
  truncate _sale_lines;

  insert into _sale_lines (product_id, quantity, unit_price, unit_weight)
  select p.id, sum(i.quantity)::integer, p.price, coalesce(p.weight_grams, 500)
  from (
    select (elem ->> 'product_id')::uuid as product_id, (elem ->> 'quantity')::integer as quantity
    from jsonb_array_elements(p_items) as elem
  ) i
  join public.products p on p.id = i.product_id and p.is_active
  group by p.id, p.price, p.weight_grams;

  if (select count(*) from _sale_lines) <> (
    select count(distinct elem ->> 'product_id') from jsonb_array_elements(p_items) as elem
  ) then
    raise exception 'Ada produk yang sudah tidak tersedia. Muat ulang keranjang.' using errcode = '22023';
  end if;
  if exists (select 1 from _sale_lines where quantity is null or quantity < 1 or quantity > 99) then
    raise exception 'Jumlah tiap produk harus 1–99.' using errcode = '22023';
  end if;

  select coalesce(sum(quantity * unit_price), 0), coalesce(sum(quantity * unit_weight), 0)
    into v_subtotal, v_weight from _sale_lines;

  if v_method = 'kirim' then
    v_billed_kg := public.billable_kg(v_weight);
    if v_live then
      -- Seperti assertSameBilledKg IOM: berat bisa berubah antara hitung ongkir & pesan.
      if (p_live_shipping ->> 'billed_kg')::integer <> v_billed_kg then
        raise exception 'Berat produk baru saja berubah. Silakan ulangi pesanan.' using errcode = '22023';
      end if;
      v_shipping := round((p_live_shipping ->> 'cost')::numeric);
      v_provider := p_live_shipping ->> 'provider';
      v_service := left(nullif(trim(p_live_shipping ->> 'service'), ''), 128);
      v_etd := left(nullif(trim(p_live_shipping ->> 'etd'), ''), 64);
    else
      v_shipping := v_zone.cost + (v_billed_kg - 1) * coalesce(v_zone.extra_per_kg, v_zone.cost);
    end if;
  end if;

  v_code := 'MRK-' || to_char(now() at time zone 'Asia/Jakarta', 'YYMMDD') || '-'
    || lpad((nextval('public.online_sale_code_seq') % 100000)::text, 5, '0');

  insert into public.online_sales (
    code, customer_name, customer_phone, customer_email, delivery_method, address,
    shipping_zone, shipping_zone_label, shipping_cost, shipping_weight_grams, shipping_billed_kg,
    shipping_provider, shipping_service, shipping_postal_code, shipping_etd,
    subtotal, total_amount, notes
  ) values (
    v_code, v_name, v_phone, v_email, v_method, v_address,
    case when v_method = 'kirim' and not v_live then v_zone.id end,
    case when v_method = 'kirim' then coalesce(v_service, v_zone.label) end,
    v_shipping, v_weight, case when v_method = 'kirim' then v_billed_kg end,
    case when v_method = 'kirim' then v_provider end, v_service, v_postal, v_etd,
    v_subtotal, v_subtotal + v_shipping, v_notes
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
revoke execute on function public.create_online_sale(text, text, text, text, text, text, text, jsonb, text, jsonb) from public;
grant execute on function public.create_online_sale(text, text, text, text, text, text, text, jsonb, text, jsonb) to anon, authenticated, service_role;

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
    'shipping_weight_grams', s.shipping_weight_grams,
    'shipping_billed_kg', s.shipping_billed_kg,
    'shipping_provider', s.shipping_provider,
    'shipping_service', s.shipping_service,
    'shipping_postal_code', s.shipping_postal_code,
    'shipping_etd', s.shipping_etd,
    'subtotal', s.subtotal,
    'total_amount', s.total_amount,
    'notes', s.notes,
    'payment_status', s.payment_status,
    'payment_note', s.payment_note,
    'has_payment_proof', s.payment_proof_path is not null,
    'paid_at', s.paid_at,
    'status', s.status,
    'payment_method', s.payment_method,
    'payment_type', s.midtrans_payment_type,
    -- true bila ada sesi Snap yang masih berlaku (pembeli bisa melanjutkan bayar).
    'online_payment_pending', s.midtrans_snap_token is not null and s.midtrans_snap_expires_at > now(),
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

