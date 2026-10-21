-- =========================================================
-- MERAKIT — Migrasi: pembayaran online (Midtrans) & notifikasi otomatis
-- Jalankan SEKALI di Supabase SQL Editor SETELAH migration-penjualan-online.sql.
-- Aman diulang (idempoten). Hanya MENAMBAH kolom/tabel.
--
-- Diadaptasi dari IOM-ITB (services/payments & utils/mailer|whatsapp):
--   online_sales.*midtrans*  — sesi Snap & hasil pembayaran Midtrans.
--   payment_events           — log setiap notifikasi/verifikasi Midtrans
--                              (mirip logPaymentEvent IOM), untuk audit.
--   sale_notifications       — log email/WhatsApp ke pembeli & admin; kunci
--                              unik (sale, event, kanal) mencegah kirim ganda.
-- Semua ditulis server dengan service role key; pembeli tidak punya akses.
-- =========================================================

alter table public.online_sales
  add column if not exists payment_method text not null default 'manual',
  add column if not exists midtrans_order_id text unique,
  add column if not exists midtrans_snap_token text,
  add column if not exists midtrans_snap_expires_at timestamptz,
  add column if not exists midtrans_transaction_id text,
  add column if not exists midtrans_payment_type text,
  add column if not exists midtrans_status text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'online_sales_payment_method_check') then
    alter table public.online_sales
      add constraint online_sales_payment_method_check check (payment_method in ('manual', 'midtrans'));
  end if;
end;
$$;

-- ---------- LOG MIDTRANS ----------
create table if not exists public.payment_events (
  id bigserial primary key,
  source text not null,              -- 'notification' | 'verify' | 'snap'
  order_id text,
  sale_id uuid references public.online_sales (id) on delete set null,
  transaction_status text,
  payload jsonb,
  signature_valid boolean,
  processed boolean not null default false,
  error text,
  ip_address text,
  created_at timestamptz not null default now()
);
create index if not exists payment_events_order_id_idx on public.payment_events (order_id);
create index if not exists payment_events_sale_id_idx on public.payment_events (sale_id);

-- ---------- LOG NOTIFIKASI ----------
create table if not exists public.sale_notifications (
  id bigserial primary key,
  sale_id uuid not null references public.online_sales (id) on delete cascade,
  event_key text not null,           -- mis. 'paid', 'status:Dikirim', 'proof_received:<path>'
  channel text not null check (channel in ('email', 'whatsapp', 'admin_email', 'admin_whatsapp')),
  recipient text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (sale_id, event_key, channel)
);
create index if not exists sale_notifications_sale_id_idx on public.sale_notifications (sale_id, created_at);

alter table public.payment_events enable row level security;
alter table public.sale_notifications enable row level security;

drop policy if exists "payment_events_select_admin" on public.payment_events;
create policy "payment_events_select_admin" on public.payment_events
  for select to authenticated using (public.is_admin());
drop policy if exists "sale_notifications_select_admin" on public.sale_notifications;
create policy "sale_notifications_select_admin" on public.sale_notifications
  for select to authenticated using (public.is_admin());

revoke all on public.payment_events, public.sale_notifications from anon;
revoke insert, update, delete, truncate on public.payment_events, public.sale_notifications from authenticated;

-- ---------- LACAK PESANAN: tambah info pembayaran online ----------
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
