-- =========================================================
-- MERAKIT — HAPUS DATA CONTOH (pasangan seed-data-contoh.sql)
-- Menghapus semua baris berpenanda "[DATA CONTOH]". Data asli tidak
-- tersentuh. Stok produk & bahan dihitung ulang otomatis (riwayat stok
-- ikut terhapus lewat FK cascade), jadi kembali seperti sebelum data contoh.
-- Aman diulang.
-- =========================================================

begin;

delete from public.material_leftovers where notes like '[DATA CONTOH]%';
delete from public.orders where notes like '[DATA CONTOH]%';
delete from public.production_records where notes like '[DATA CONTOH]%';
-- Menghapus bahan contoh ikut menghapus riwayat pergerakan & resep yang memakainya.
delete from public.materials where notes like '[DATA CONTOH]%';
delete from public.expenses where description like '[DATA CONTOH]%';

-- Kembalikan gambar produk ke placeholder bawaan (hanya bila masih ilustrasi contoh).
update public.products set image_url = '/products/placeholder-syal.svg' where image_url = '/products/contoh-syal.webp';
update public.products set image_url = '/products/placeholder-tas.svg' where image_url = '/products/contoh-tas.webp';
update public.products set image_url = '/products/placeholder-topi.svg' where image_url = '/products/contoh-topi.webp';

commit;
