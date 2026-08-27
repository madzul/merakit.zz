-- =========================================================
-- MERAKIT — Skema Database (Tahap 7: integrasi Supabase)
-- Jalankan file ini di Supabase SQL Editor (sekali, urutan penting).
-- =========================================================

create extension if not exists pgcrypto;

-- ---------- ENUM ----------
create type user_role as enum ('admin', 'anggota');
create type member_status as enum ('aktif', 'nonaktif');
create type production_status as enum ('diajukan', 'diproses', 'selesai', 'dibatalkan');
create type order_status as enum ('Menunggu', 'Diproses', 'Selesai', 'Dibatalkan');
create type transaction_type as enum ('pemasukan', 'pengeluaran');
create type discount_type as enum ('persen', 'nominal');
create type promo_status as enum ('aktif', 'nonaktif', 'kedaluwarsa');

-- ---------- TABEL ----------

-- profiles: akun login (1:1 dengan auth.users), menyimpan role admin/anggota.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null,
  role user_role not null default 'anggota',
  avatar_initial text,
  created_at timestamptz not null default now()
);

-- members: data anggota komunitas (bisa/tidak terhubung ke akun login).
create table public.members (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  name text not null,
  phone text not null,
  avatar text,
  disability_description text,
  monthly_production integer not null default 0,
  status member_status not null default 'aktif',
  joined_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);
create index members_profile_id_idx on public.members (profile_id);

-- products: katalog produk.
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  price numeric(12, 2) not null default 0,
  stock integer not null default 0,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- production_records: catatan produksi milik seorang anggota.
create table public.production_records (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  production_date date not null default current_date,
  quantity integer not null,
  duration integer not null default 0,
  status production_status not null default 'diajukan',
  notes text,
  created_at timestamptz not null default now()
);
create index production_records_member_id_idx on public.production_records (member_id);

-- orders: pesanan pelanggan.
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_date date not null default current_date,
  customer_name text not null,
  customer_phone text not null,
  product_id uuid references public.products (id) on delete set null,
  quantity integer not null,
  unit_price numeric(12, 2) not null,
  total_amount numeric(12, 2) not null,
  status order_status not null default 'Menunggu',
  notes text,
  created_at timestamptz not null default now()
);

-- expenses: catatan keuangan (pemasukan & pengeluaran kas komunitas).
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  category text not null,
  amount numeric(12, 2) not null,
  type transaction_type not null,
  date date not null default current_date,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- promotions: kode promo/diskon.
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type discount_type not null,
  discount_value numeric(12, 2) not null,
  valid_until date,
  status promo_status not null default 'aktif',
  created_at timestamptz not null default now()
);

-- ---------- FUNGSI BANTUAN (SECURITY DEFINER agar tidak rekursif dengan RLS) ----------

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_member_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.members where profile_id = auth.uid() limit 1;
$$;

-- Otomatis buat baris profiles saat ada auth.users baru (dibuat admin via Dashboard/API).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role, avatar_initial)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'anggota'),
    new.raw_user_meta_data ->> 'avatar_initial'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Cegah pengguna non-admin mengubah role miliknya sendiri.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and new.role is distinct from old.role then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger protect_profile_role_trigger
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------- ROW LEVEL SECURITY ----------
alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.products enable row level security;
alter table public.production_records enable row level security;
alter table public.orders enable row level security;
alter table public.expenses enable row level security;
alter table public.promotions enable row level security;

-- profiles
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());
create policy "profiles_delete_admin_only" on public.profiles
  for delete using (public.is_admin());

-- members: admin kelola semua; anggota hanya baca datanya sendiri.
create policy "members_select_admin_or_own" on public.members
  for select using (public.is_admin() or profile_id = auth.uid());
create policy "members_insert_admin_only" on public.members
  for insert with check (public.is_admin());
create policy "members_update_admin_only" on public.members
  for update using (public.is_admin());
create policy "members_delete_admin_only" on public.members
  for delete using (public.is_admin());

-- products: halaman publik hanya baca produk aktif; staf (admin & anggota) baca semua.
create policy "products_public_read_active" on public.products
  for select to anon using (is_active = true);
create policy "products_staff_read_all" on public.products
  for select to authenticated using (true);
create policy "products_admin_write" on public.products
  for insert to authenticated with check (public.is_admin());
create policy "products_admin_update" on public.products
  for update to authenticated using (public.is_admin());
create policy "products_admin_delete" on public.products
  for delete to authenticated using (public.is_admin());

-- production_records: admin kelola semua; anggota hanya kelola miliknya sendiri.
create policy "production_select_admin_or_own" on public.production_records
  for select using (public.is_admin() or member_id = public.current_member_id());
create policy "production_insert_admin_or_own" on public.production_records
  for insert with check (public.is_admin() or member_id = public.current_member_id());
create policy "production_update_admin_or_own" on public.production_records
  for update using (public.is_admin() or member_id = public.current_member_id());
create policy "production_delete_admin_or_own" on public.production_records
  for delete using (public.is_admin() or member_id = public.current_member_id());

-- orders: admin kelola semua; anggota hanya baca (data yang diperlukan saja).
create policy "orders_select_staff" on public.orders
  for select to authenticated using (true);
create policy "orders_admin_insert" on public.orders
  for insert to authenticated with check (public.is_admin());
create policy "orders_admin_update" on public.orders
  for update to authenticated using (public.is_admin());
create policy "orders_admin_delete" on public.orders
  for delete to authenticated using (public.is_admin());

-- expenses: khusus admin, anggota tidak punya akses sama sekali.
create policy "expenses_admin_only_select" on public.expenses
  for select to authenticated using (public.is_admin());
create policy "expenses_admin_only_insert" on public.expenses
  for insert to authenticated with check (public.is_admin());
create policy "expenses_admin_only_update" on public.expenses
  for update to authenticated using (public.is_admin());
create policy "expenses_admin_only_delete" on public.expenses
  for delete to authenticated using (public.is_admin());

-- promotions: staf (admin & anggota) bisa baca; hanya admin bisa tulis.
create policy "promotions_select_staff" on public.promotions
  for select to authenticated using (true);
create policy "promotions_admin_insert" on public.promotions
  for insert to authenticated with check (public.is_admin());
create policy "promotions_admin_update" on public.promotions
  for update to authenticated using (public.is_admin());
create policy "promotions_admin_delete" on public.promotions
  for delete to authenticated using (public.is_admin());

-- ---------- GRANT (privilese tabel; RLS tetap membatasi per baris) ----------
grant usage on schema public to anon, authenticated;

grant select on public.products to anon;
grant select on public.promotions to anon;

grant select, insert, update, delete on
  public.profiles,
  public.members,
  public.products,
  public.production_records,
  public.orders,
  public.expenses,
  public.promotions
to authenticated;
