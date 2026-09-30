-- =========================================================
-- MERAKIT — Migrasi: sumber pesanan & diskon promo pada pesanan
-- Jalankan SEKALI di Supabase SQL Editor. Aman diulang (idempoten).
-- Hanya MENAMBAH kolom (dengan nilai bawaan) — pesanan lama tetap utuh.
--
--   orders.source           — asal pesanan (WhatsApp, Katalog Online, Bazar, dst.)
--                             untuk analisis pemasaran.
--   orders.promotion_id     — kode promo yang dipakai (boleh kosong).
--   orders.discount_amount  — potongan harga (Rp). total_amount = qty × harga − diskon.
-- =========================================================

alter table public.orders
  add column if not exists source text not null default 'Langsung',
  add column if not exists promotion_id uuid references public.promotions (id) on delete set null,
  add column if not exists discount_amount numeric(12, 2) not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'orders_discount_amount_check') then
    alter table public.orders
      add constraint orders_discount_amount_check
      check (discount_amount >= 0 and discount_amount <= unit_price * quantity);
  end if;
end;
$$;

create index if not exists orders_promotion_id_idx on public.orders (promotion_id);
