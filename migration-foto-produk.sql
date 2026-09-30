-- =========================================================
-- MERAKIT — Migrasi: penyimpanan foto produk (Supabase Storage)
-- Jalankan SEKALI di Supabase SQL Editor. Aman diulang (idempoten).
--
-- Membuat bucket publik "product-images":
--   - siapa pun (termasuk pengunjung katalog tanpa login) bisa MELIHAT foto
--     lewat URL publik;
--   - hanya admin yang bisa MENGUNGGAH, MENGGANTI, dan MENGHAPUS foto.
-- Batas 2 MB per berkas, hanya JPEG/PNG/WebP. Aplikasi sudah memperkecil &
-- mengompres foto di browser sebelum diunggah (±200–400 KB).
-- =========================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- Admin perlu SELECT agar unggah dengan upsert & hapus berjalan. Pengunjung
-- publik tidak butuh kebijakan ini: bucket publik disajikan lewat URL publik.
drop policy if exists "product_images_admin_select" on storage.objects;
create policy "product_images_admin_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
