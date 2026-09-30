-- =========================================================
-- MERAKIT — DATA CONTOH (SINTETIK) untuk latihan & demo
--
-- Mengisi Juli–September 2026: bahan baku + pembelian, resep produk,
-- catatan produksi (dengan cacat), pesanan (sebagian pakai promo), transaksi
-- keuangan, dan sisa bahan. Menjadi ilustrasi produk untuk ketiga produk
-- contoh (/products/contoh-*.webp).
--
-- SEMUA baris diberi penanda "[DATA CONTOH]" (kolom notes / description)
-- dan bisa dihapus bersih dengan hapus-data-contoh.sql.
--
-- ⚠ Data ini BUKAN data kegiatan mitra. Jangan dipakai sebagai bukti
--   capaian indikator di laporan PKM. Hapus sebelum mitra mulai mencatat
--   data sungguhan, atau sebelum mengambil tangkapan layar untuk laporan.
--
-- Butuh: database-schema.sql + semua migration-*.sql. Produk "Syal Rajut
-- Klasik", "Tas Rajut Serbaguna", "Topi Rajut Musim Dingin" dari seed.sql.
-- Tidak dijalankan dua kali: berhenti bila data contoh sudah ada.
-- =========================================================

do $$
declare
  marker constant text := '[DATA CONTOH]';
  p_syal uuid; p_tas uuid; p_topi uuid;
  price_syal numeric; price_tas numeric; price_topi numeric;
  mat_katun uuid; mat_wol uuid; mat_nilon uuid; mat_kancing uuid; mat_tali uuid; mat_label uuid;
  promo_id uuid;
  member_ids uuid[]; member_profiles uuid[];
  customers text[] := array['Ibu Wulan','Pak Dedi','Rina Kartika','Toko Suvenir Binong','Bu Yati','Hendra','Mega Lestari',
                            'Sanggar Ceria','Ibu Nani','Fajar','Dewi Anggraini','Kedai Rajut Dago','Pak Rahmat','Siska'];
  sources text[] := array['WhatsApp','WhatsApp','Langsung','Katalog Online','Instagram','Bazar/Pameran','Kunjungan Wisata','Reseller'];
  d date; m int; qty int; rej int; prod uuid; hours int; st production_status; ost order_status;
  unit_price numeric; disc numeric; cust int; pick float;
  mon date; mat record; usage numeric; buy numeric; cost numeric; exp_id uuid;
begin
  if exists (select 1 from production_records where notes like marker || '%')
     or exists (select 1 from materials where notes like marker || '%') then
    raise notice 'Data contoh sudah ada — tidak ada yang ditambahkan.';
    return;
  end if;

  select id, price into p_syal, price_syal from products where name = 'Syal Rajut Klasik';
  select id, price into p_tas, price_tas from products where name = 'Tas Rajut Serbaguna';
  select id, price into p_topi, price_topi from products where name = 'Topi Rajut Musim Dingin';
  if p_syal is null or p_tas is null or p_topi is null then
    raise exception 'Produk contoh (Syal/Tas/Topi) tidak ditemukan. Jalankan seed.sql dulu.';
  end if;
  select id into promo_id from promotions where code = 'MERAKIT10';
  select array_agg(id order by name), array_agg(profile_id order by name) into member_ids, member_profiles
    from members where status = 'aktif';
  if member_ids is null then raise exception 'Belum ada anggota aktif.'; end if;

  perform setseed(0.2026);

  -- ---------- Bahan baku ----------
  insert into materials (name, unit, min_stock, unit_cost, notes) values
    ('Benang Katun Susu', 'gulung', 15, 18000, marker || ' Benang utama syal') returning id into mat_katun;
  insert into materials (name, unit, min_stock, unit_cost, notes) values
    ('Benang Wol Akrilik', 'gulung', 10, 22000, marker || ' Benang topi') returning id into mat_wol;
  insert into materials (name, unit, min_stock, unit_cost, notes) values
    ('Benang Nilon Tebal', 'gulung', 12, 15000, marker || ' Benang tas') returning id into mat_nilon;
  insert into materials (name, unit, min_stock, unit_cost, notes) values
    ('Kancing Kayu', 'pcs', 40, 1500, marker) returning id into mat_kancing;
  insert into materials (name, unit, min_stock, unit_cost, notes) values
    ('Tali Kulit Sintetis', 'meter', 8, 8000, marker) returning id into mat_tali;
  insert into materials (name, unit, min_stock, unit_cost, notes) values
    ('Label Kain MERAKIT', 'pcs', 60, 500, marker) returning id into mat_label;

  -- ---------- Resep (per 1 pcs) — dibuat sebelum produksi agar pemakaian tercatat otomatis ----------
  insert into product_materials (product_id, material_id, quantity_per_unit) values
    (p_syal, mat_katun, 1.5), (p_syal, mat_label, 1),
    (p_tas, mat_nilon, 3), (p_tas, mat_tali, 1.2), (p_tas, mat_kancing, 2), (p_tas, mat_label, 1),
    (p_topi, mat_wol, 1), (p_topi, mat_label, 1)
  on conflict (product_id, material_id) do nothing;

  -- ---------- Catatan produksi ----------
  for d in select generate_series(date '2026-07-01', date '2026-09-30', interval '1 day')::date loop
    continue when extract(isodow from d) = 7; -- Minggu libur
    for m in 1 .. array_length(member_ids, 1) loop
      continue when random() > 0.15;
      pick := random();
      if pick < 0.45 then prod := p_syal; qty := 2 + floor(random() * 4)::int; hours := 3;
      elsif pick < 0.75 then prod := p_topi; qty := 2 + floor(random() * 4)::int; hours := 2;
      else prod := p_tas; qty := 1 + floor(random() * 2)::int; hours := 5;
      end if;
      rej := least(qty, case when random() < 0.25 then 1 + (random() < 0.15)::int else 0 end);
      if d < date '2026-09-21' then
        st := case when random() < 0.04 then 'dibatalkan' else 'selesai' end;
      else
        pick := random();
        st := case when pick < 0.35 then 'selesai' when pick < 0.75 then 'diproses' else 'diajukan' end;
      end if;
      insert into production_records (member_id, product_id, production_date, quantity, reject_quantity, duration, status, notes)
      values (member_ids[m], prod, d, qty, rej, greatest(1, qty * hours + floor(random() * 3)::int - 1), st,
              marker || case when rej > 0 then ' ada ' || rej || ' pcs ukuran meleset' else '' end);
    end loop;
  end loop;

  -- ---------- Pesanan ----------
  for d in select generate_series(date '2026-07-01', date '2026-09-30', interval '1 day')::date loop
    continue when random() > 0.62;
    pick := random();
    if pick < 0.45 then prod := p_syal; unit_price := price_syal; qty := 1 + floor(random() * 3)::int;
    elsif pick < 0.75 then prod := p_topi; unit_price := price_topi; qty := 1 + floor(random() * 3)::int;
    else prod := p_tas; unit_price := price_tas; qty := 1 + floor(random() * 2)::int;
    end if;
    -- sebagian pelanggan memesan lagi (indeks kecil lebih sering muncul)
    cust := 1 + floor(power(random(), 1.6) * array_length(customers, 1))::int;
    if d < date '2026-09-16' then
      ost := case when random() < 0.07 then 'Dibatalkan' else 'Selesai' end;
    else
      pick := random();
      ost := case when pick < 0.4 then 'Selesai' when pick < 0.75 then 'Diproses' else 'Menunggu' end;
    end if;
    disc := 0;
    if promo_id is not null and d between date '2026-08-15' and date '2026-09-25' and random() < 0.3 then
      disc := round(unit_price * qty * 0.10);
    end if;
    insert into orders (order_date, customer_name, customer_phone, product_id, quantity, unit_price, total_amount,
                        status, notes, source, promotion_id, discount_amount)
    values (d, customers[cust], '08000000' || lpad(cust::text, 3, '0'), prod, qty, unit_price, unit_price * qty - disc,
            ost, marker, sources[1 + floor(random() * array_length(sources, 1))::int],
            case when disc > 0 then promo_id end, disc);
  end loop;

  -- ---------- Pembelian bahan per bulan (dicatat juga sebagai pengeluaran) ----------
  for mon in select generate_series(date '2026-07-01', date '2026-09-01', interval '1 month')::date loop
    for mat in select id, name, unit, unit_cost, min_stock from materials where notes like marker || '%' loop
      select coalesce(sum(quantity), 0) into usage from material_movements
        where material_id = mat.id and type = 'keluar' and production_record_id is not null
          and movement_date >= mon and movement_date < (mon + interval '1 month');
      -- beli sedikit di atas pemakaian; bulan pertama ditambah stok awal. Kancing sengaja
      -- dibeli pas-pasan di September agar kartu "stok menipis" terlihat.
      buy := ceil(usage * case when mat.id = mat_kancing and mon = date '2026-09-01' then 0.6 else 1.1 end)
             + case when mon = date '2026-07-01' then mat.min_stock else 0 end;
      continue when buy <= 0;
      cost := mat.unit_cost * (1 + (extract(month from mon) - 7) * 0.03); -- harga naik ±3%/bulan
      insert into expenses (description, category, amount, type, date)
        values (marker || ' Pembelian ' || mat.name || ' (' || buy || ' ' || mat.unit || ')', 'Bahan Baku',
                round(buy * cost), 'pengeluaran', mon + 1)
        returning id into exp_id;
      insert into material_movements (material_id, type, quantity, unit_cost, movement_date, expense_id, notes)
        values (mat.id, 'masuk', buy, round(cost), mon + 1, exp_id, marker || ' Pembelian bulanan');
    end loop;

    -- transaksi lain per bulan
    insert into expenses (description, category, amount, type, date) values
      (marker || ' Ongkos kirim pesanan', 'Transportasi', 60000 + floor(random() * 80000), 'pengeluaran', mon + 14),
      (marker || ' Konsumsi rapat bulanan', 'Konsumsi', 75000, 'pengeluaran', mon + 20),
      (marker || ' Iuran anggota', 'Iuran Anggota', 100000, 'pemasukan', mon + 4);
  end loop;

  -- ---------- Sisa bahan ----------
  for d in select generate_series(date '2026-07-04', date '2026-09-30', interval '5 day')::date loop
    pick := random();
    insert into material_leftovers (material_id, quantity, unit, leftover_date, status, notes, created_by)
    values (case when pick < 0.35 then mat_katun when pick < 0.6 then mat_wol when pick < 0.8 then mat_nilon end,
            40 + floor(random() * 26) * 10, 'gram', d,
            case when d > date '2026-09-20' then 'disimpan'
                 when random() < 0.55 then 'dimanfaatkan' when random() < 0.7 then 'disimpan' else 'dibuang' end::leftover_status,
            marker || ' potongan benang sisa produksi',
            member_profiles[1 + floor(random() * array_length(member_profiles, 1))::int]);
  end loop;

  -- ---------- Ilustrasi produk ----------
  update products set image_url = '/products/contoh-syal.webp' where id = p_syal;
  update products set image_url = '/products/contoh-tas.webp' where id = p_tas;
  update products set image_url = '/products/contoh-topi.webp' where id = p_topi;

  raise notice 'Data contoh ditambahkan.';
end;
$$;
