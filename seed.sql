-- =========================================================
-- MERAKIT — Seed Data (Tahap 7)
-- Prasyarat: buat akun berikut lebih dulu via Supabase Dashboard
-- (Authentication > Add user), baru jalankan file ini.
--   - admin@merakit.id   (akan dijadikan role admin)
--   - lina@merakit.id    (akan dijadikan role anggota)
-- =========================================================

-- Set role sesuai email (trigger sudah membuat baris profiles dgn role default 'anggota').
update public.profiles set role = 'admin', name = 'Bu Sri Wahyuni', avatar_initial = 'SW'
where email = 'admin@merakit.id';

update public.profiles set role = 'anggota', name = 'Lina', avatar_initial = 'LN'
where email = 'lina@merakit.id';

-- Data anggota komunitas (dummy, meniru src/lib/mock-data.ts).
insert into public.members (id, profile_id, name, phone, avatar, disability_description, monthly_production, status, joined_at, notes)
select
  gen_random_uuid(),
  (select id from public.profiles where email = 'lina@merakit.id'),
  'Lina', '6281234567801', 'LN',
  'Menggunakan alat bantu dengar; komunikasi tertulis lebih efektif.',
  28, 'aktif', '2024-02-10', 'Perajin senior, sering membantu pelatihan anggota baru.'
where not exists (select 1 from public.members where name = 'Lina');

insert into public.members (name, phone, avatar, disability_description, monthly_production, status, joined_at, notes)
select 'Sari', '6281234567802', 'SR', 'Disabilitas fisik pada tangan kanan.', 22, 'aktif', '2024-03-05', ''
where not exists (select 1 from public.members where name = 'Sari');

insert into public.members (name, phone, avatar, disability_description, monthly_production, status, joined_at, notes)
select 'Andi', '6281234567803', 'AN', '', 18, 'aktif', '2024-04-12', ''
where not exists (select 1 from public.members where name = 'Andi');

-- Produk katalog dummy.
insert into public.products (name, category, description, price, stock, image_url, is_active)
select 'Syal Rajut Klasik', 'Syal', 'Syal rajut hangat dengan motif klasik.', 85000, 12, '/products/placeholder-syal.svg', true
where not exists (select 1 from public.products where name = 'Syal Rajut Klasik');

insert into public.products (name, category, description, price, stock, image_url, is_active)
select 'Tas Rajut Serbaguna', 'Tas', 'Tas rajut multifungsi untuk sehari-hari.', 120000, 4, '/products/placeholder-tas.svg', true
where not exists (select 1 from public.products where name = 'Tas Rajut Serbaguna');

insert into public.products (name, category, description, price, stock, image_url, is_active)
select 'Topi Rajut Musim Dingin', 'Topi', 'Topi rajut hangat, cocok segala usia.', 45000, 0, '/products/placeholder-topi.svg', false
where not exists (select 1 from public.products where name = 'Topi Rajut Musim Dingin');

-- Catatan produksi dummy untuk anggota "Lina".
insert into public.production_records (member_id, product_id, production_date, quantity, duration, status, notes)
select m.id, p.id, current_date - interval '3 day', 5, 6, 'selesai', 'Selesai tepat waktu.'
from public.members m, public.products p
where m.name = 'Lina' and p.name = 'Syal Rajut Klasik'
and not exists (select 1 from public.production_records where notes = 'Selesai tepat waktu.');

-- Pesanan dummy.
insert into public.orders (order_date, customer_name, customer_phone, product_id, quantity, unit_price, total_amount, status, notes)
select current_date - interval '1 day', 'Ibu Ratna', '6281298765432', p.id, 2, p.price, p.price * 2, 'Diproses', ''
from public.products p where p.name = 'Syal Rajut Klasik'
and not exists (select 1 from public.orders where customer_name = 'Ibu Ratna');

-- Data keuangan dummy.
insert into public.expenses (description, category, amount, type, date)
select 'Iuran pelatihan anggota', 'Pelatihan', 100000, 'pemasukan', current_date - interval '5 day'
where not exists (select 1 from public.expenses where description = 'Iuran pelatihan anggota');

insert into public.expenses (description, category, amount, type, date)
select 'Pembelian benang wol', 'Bahan Baku', 250000, 'pengeluaran', current_date - interval '4 day'
where not exists (select 1 from public.expenses where description = 'Pembelian benang wol');

-- Promo dummy.
insert into public.promotions (code, description, discount_type, discount_value, valid_until, status)
select 'MERAKIT10', 'Diskon 10% untuk pembelian pertama.', 'persen', 10, current_date + interval '30 day', 'aktif'
where not exists (select 1 from public.promotions where code = 'MERAKIT10');
