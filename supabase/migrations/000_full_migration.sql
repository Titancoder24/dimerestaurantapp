-- ==========================================================================
-- DIME Platform — Full Database Migration (combined)
-- All 13 migration files merged in order. Safe to re-run: uses
-- IF NOT EXISTS, ON CONFLICT, and exception-guarded CREATE TYPE.
-- ==========================================================================


-- ========================================================================
-- 001: Extensions & shared helpers
-- ========================================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create or replace function public.short_code(prefix text)
returns text language plpgsql as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  out text := '';
  i int;
begin
  for i in 1..4 loop
    out := out || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return prefix || '-' || out;
end $$;


-- ========================================================================
-- 002: Enums
-- ========================================================================

do $$ begin
  create type user_role as enum ('customer','owner','manager','host','chef','cashier','server','super_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type loyalty_tier as enum ('silver','gold','platinum','diamond');
exception when duplicate_object then null; end $$;

do $$ begin
  create type restaurant_type as enum ('fine_dine','qsr','cafe','bar','bakery','cloud_kitchen','food_court');
exception when duplicate_object then null; end $$;

do $$ begin
  create type restaurant_status as enum ('pending','verified','suspended','banned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type staff_role as enum ('owner','manager','host','chef','cashier','server');
exception when duplicate_object then null; end $$;

do $$ begin
  create type table_zone as enum ('indoor','outdoor','rooftop','private','bar');
exception when duplicate_object then null; end $$;

do $$ begin
  create type table_status as enum ('available','occupied','reserved','blocked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status as enum ('pending','confirmed','arrived','cancelled','no_show','completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_source as enum ('app','walk_in','phone');
exception when duplicate_object then null; end $$;

do $$ begin
  create type seating_pref as enum ('any','indoor','outdoor','rooftop','private','bar');
exception when duplicate_object then null; end $$;

do $$ begin
  create type waitlist_status as enum ('waiting','notified','seated','expired','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_type as enum ('dine_in','takeaway','delivery');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('received','preparing','ready','served','paid','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('unpaid','paid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_item_status as enum ('pending','preparing','ready','served');
exception when duplicate_object then null; end $$;

do $$ begin
  create type loyalty_tx_type as enum ('earned_order','earned_review','earned_referral','earned_bonus','redeemed','expired','adjusted_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type discount_type as enum ('percentage','flat','bogo','free_item');
exception when duplicate_object then null; end $$;

do $$ begin
  create type target_audience as enum ('all','new_users','tier_gold','tier_platinum','tier_diamond');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum ('order_update','booking_update','offer','loyalty','system');
exception when duplicate_object then null; end $$;

do $$ begin
  create type inventory_unit as enum ('kg','g','liter','ml','piece','dozen','packet');
exception when duplicate_object then null; end $$;

do $$ begin
  create type inventory_status as enum ('in_stock','low_stock','out_of_stock');
exception when duplicate_object then null; end $$;

do $$ begin
  create type expense_category as enum ('rent','salaries','utilities','ingredients','maintenance','marketing','licenses','misc');
exception when duplicate_object then null; end $$;

do $$ begin
  create type recurring_freq as enum ('monthly','weekly','yearly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ticket_category as enum ('order_issue','payment_issue','booking_issue','app_bug','restaurant_complaint','account_issue','feedback','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ticket_priority as enum ('low','medium','high','critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ticket_status as enum ('open','in_progress','waiting_on_user','resolved','closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sender_type as enum ('user','admin');
exception when duplicate_object then null; end $$;


-- ========================================================================
-- 003: Core tables
-- ========================================================================

-- USERS ---------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text,
  phone text,
  role user_role not null default 'customer',
  avatar_url text,
  dob date,
  gender text,
  food_preferences text[] default '{}',
  allergens text[] default '{}',
  loyalty_points int not null default 0,
  loyalty_tier loyalty_tier not null default 'silver',
  referral_code text unique,
  is_active bool not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_users_role on public.users(role);
create index if not exists idx_users_referral on public.users(referral_code);
drop trigger if exists tg_users_updated on public.users;
create trigger tg_users_updated before update on public.users
  for each row execute function public.tg_set_updated_at();

-- RESTAURANTS ---------------------------------------------------------
create table if not exists public.restaurants (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  slug text unique not null,
  description text,
  type restaurant_type not null default 'cafe',
  cuisines text[] default '{}',
  rating numeric(3,2) not null default 0,
  review_count int not null default 0,
  price_range int not null default 2 check (price_range between 1 and 4),
  address text,
  city text,
  lat numeric(10,7),
  lng numeric(10,7),
  phone text,
  email text,
  hours jsonb not null default '{}'::jsonb,
  amenities text[] default '{}',
  fssai_number text,
  gst_number text,
  tax_rate numeric(5,2) not null default 5.0,
  service_charge_rate numeric(5,2) not null default 0,
  cover_image_url text,
  gallery_images text[] default '{}',
  status restaurant_status not null default 'pending',
  featured bool not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_restaurants_owner on public.restaurants(owner_id);
create index if not exists idx_restaurants_city on public.restaurants(city);
create index if not exists idx_restaurants_status on public.restaurants(status);
create index if not exists idx_restaurants_featured on public.restaurants(featured);
drop trigger if exists tg_restaurants_updated on public.restaurants;
create trigger tg_restaurants_updated before update on public.restaurants
  for each row execute function public.tg_set_updated_at();

-- STAFF ---------------------------------------------------------------
create table if not exists public.staff (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  name text not null,
  phone text,
  role staff_role not null,
  pin text not null,
  permissions jsonb not null default '{}'::jsonb,
  shift_start time,
  shift_end time,
  shift_days int[] default '{1,2,3,4,5,6}',
  is_active bool not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, pin)
);
create index if not exists idx_staff_restaurant on public.staff(restaurant_id);
create index if not exists idx_staff_user on public.staff(user_id);
drop trigger if exists tg_staff_updated on public.staff;
create trigger tg_staff_updated before update on public.staff
  for each row execute function public.tg_set_updated_at();

-- TABLES --------------------------------------------------------------
create table if not exists public.tables (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  number int not null,
  seats int not null default 4,
  zone table_zone not null default 'indoor',
  status table_status not null default 'available',
  assigned_server_id uuid references public.staff(id) on delete set null,
  qr_data text not null,
  position_x numeric(6,2) default 0,
  position_y numeric(6,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, number)
);
create index if not exists idx_tables_restaurant on public.tables(restaurant_id);
create index if not exists idx_tables_status on public.tables(status);
drop trigger if exists tg_tables_updated on public.tables;
create trigger tg_tables_updated before update on public.tables
  for each row execute function public.tg_set_updated_at();

-- MENU ----------------------------------------------------------------
create table if not exists public.menu_categories (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text,
  icon text default 'fork.knife',
  sort_order int not null default 0,
  is_active bool not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_categories_restaurant on public.menu_categories(restaurant_id);
drop trigger if exists tg_categories_updated on public.menu_categories;
create trigger tg_categories_updated before update on public.menu_categories
  for each row execute function public.tg_set_updated_at();

create table if not exists public.menu_items (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid references public.menu_categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null,
  variants jsonb default '[]'::jsonb,
  addons jsonb default '[]'::jsonb,
  remove_options text[] default '{}',
  images text[] default '{}',
  is_veg bool not null default true,
  is_bestseller bool not null default false,
  spice_level int not null default 0 check (spice_level between 0 and 4),
  allergens text[] default '{}',
  prep_time_minutes int not null default 15,
  calories int,
  is_available bool not null default true,
  available_from time,
  available_until time,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_items_restaurant on public.menu_items(restaurant_id);
create index if not exists idx_items_category on public.menu_items(category_id);
create index if not exists idx_items_available on public.menu_items(is_available);
drop trigger if exists tg_items_updated on public.menu_items;
create trigger tg_items_updated before update on public.menu_items
  for each row execute function public.tg_set_updated_at();

-- BOOKINGS / WAITLIST -------------------------------------------------
create table if not exists public.bookings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id uuid references public.tables(id) on delete set null,
  date date not null,
  time time not null,
  guests int not null default 2,
  seating_preference seating_pref not null default 'any',
  occasion text,
  special_requests text,
  status booking_status not null default 'pending',
  source booking_source not null default 'app',
  qr_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_bookings_user on public.bookings(user_id);
create index if not exists idx_bookings_restaurant on public.bookings(restaurant_id);
create index if not exists idx_bookings_date on public.bookings(date);
create index if not exists idx_bookings_status on public.bookings(status);
drop trigger if exists tg_bookings_updated on public.bookings;
create trigger tg_bookings_updated before update on public.bookings
  for each row execute function public.tg_set_updated_at();

create table if not exists public.waitlist (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  phone text,
  party_size int not null,
  seating_preference seating_pref not null default 'any',
  position int not null default 1,
  estimated_wait_minutes int not null default 20,
  status waitlist_status not null default 'waiting',
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_waitlist_restaurant on public.waitlist(restaurant_id);
create index if not exists idx_waitlist_user on public.waitlist(user_id);
drop trigger if exists tg_waitlist_updated on public.waitlist;
create trigger tg_waitlist_updated before update on public.waitlist
  for each row execute function public.tg_set_updated_at();

-- ORDERS --------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null default short_code('DIME'),
  user_id uuid references public.users(id) on delete set null,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id uuid references public.tables(id) on delete set null,
  server_id uuid references public.staff(id) on delete set null,
  type order_type not null default 'dine_in',
  subtotal numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  tax_amount numeric(10,2) not null default 0,
  service_charge_amount numeric(10,2) not null default 0,
  tip_amount numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  promo_code text,
  points_redeemed int not null default 0,
  status order_status not null default 'received',
  payment_status payment_status not null default 'unpaid',
  customer_notes text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_restaurant on public.orders(restaurant_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_table on public.orders(table_id);
create index if not exists idx_orders_created on public.orders(created_at desc);
drop trigger if exists tg_orders_updated on public.orders;
create trigger tg_orders_updated before update on public.orders
  for each row execute function public.tg_set_updated_at();

create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null,
  unit_price numeric(10,2) not null,
  quantity int not null default 1,
  variant text,
  addons jsonb default '[]'::jsonb,
  removed_ingredients text[] default '{}',
  special_instructions text,
  line_total numeric(10,2) not null,
  status order_item_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_oi_order on public.order_items(order_id);
create index if not exists idx_oi_item on public.order_items(menu_item_id);
drop trigger if exists tg_oi_updated on public.order_items;
create trigger tg_oi_updated before update on public.order_items
  for each row execute function public.tg_set_updated_at();

-- REVIEWS -------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  overall_rating int not null check (overall_rating between 1 and 5),
  food_rating int check (food_rating between 1 and 5),
  service_rating int check (service_rating between 1 and 5),
  ambience_rating int check (ambience_rating between 1 and 5),
  value_rating int check (value_rating between 1 and 5),
  text text,
  photos text[] default '{}',
  dish_tags text[] default '{}',
  recommend bool not null default true,
  reply_text text,
  reply_at timestamptz,
  is_published bool not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_reviews_restaurant on public.reviews(restaurant_id);
create index if not exists idx_reviews_user on public.reviews(user_id);
drop trigger if exists tg_reviews_updated on public.reviews;
create trigger tg_reviews_updated before update on public.reviews
  for each row execute function public.tg_set_updated_at();

-- LOYALTY / OFFERS / NOTIFICATIONS -----------------------------------
create table if not exists public.loyalty_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  type loyalty_tx_type not null,
  points int not null,
  reference_id uuid,
  description text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_lt_user on public.loyalty_transactions(user_id);
create index if not exists idx_lt_type on public.loyalty_transactions(type);

create table if not exists public.offers (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  title text not null,
  description text,
  discount_type discount_type not null,
  discount_value numeric(10,2) not null,
  min_order_amount numeric(10,2) not null default 0,
  max_discount_cap numeric(10,2),
  promo_code text unique,
  valid_from timestamptz not null default now(),
  valid_to timestamptz not null default (now() + interval '30 days'),
  usage_limit_total int,
  usage_limit_per_user int not null default 1,
  used_count int not null default 0,
  applicable_on text[] default '{dine_in,takeaway,delivery}',
  target_audience target_audience not null default 'all',
  is_active bool not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_offers_restaurant on public.offers(restaurant_id);
create index if not exists idx_offers_active on public.offers(is_active);
drop trigger if exists tg_offers_updated on public.offers;
create trigger tg_offers_updated before update on public.offers
  for each row execute function public.tg_set_updated_at();

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  type notification_type not null,
  title text not null,
  message text not null,
  data jsonb default '{}'::jsonb,
  is_read bool not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notif_user on public.notifications(user_id, is_read);

-- INVENTORY / EXPENSES -----------------------------------------------
create table if not exists public.inventory (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  quantity numeric(12,3) not null default 0,
  unit inventory_unit not null default 'kg',
  price_per_unit numeric(10,2) not null default 0,
  min_threshold numeric(12,3) not null default 0,
  supplier_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_inv_restaurant on public.inventory(restaurant_id);
drop trigger if exists tg_inv_updated on public.inventory;
create trigger tg_inv_updated before update on public.inventory
  for each row execute function public.tg_set_updated_at();

create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  amount numeric(12,2) not null,
  category expense_category not null,
  date date not null default current_date,
  description text,
  receipt_url text,
  is_recurring bool not null default false,
  recurring_frequency recurring_freq,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_exp_restaurant on public.expenses(restaurant_id);
create index if not exists idx_exp_date on public.expenses(date);
drop trigger if exists tg_exp_updated on public.expenses;
create trigger tg_exp_updated before update on public.expenses
  for each row execute function public.tg_set_updated_at();

-- SUPPORT -------------------------------------------------------------
create table if not exists public.support_tickets (
  id uuid primary key default uuid_generate_v4(),
  ticket_number text unique not null default short_code('TKT'),
  user_id uuid references public.users(id) on delete set null,
  restaurant_id uuid references public.restaurants(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  category ticket_category not null default 'other',
  priority ticket_priority not null default 'medium',
  subject text not null,
  status ticket_status not null default 'open',
  assigned_to uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_tkt_user on public.support_tickets(user_id);
create index if not exists idx_tkt_status on public.support_tickets(status);
drop trigger if exists tg_tkt_updated on public.support_tickets;
create trigger tg_tkt_updated before update on public.support_tickets
  for each row execute function public.tg_set_updated_at();

create table if not exists public.support_messages (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_type sender_type not null,
  sender_id uuid references public.users(id) on delete set null,
  message text not null,
  attachments text[] default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_tm_ticket on public.support_messages(ticket_id);

-- BANNERS / COLLECTIONS / AUDIT --------------------------------------
create table if not exists public.banners (
  id uuid primary key default uuid_generate_v4(),
  image_url text not null,
  link_target text,
  position int not null default 0,
  is_active bool not null default true,
  start_date timestamptz not null default now(),
  end_date timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists tg_banners_updated on public.banners;
create trigger tg_banners_updated before update on public.banners
  for each row execute function public.tg_set_updated_at();

create table if not exists public.collections (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  cover_image_url text,
  restaurant_ids uuid[] default '{}',
  sort_order int not null default 0,
  is_active bool not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists tg_collections_updated on public.collections;
create trigger tg_collections_updated before update on public.collections
  for each row execute function public.tg_set_updated_at();

create table if not exists public.audit_log (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid,
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_entity on public.audit_log(entity_type, entity_id);
create index if not exists idx_audit_actor on public.audit_log(actor_id);


-- ========================================================================
-- 004: Domain functions & triggers
-- ========================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  i int;
begin
  for i in 1..6 loop
    code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  insert into public.users (id, email, name, role, referral_code)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer'),
    'DIME' || code
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.update_restaurant_rating()
returns trigger language plpgsql as $$
declare
  rid uuid := coalesce(new.restaurant_id, old.restaurant_id);
begin
  update public.restaurants r
    set rating = coalesce((
          select round(avg(overall_rating)::numeric, 2)
          from public.reviews where restaurant_id = rid and is_published
        ), 0),
        review_count = (
          select count(*) from public.reviews where restaurant_id = rid and is_published
        )
    where r.id = rid;
  return null;
end $$;

drop trigger if exists tg_reviews_rating on public.reviews;
create trigger tg_reviews_rating
  after insert or update or delete on public.reviews
  for each row execute function public.update_restaurant_rating();

create or replace function public.calculate_loyalty_tier(points int)
returns loyalty_tier language sql immutable as $$
  select case
    when points >= 5000 then 'diamond'::loyalty_tier
    when points >= 2000 then 'platinum'::loyalty_tier
    when points >= 500 then 'gold'::loyalty_tier
    else 'silver'::loyalty_tier
  end
$$;

create or replace function public.tg_loyalty_ledger()
returns trigger language plpgsql as $$
declare
  new_total int;
begin
  select coalesce(sum(points),0) into new_total
    from public.loyalty_transactions where user_id = new.user_id;
  update public.users
     set loyalty_points = new_total,
         loyalty_tier = public.calculate_loyalty_tier(new_total)
   where id = new.user_id;
  return new;
end $$;

drop trigger if exists tg_loyalty_after_insert on public.loyalty_transactions;
create trigger tg_loyalty_after_insert
  after insert on public.loyalty_transactions
  for each row execute function public.tg_loyalty_ledger();

-- Order status effects (uses the 010 version with full notification coverage)
create or replace function public.tg_order_status_effects()
returns trigger language plpgsql as $$
declare
  earn int;
begin
  if new.status = 'preparing' and old.status <> 'preparing' and new.user_id is not null then
    insert into public.notifications(user_id, type, title, message, data)
    values (new.user_id, 'order_update',
            'Your order is being prepared',
            'The kitchen has started on order ' || new.order_number || '.',
            jsonb_build_object('order_id', new.id));
  end if;

  if new.status = 'ready' and old.status <> 'ready' and new.user_id is not null then
    insert into public.notifications(user_id, type, title, message, data)
    values (new.user_id, 'order_update',
            'Your order is ready',
            'Order ' || new.order_number || ' is ready to be served.',
            jsonb_build_object('order_id', new.id));
  end if;

  if new.status = 'served' and old.status <> 'served' and new.user_id is not null then
    insert into public.notifications(user_id, type, title, message, data)
    values (new.user_id, 'order_update',
            'Bon appétit',
            'Your order has been served. Enjoy!',
            jsonb_build_object('order_id', new.id));
  end if;

  if new.status = 'paid' and (old.status is null or old.status <> 'paid') then
    new.payment_status := 'paid';
    if new.table_id is not null then
      update public.tables set status = 'available', assigned_server_id = null
        where id = new.table_id;
    end if;
    if new.user_id is not null then
      earn := floor(new.total_amount / 10)::int;
      if earn > 0 then
        insert into public.loyalty_transactions(user_id, type, points, reference_id, description, expires_at)
        values (new.user_id, 'earned_order', earn, new.id,
                'Earned from order ' || new.order_number,
                now() + interval '365 days');
      end if;
      insert into public.notifications(user_id, type, title, message, data)
      values (new.user_id, 'order_update',
              'Order complete',
              'Order ' || new.order_number || ' is complete. You earned ' || earn || ' loyalty points.',
              jsonb_build_object('order_id', new.id));
    end if;
  end if;

  return new;
end $$;

drop trigger if exists tg_orders_status on public.orders;
create trigger tg_orders_status
  before update on public.orders
  for each row execute function public.tg_order_status_effects();

create or replace function public.tg_booking_notify()
returns trigger language plpgsql as $$
begin
  if new.user_id is not null and (tg_op = 'INSERT' or new.status <> old.status) then
    insert into public.notifications(user_id, type, title, message, data)
    values (new.user_id, 'booking_update',
            'Booking ' || new.status,
            'Your booking on ' || to_char(new.date,'DD Mon') || ' at ' || to_char(new.time,'HH12:MI AM') ||
            ' is ' || new.status,
            jsonb_build_object('booking_id', new.id));
  end if;
  return new;
end $$;

drop trigger if exists tg_bookings_notify on public.bookings;
create trigger tg_bookings_notify
  after insert or update of status on public.bookings
  for each row execute function public.tg_booking_notify();

create or replace view public.inventory_with_status as
  select i.*,
         case
           when i.quantity <= 0 then 'out_of_stock'::inventory_status
           when i.quantity <= i.min_threshold then 'low_stock'::inventory_status
           else 'in_stock'::inventory_status
         end as status
  from public.inventory i;

create or replace function public.tg_tables_qr()
returns trigger language plpgsql as $$
begin
  if new.qr_data is null or new.qr_data = '' then
    new.qr_data := json_build_object('r', new.restaurant_id, 't', new.number)::text;
  end if;
  return new;
end $$;

drop trigger if exists tg_tables_qr_before_insert on public.tables;
create trigger tg_tables_qr_before_insert
  before insert on public.tables
  for each row execute function public.tg_tables_qr();

create or replace function public.recompute_order_totals(p_order_id uuid)
returns void language plpgsql as $$
declare
  v_subtotal numeric := 0;
  v_tax_rate numeric := 0;
  v_service_rate numeric := 0;
  v_disc numeric := 0;
  v_tip numeric := 0;
  v_redeemed int := 0;
begin
  select coalesce(sum(line_total),0) into v_subtotal
    from public.order_items where order_id = p_order_id;
  select r.tax_rate, r.service_charge_rate, o.discount_amount, o.tip_amount, o.points_redeemed
    into v_tax_rate, v_service_rate, v_disc, v_tip, v_redeemed
  from public.orders o join public.restaurants r on r.id = o.restaurant_id
  where o.id = p_order_id;

  update public.orders
     set subtotal = v_subtotal,
         tax_amount = round((v_subtotal - v_disc) * v_tax_rate / 100, 2),
         service_charge_amount = round(v_subtotal * v_service_rate / 100, 2),
         total_amount = round(
           greatest(v_subtotal - v_disc - (v_redeemed * 0.5), 0)
           + round((v_subtotal - v_disc) * v_tax_rate / 100, 2)
           + round(v_subtotal * v_service_rate / 100, 2)
           + v_tip
         , 2)
   where id = p_order_id;
end $$;

create or replace function public.tg_order_items_recompute()
returns trigger language plpgsql as $$
begin
  perform public.recompute_order_totals(coalesce(new.order_id, old.order_id));
  return null;
end $$;

drop trigger if exists tg_oi_recompute on public.order_items;
create trigger tg_oi_recompute
  after insert or update or delete on public.order_items
  for each row execute function public.tg_order_items_recompute();


-- ========================================================================
-- 005: Row Level Security
-- ========================================================================

create or replace function public.is_restaurant_staff(p_restaurant_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.staff
    where restaurant_id = p_restaurant_id
      and user_id = auth.uid()
      and is_active
  ) or exists (
    select 1 from public.restaurants
    where id = p_restaurant_id and owner_id = auth.uid()
  );
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'super_admin'
  );
$$;

-- USERS
alter table public.users enable row level security;
drop policy if exists "users_self_read" on public.users;
create policy "users_self_read" on public.users for select using (auth.uid() = id or public.is_super_admin());
drop policy if exists "users_self_update" on public.users;
create policy "users_self_update" on public.users for update using (auth.uid() = id or public.is_super_admin());
drop policy if exists "users_admin_all" on public.users;
create policy "users_admin_all" on public.users for all using (public.is_super_admin()) with check (public.is_super_admin());

-- RESTAURANTS
alter table public.restaurants enable row level security;
drop policy if exists "restaurants_public_read" on public.restaurants;
create policy "restaurants_public_read" on public.restaurants for select
  using (status = 'verified' or auth.uid() = owner_id or public.is_super_admin() or public.is_restaurant_staff(id));
drop policy if exists "restaurants_owner_insert" on public.restaurants;
create policy "restaurants_owner_insert" on public.restaurants for insert with check (auth.uid() = owner_id);
drop policy if exists "restaurants_owner_update" on public.restaurants;
create policy "restaurants_owner_update" on public.restaurants for update using (auth.uid() = owner_id or public.is_super_admin());
drop policy if exists "restaurants_admin_all" on public.restaurants;
create policy "restaurants_admin_all" on public.restaurants for all using (public.is_super_admin()) with check (public.is_super_admin());

-- STAFF
alter table public.staff enable row level security;
drop policy if exists "staff_restaurant_read" on public.staff;
create policy "staff_restaurant_read" on public.staff for select using (
  public.is_restaurant_staff(restaurant_id) or user_id = auth.uid() or public.is_super_admin()
);
drop policy if exists "staff_owner_write" on public.staff;
create policy "staff_owner_write" on public.staff for all using (
  exists (select 1 from public.restaurants r where r.id = staff.restaurant_id and r.owner_id = auth.uid())
  or public.is_super_admin()
) with check (
  exists (select 1 from public.restaurants r where r.id = staff.restaurant_id and r.owner_id = auth.uid())
  or public.is_super_admin()
);

-- TABLES
alter table public.tables enable row level security;
drop policy if exists "tables_read" on public.tables;
create policy "tables_read" on public.tables for select using (true);
drop policy if exists "tables_staff_write" on public.tables;
create policy "tables_staff_write" on public.tables for all using (
  public.is_restaurant_staff(restaurant_id) or public.is_super_admin()
) with check (
  public.is_restaurant_staff(restaurant_id) or public.is_super_admin()
);

-- MENU
alter table public.menu_categories enable row level security;
drop policy if exists "cats_read" on public.menu_categories;
create policy "cats_read" on public.menu_categories for select using (true);
drop policy if exists "cats_staff_write" on public.menu_categories;
create policy "cats_staff_write" on public.menu_categories for all
  using (public.is_restaurant_staff(restaurant_id) or public.is_super_admin())
  with check (public.is_restaurant_staff(restaurant_id) or public.is_super_admin());

alter table public.menu_items enable row level security;
drop policy if exists "items_read" on public.menu_items;
create policy "items_read" on public.menu_items for select using (true);
drop policy if exists "items_staff_write" on public.menu_items;
create policy "items_staff_write" on public.menu_items for all
  using (public.is_restaurant_staff(restaurant_id) or public.is_super_admin())
  with check (public.is_restaurant_staff(restaurant_id) or public.is_super_admin());

-- BOOKINGS
alter table public.bookings enable row level security;
drop policy if exists "bookings_self_read" on public.bookings;
create policy "bookings_self_read" on public.bookings for select
  using (user_id = auth.uid() or public.is_restaurant_staff(restaurant_id) or public.is_super_admin());
drop policy if exists "bookings_user_insert" on public.bookings;
create policy "bookings_user_insert" on public.bookings for insert
  with check (user_id = auth.uid() or public.is_restaurant_staff(restaurant_id));
drop policy if exists "bookings_update" on public.bookings;
create policy "bookings_update" on public.bookings for update
  using (user_id = auth.uid() or public.is_restaurant_staff(restaurant_id) or public.is_super_admin());

-- WAITLIST
alter table public.waitlist enable row level security;
drop policy if exists "waitlist_read" on public.waitlist;
create policy "waitlist_read" on public.waitlist for select
  using (user_id = auth.uid() or public.is_restaurant_staff(restaurant_id) or public.is_super_admin());
drop policy if exists "waitlist_write" on public.waitlist;
create policy "waitlist_write" on public.waitlist for all
  using (user_id = auth.uid() or public.is_restaurant_staff(restaurant_id) or public.is_super_admin())
  with check (user_id = auth.uid() or public.is_restaurant_staff(restaurant_id) or public.is_super_admin());

-- ORDERS
alter table public.orders enable row level security;
drop policy if exists "orders_read" on public.orders;
create policy "orders_read" on public.orders for select
  using (user_id = auth.uid() or public.is_restaurant_staff(restaurant_id) or public.is_super_admin());
drop policy if exists "orders_insert" on public.orders;
create policy "orders_insert" on public.orders for insert
  with check (user_id = auth.uid() or public.is_restaurant_staff(restaurant_id));
drop policy if exists "orders_update" on public.orders;
create policy "orders_update" on public.orders for update
  using (public.is_restaurant_staff(restaurant_id) or public.is_super_admin());

alter table public.order_items enable row level security;
drop policy if exists "oi_read" on public.order_items;
create policy "oi_read" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_items.order_id
                 and (o.user_id = auth.uid() or public.is_restaurant_staff(o.restaurant_id) or public.is_super_admin())));
drop policy if exists "oi_write" on public.order_items;
create policy "oi_write" on public.order_items for all
  using (exists (select 1 from public.orders o where o.id = order_items.order_id
                 and (o.user_id = auth.uid() or public.is_restaurant_staff(o.restaurant_id) or public.is_super_admin())))
  with check (exists (select 1 from public.orders o where o.id = order_items.order_id
                 and (o.user_id = auth.uid() or public.is_restaurant_staff(o.restaurant_id) or public.is_super_admin())));

-- REVIEWS
alter table public.reviews enable row level security;
drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read" on public.reviews for select using (is_published or user_id = auth.uid());
drop policy if exists "reviews_self_write" on public.reviews;
create policy "reviews_self_write" on public.reviews for insert with check (user_id = auth.uid());
drop policy if exists "reviews_self_update" on public.reviews;
create policy "reviews_self_update" on public.reviews for update
  using (user_id = auth.uid() or exists (
    select 1 from public.restaurants r where r.id = reviews.restaurant_id and r.owner_id = auth.uid()
  ) or public.is_super_admin());
drop policy if exists "reviews_self_delete" on public.reviews;
create policy "reviews_self_delete" on public.reviews for delete
  using (user_id = auth.uid() or public.is_super_admin());

-- LOYALTY
alter table public.loyalty_transactions enable row level security;
drop policy if exists "lt_self_read" on public.loyalty_transactions;
create policy "lt_self_read" on public.loyalty_transactions for select
  using (user_id = auth.uid() or public.is_super_admin());
drop policy if exists "lt_insert" on public.loyalty_transactions;
create policy "lt_insert" on public.loyalty_transactions for insert
  with check (user_id = auth.uid() or public.is_super_admin());

-- OFFERS
alter table public.offers enable row level security;
drop policy if exists "offers_read" on public.offers;
create policy "offers_read" on public.offers for select using (is_active or public.is_super_admin()
  or (restaurant_id is not null and public.is_restaurant_staff(restaurant_id)));
drop policy if exists "offers_write" on public.offers;
create policy "offers_write" on public.offers for all
  using (public.is_super_admin() or (restaurant_id is not null and public.is_restaurant_staff(restaurant_id)))
  with check (public.is_super_admin() or (restaurant_id is not null and public.is_restaurant_staff(restaurant_id)));

-- NOTIFICATIONS
alter table public.notifications enable row level security;
drop policy if exists "notif_self" on public.notifications;
create policy "notif_self" on public.notifications for select using (user_id = auth.uid());
drop policy if exists "notif_self_update" on public.notifications;
create policy "notif_self_update" on public.notifications for update using (user_id = auth.uid());
drop policy if exists "notif_admin_insert" on public.notifications;
create policy "notif_admin_insert" on public.notifications for insert with check (public.is_super_admin() or user_id = auth.uid());

-- INVENTORY / EXPENSES
alter table public.inventory enable row level security;
drop policy if exists "inv_staff" on public.inventory;
create policy "inv_staff" on public.inventory for all
  using (public.is_restaurant_staff(restaurant_id) or public.is_super_admin())
  with check (public.is_restaurant_staff(restaurant_id) or public.is_super_admin());

alter table public.expenses enable row level security;
drop policy if exists "exp_staff" on public.expenses;
create policy "exp_staff" on public.expenses for all
  using (public.is_restaurant_staff(restaurant_id) or public.is_super_admin())
  with check (public.is_restaurant_staff(restaurant_id) or public.is_super_admin());

-- SUPPORT
alter table public.support_tickets enable row level security;
drop policy if exists "tkt_read" on public.support_tickets;
create policy "tkt_read" on public.support_tickets for select
  using (user_id = auth.uid() or assigned_to = auth.uid() or public.is_super_admin());
drop policy if exists "tkt_insert" on public.support_tickets;
create policy "tkt_insert" on public.support_tickets for insert with check (user_id = auth.uid() or public.is_super_admin());
drop policy if exists "tkt_update" on public.support_tickets;
create policy "tkt_update" on public.support_tickets for update
  using (user_id = auth.uid() or assigned_to = auth.uid() or public.is_super_admin());

alter table public.support_messages enable row level security;
drop policy if exists "tm_all" on public.support_messages;
create policy "tm_all" on public.support_messages for all
  using (exists (select 1 from public.support_tickets t where t.id = ticket_id
                 and (t.user_id = auth.uid() or t.assigned_to = auth.uid() or public.is_super_admin())))
  with check (exists (select 1 from public.support_tickets t where t.id = ticket_id
                 and (t.user_id = auth.uid() or t.assigned_to = auth.uid() or public.is_super_admin())));

-- BANNERS / COLLECTIONS / AUDIT
alter table public.banners enable row level security;
drop policy if exists "banners_read" on public.banners;
create policy "banners_read" on public.banners for select using (is_active or public.is_super_admin());
drop policy if exists "banners_admin" on public.banners;
create policy "banners_admin" on public.banners for all using (public.is_super_admin()) with check (public.is_super_admin());

alter table public.collections enable row level security;
drop policy if exists "collections_read" on public.collections;
create policy "collections_read" on public.collections for select using (is_active or public.is_super_admin());
drop policy if exists "collections_admin" on public.collections;
create policy "collections_admin" on public.collections for all using (public.is_super_admin()) with check (public.is_super_admin());

alter table public.audit_log enable row level security;
drop policy if exists "audit_admin_read" on public.audit_log;
create policy "audit_admin_read" on public.audit_log for select using (public.is_super_admin());
drop policy if exists "audit_insert" on public.audit_log;
create policy "audit_insert" on public.audit_log for insert with check (actor_id = auth.uid() or auth.uid() is null);

-- REALTIME (idempotent — ignore if already added)
do $$ begin alter publication supabase_realtime add table public.orders; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.order_items; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.tables; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.waitlist; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.notifications; exception when duplicate_object then null; end $$;


-- ========================================================================
-- 006: Seed users & restaurants
-- ========================================================================

do $$ declare
  uid_demo constant uuid := '11111111-1111-1111-1111-111111111111';
  uid_priya constant uuid := '22222222-2222-2222-2222-222222222222';
  uid_rahul constant uuid := '33333333-3333-3333-3333-333333333333';
  uid_owner constant uuid := '44444444-4444-4444-4444-444444444444';
  uid_admin constant uuid := '55555555-5555-5555-5555-555555555555';
begin
  -- Remove any stale auth users with these emails (e.g. from prior signup tests)
  delete from auth.users where email in ('demo@dime.app','priya@dime.app','rahul@dime.app','owner@dime.app','admin@dime.app');

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change_token_new, recovery_token)
  values
    ('00000000-0000-0000-0000-000000000000', uid_demo, 'authenticated','authenticated','demo@dime.app',
      crypt('demo123', gen_salt('bf')), now(), '{"name":"Demo User"}'::jsonb, now(), now(), '', '', ''),
    ('00000000-0000-0000-0000-000000000000', uid_priya,'authenticated','authenticated','priya@dime.app',
      crypt('priya123', gen_salt('bf')), now(), '{"name":"Priya Sharma"}'::jsonb, now(), now(), '', '', ''),
    ('00000000-0000-0000-0000-000000000000', uid_rahul,'authenticated','authenticated','rahul@dime.app',
      crypt('rahul123', gen_salt('bf')), now(), '{"name":"Rahul Verma"}'::jsonb, now(), now(), '', '', ''),
    ('00000000-0000-0000-0000-000000000000', uid_owner,'authenticated','authenticated','owner@dime.app',
      crypt('owner123', gen_salt('bf')), now(), '{"name":"Arjun Mehta","role":"owner"}'::jsonb, now(), now(), '', '', ''),
    ('00000000-0000-0000-0000-000000000000', uid_admin,'authenticated','authenticated','admin@dime.app',
      crypt('admin123', gen_salt('bf')), now(), '{"name":"DIME Admin","role":"super_admin"}'::jsonb, now(), now(), '', '', '')
  on conflict (id) do nothing;

  -- Fix nullable string columns GoTrue expects to be non-null
  update auth.users
  set email_change = '',
      email_change_token_current = '',
      email_change_confirm_status = 0,
      phone = null,
      phone_change = '',
      phone_change_token = '',
      reauthentication_token = '',
      is_sso_user = false
  where email in ('demo@dime.app','priya@dime.app','rahul@dime.app','owner@dime.app','admin@dime.app');

  -- Create identity rows (required for email/password sign-in)
  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  select u.id, u.id, u.id::text, 'email',
    jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
    now(), now(), now()
  from auth.users u
  where u.email in ('demo@dime.app','priya@dime.app','rahul@dime.app','owner@dime.app','admin@dime.app')
  on conflict (provider, provider_id) do nothing;

  insert into public.users (id, email, name, role, phone, loyalty_points, loyalty_tier, referral_code)
  values
    (uid_demo , 'demo@dime.app' , 'Demo User'   , 'customer',    '+919900000001',   0, 'silver'  , 'DIMEDEMO'),
    (uid_priya, 'priya@dime.app', 'Priya Sharma', 'customer',    '+919900000002', 750, 'gold'    , 'DIMEPRYA'),
    (uid_rahul, 'rahul@dime.app', 'Rahul Verma' , 'customer',    '+919900000003', 120, 'silver'  , 'DIMERAHU'),
    (uid_owner, 'owner@dime.app', 'Arjun Mehta' , 'owner',       '+919900000004',   0, 'silver'  , 'DIMEOWN1'),
    (uid_admin, 'admin@dime.app', 'DIME Admin'  , 'super_admin', '+919900000005',   0, 'silver'  , 'DIMEADM1')
  on conflict (id) do update
    set name = excluded.name,
        role = excluded.role,
        phone = excluded.phone,
        loyalty_points = excluded.loyalty_points,
        loyalty_tier = excluded.loyalty_tier,
        referral_code = excluded.referral_code;
end $$;

insert into public.restaurants (id, owner_id, name, slug, description, type, cuisines, price_range, address, city, lat, lng, phone, email, hours, amenities, fssai_number, gst_number, tax_rate, service_charge_rate, cover_image_url, gallery_images, status, featured)
values
  ('a1111111-0000-0000-0000-000000000001',
   '44444444-4444-4444-4444-444444444444',
   'The Golden Spice','the-golden-spice',
   'North Indian classics served in a warm tandoor-lit room. Famed for its butter chicken and Peshawari naan.',
   'fine_dine', array['North Indian','Mughlai','Tandoor'], 3,
   '80 Feet Road, 5th Block, Koramangala','Bengaluru',12.9352,77.6245,
   '+918040001111','hello@goldenspice.in',
   '{"mon":{"open":"12:00","close":"23:00"},"tue":{"open":"12:00","close":"23:00"},"wed":{"open":"12:00","close":"23:00"},"thu":{"open":"12:00","close":"23:00"},"fri":{"open":"12:00","close":"23:30"},"sat":{"open":"12:00","close":"23:30"},"sun":{"open":"12:00","close":"23:00"}}'::jsonb,
   array['Wifi','Parking','AC','Live Music','Outdoor Seating'],
   '12345678901234','29ABCDE1234F1Z5',5.0,5.0,
   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
   array[
     'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200',
     'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200',
     'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200'
   ],
   'verified', true),

  ('a1111111-0000-0000-0000-000000000002',
   '44444444-4444-4444-4444-444444444444',
   'Bella Italia','bella-italia',
   'Wood-fired pizzas and hand-rolled pastas from a Naples-trained chef.',
   'fine_dine', array['Italian','Pizza','Pasta'], 3,
   '100 Feet Road, Indiranagar','Bengaluru',12.9719,77.6412,
   '+918040002222','ciao@bellaitalia.in',
   '{"mon":{"open":"12:00","close":"23:00"},"tue":{"open":"12:00","close":"23:00"},"wed":{"open":"12:00","close":"23:00"},"thu":{"open":"12:00","close":"23:00"},"fri":{"open":"12:00","close":"23:30"},"sat":{"open":"12:00","close":"23:30"},"sun":{"open":"12:00","close":"23:00"}}'::jsonb,
   array['Wifi','Parking','AC','Wine Bar'],
   '22345678901234','29ABCDE1234F1Z6',5.0,5.0,
   'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200',
   array[
     'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200',
     'https://images.unsplash.com/photo-1542444459-db63c1d1c5c5?w=1200'
   ],
   'verified', true),

  ('a1111111-0000-0000-0000-000000000003',
   '44444444-4444-4444-4444-444444444444',
   'Sushi Master','sushi-master',
   'Omakase sushi bar and contemporary Japanese small plates.',
   'fine_dine', array['Japanese','Sushi','Asian'], 4,
   'UB City Mall, Level 2, Vittal Mallya Road','Bengaluru',12.9719,77.5963,
   '+918040003333','hello@sushimaster.in',
   '{"mon":{"open":"12:30","close":"23:00"},"tue":{"open":"12:30","close":"23:00"},"wed":{"open":"12:30","close":"23:00"},"thu":{"open":"12:30","close":"23:00"},"fri":{"open":"12:30","close":"23:30"},"sat":{"open":"12:30","close":"23:30"},"sun":{"open":"12:30","close":"23:00"}}'::jsonb,
   array['Wifi','Valet','AC','Chef Counter'],
   '32345678901234','29ABCDE1234F1Z7',5.0,8.0,
   'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200',
   array['https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=1200'],
   'verified', true),

  ('a1111111-0000-0000-0000-000000000004',
   '44444444-4444-4444-4444-444444444444',
   'Green Bowl Cafe','green-bowl-cafe',
   'Plant-forward bowls, cold-pressed juices, and single-origin coffee.',
   'cafe', array['Vegan','Healthy','Salads'], 2,
   '27th Main, HSR Layout Sector 2','Bengaluru',12.9121,77.6446,
   '+918040004444','hello@greenbowl.in',
   '{"mon":{"open":"07:30","close":"22:00"},"tue":{"open":"07:30","close":"22:00"},"wed":{"open":"07:30","close":"22:00"},"thu":{"open":"07:30","close":"22:00"},"fri":{"open":"07:30","close":"23:00"},"sat":{"open":"07:30","close":"23:00"},"sun":{"open":"08:00","close":"22:00"}}'::jsonb,
   array['Wifi','Pet Friendly','Outdoor Seating'],
   '42345678901234','29ABCDE1234F1Z8',5.0,0.0,
   'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200',
   array['https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200'],
   'verified', true),

  ('a1111111-0000-0000-0000-000000000005',
   '44444444-4444-4444-4444-444444444444',
   'Tandoor & Grill','tandoor-and-grill',
   'Charcoal kebabs, biryanis and North West frontier cuisine in Whitefield.',
   'fine_dine', array['North Indian','Mughlai','Kebab'], 3,
   'Phoenix Marketcity, Whitefield Main Road','Bengaluru',12.9955,77.6959,
   '+918040005555','reach@tandoorgrill.in',
   '{"mon":{"open":"12:00","close":"23:00"},"tue":{"open":"12:00","close":"23:00"},"wed":{"open":"12:00","close":"23:00"},"thu":{"open":"12:00","close":"23:00"},"fri":{"open":"12:00","close":"23:30"},"sat":{"open":"12:00","close":"23:30"},"sun":{"open":"12:00","close":"23:00"}}'::jsonb,
   array['Wifi','Parking','AC'],
   '52345678901234','29ABCDE1234F1Z9',5.0,5.0,
   'https://images.unsplash.com/photo-1567337710282-00832b415979?w=1200',
   array['https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=1200'],
   'verified', false),

  ('a1111111-0000-0000-0000-000000000006',
   '44444444-4444-4444-4444-444444444444',
   'Mocha Cafe','mocha-cafe',
   'European-style continental cafe on MG Road. Great for meetings and brunches.',
   'cafe', array['Continental','Coffee','Bakery'], 2,
   'MG Road, Next to Metro Station','Bengaluru',12.9756,77.6066,
   '+918040006666','hi@mochacafe.in',
   '{"mon":{"open":"08:00","close":"23:00"},"tue":{"open":"08:00","close":"23:00"},"wed":{"open":"08:00","close":"23:00"},"thu":{"open":"08:00","close":"23:00"},"fri":{"open":"08:00","close":"00:00"},"sat":{"open":"08:00","close":"00:00"},"sun":{"open":"08:00","close":"23:00"}}'::jsonb,
   array['Wifi','Outdoor Seating','Pet Friendly'],
   '62345678901234','29ABCDE1234F1Z0',5.0,0.0,
   'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200',
   array['https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200'],
   'verified', false)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  featured = excluded.featured;


-- ========================================================================
-- 007: Seed menu
-- ========================================================================

-- THE GOLDEN SPICE
insert into public.menu_categories (id, restaurant_id, name, icon, sort_order) values
  ('b1000000-0000-0000-0000-000000000001','a1111111-0000-0000-0000-000000000001','Starters','flame.fill',1),
  ('b1000000-0000-0000-0000-000000000002','a1111111-0000-0000-0000-000000000001','Tandoor','flame.fill',2),
  ('b1000000-0000-0000-0000-000000000003','a1111111-0000-0000-0000-000000000001','Mains','fork.knife',3),
  ('b1000000-0000-0000-0000-000000000004','a1111111-0000-0000-0000-000000000001','Breads','fork.knife',4),
  ('b1000000-0000-0000-0000-000000000005','a1111111-0000-0000-0000-000000000001','Desserts','birthday.cake.fill',5),
  ('b1000000-0000-0000-0000-000000000006','a1111111-0000-0000-0000-000000000001','Beverages','cup.and.saucer.fill',6)
on conflict (id) do nothing;

insert into public.menu_items (restaurant_id, category_id, name, description, price, images, is_veg, is_bestseller, spice_level, prep_time_minutes, calories)
values
  ('a1111111-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','Paneer Tikka','Cottage cheese cubes marinated in yogurt and spices, grilled in the tandoor.',320, array['https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800'], true, true, 2, 15, 380),
  ('a1111111-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','Chicken Malai Tikka','Creamy marinated boneless chicken thigh skewers.',420, array['https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=800'], false, true, 1, 18, 520),
  ('a1111111-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000002','Tandoori Prawns','Jumbo prawns in ajwain & mustard marinade.',680, array['https://images.unsplash.com/photo-1625944228741-6e7ee8ecc4c4?w=800'], false, false, 2, 20, 450),
  ('a1111111-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000003','Butter Chicken','Our signature — tandoor-smoked chicken in a silky tomato-butter gravy.',480, array['https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800'], false, true, 2, 22, 620),
  ('a1111111-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000003','Dal Makhani','Slow-cooked black lentils simmered overnight with butter and cream.',320, array['https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800'], true, true, 1, 15, 410),
  ('a1111111-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000003','Rogan Josh','Kashmiri lamb curry with aromatic whole spices.',560, array['https://images.unsplash.com/photo-1574484184081-afea8a62f9a1?w=800'], false, false, 3, 25, 580),
  ('a1111111-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000004','Garlic Naan','Leavened bread brushed with garlic & butter.',80, array['https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800'], true, false, 0, 8, 210),
  ('a1111111-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000004','Peshawari Naan','Stuffed with coconut, raisins and almonds.',140, array['https://images.unsplash.com/photo-1626132647523-66c0a85316f5?w=800'], true, false, 0, 10, 320),
  ('a1111111-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000005','Gulab Jamun','Cardamom-syrup soaked dumplings, served warm.',180, array['https://images.unsplash.com/photo-1600343443104-db6ff6a64f6d?w=800'], true, false, 0, 5, 280),
  ('a1111111-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000006','Mango Lassi','Sweet mango yogurt smoothie.',140, array['https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=800'], true, true, 0, 3, 220),
  ('a1111111-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000006','Masala Chai','Spiced cardamom & ginger tea.',90, array['https://images.unsplash.com/photo-1597318301265-f91055c3c8e1?w=800'], true, false, 0, 4, 120);

-- BELLA ITALIA
insert into public.menu_categories (id, restaurant_id, name, icon, sort_order) values
  ('b2000000-0000-0000-0000-000000000001','a1111111-0000-0000-0000-000000000002','Antipasti','leaf.fill',1),
  ('b2000000-0000-0000-0000-000000000002','a1111111-0000-0000-0000-000000000002','Wood-Fired Pizza','flame.fill',2),
  ('b2000000-0000-0000-0000-000000000003','a1111111-0000-0000-0000-000000000002','Pasta','fork.knife',3),
  ('b2000000-0000-0000-0000-000000000004','a1111111-0000-0000-0000-000000000002','Dolci','birthday.cake.fill',4)
on conflict (id) do nothing;

insert into public.menu_items (restaurant_id, category_id, name, description, price, images, is_veg, is_bestseller, prep_time_minutes, calories) values
  ('a1111111-0000-0000-0000-000000000002','b2000000-0000-0000-0000-000000000001','Bruschetta al Pomodoro','Toasted sourdough, heirloom tomato, basil, olive oil.',340, array['https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=800'], true, false, 10, 280),
  ('a1111111-0000-0000-0000-000000000002','b2000000-0000-0000-0000-000000000001','Burrata con Rucola','Burrata DOP on rocket, heirloom tomato.',520, array['https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=800'], true, true, 8, 450),
  ('a1111111-0000-0000-0000-000000000002','b2000000-0000-0000-0000-000000000002','Margherita','San Marzano, fior di latte, basil, olive oil.',420, array['https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800'], true, true, 14, 680),
  ('a1111111-0000-0000-0000-000000000002','b2000000-0000-0000-0000-000000000002','Diavola','Spicy salami, mozzarella, chilli flakes.',520, array['https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=800'], false, true, 16, 780),
  ('a1111111-0000-0000-0000-000000000002','b2000000-0000-0000-0000-000000000002','Quattro Formaggi','Mozzarella, gorgonzola, parmesan, ricotta.',580, array['https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800'], true, false, 16, 820),
  ('a1111111-0000-0000-0000-000000000002','b2000000-0000-0000-0000-000000000003','Spaghetti Carbonara','Guanciale, pecorino, egg yolk, black pepper.',480, array['https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800'], false, true, 14, 720),
  ('a1111111-0000-0000-0000-000000000002','b2000000-0000-0000-0000-000000000003','Penne Arrabbiata','Tomato, garlic, red chilli, parsley.',380, array['https://images.unsplash.com/photo-1611270629569-8b357cb88da9?w=800'], true, false, 12, 560),
  ('a1111111-0000-0000-0000-000000000002','b2000000-0000-0000-0000-000000000004','Tiramisu','Espresso-soaked ladyfingers, mascarpone.',280, array['https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800'], true, true, 5, 420);

-- SUSHI MASTER
insert into public.menu_categories (id, restaurant_id, name, icon, sort_order) values
  ('b3000000-0000-0000-0000-000000000001','a1111111-0000-0000-0000-000000000003','Nigiri','fish.fill',1),
  ('b3000000-0000-0000-0000-000000000002','a1111111-0000-0000-0000-000000000003','Rolls','circle.grid.cross.fill',2),
  ('b3000000-0000-0000-0000-000000000003','a1111111-0000-0000-0000-000000000003','Robata','flame.fill',3)
on conflict (id) do nothing;

insert into public.menu_items (restaurant_id, category_id, name, description, price, images, is_veg, is_bestseller, prep_time_minutes) values
  ('a1111111-0000-0000-0000-000000000003','b3000000-0000-0000-0000-000000000001','Salmon Nigiri','Two pieces, fresh Norwegian salmon.',380, array['https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800'], false, true, 10),
  ('a1111111-0000-0000-0000-000000000003','b3000000-0000-0000-0000-000000000001','Tuna Nigiri','Two pieces, bluefin tuna akami.',420, array['https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800'], false, false, 10),
  ('a1111111-0000-0000-0000-000000000003','b3000000-0000-0000-0000-000000000002','Spicy Tuna Roll','8 pieces, tuna, sriracha mayo, tobiko.',680, array['https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800'], false, true, 14),
  ('a1111111-0000-0000-0000-000000000003','b3000000-0000-0000-0000-000000000002','Vegetable Rainbow Roll','Avocado, cucumber, asparagus, topped with tempura flakes.',520, array['https://images.unsplash.com/photo-1553621042-f6e147245754?w=800'], true, true, 12),
  ('a1111111-0000-0000-0000-000000000003','b3000000-0000-0000-0000-000000000003','Miso Black Cod','48-hour miso marinated cod, grilled on the robata.',1480, array['https://images.unsplash.com/photo-1534256958597-7fe685cbd745?w=800'], false, true, 20);

-- GREEN BOWL CAFE
insert into public.menu_categories (id, restaurant_id, name, icon, sort_order) values
  ('b4000000-0000-0000-0000-000000000001','a1111111-0000-0000-0000-000000000004','Smoothie Bowls','leaf.fill',1),
  ('b4000000-0000-0000-0000-000000000002','a1111111-0000-0000-0000-000000000004','Salads','leaf.fill',2),
  ('b4000000-0000-0000-0000-000000000003','a1111111-0000-0000-0000-000000000004','Mains','fork.knife',3),
  ('b4000000-0000-0000-0000-000000000004','a1111111-0000-0000-0000-000000000004','Cold Press','cup.and.saucer.fill',4)
on conflict (id) do nothing;

insert into public.menu_items (restaurant_id, category_id, name, description, price, images, is_veg, is_bestseller, prep_time_minutes) values
  ('a1111111-0000-0000-0000-000000000004','b4000000-0000-0000-0000-000000000001','Acai Berry Bowl','Acai, banana, granola, blueberries, coconut.',380, array['https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=800'], true, true, 8),
  ('a1111111-0000-0000-0000-000000000004','b4000000-0000-0000-0000-000000000002','Buddha Bowl','Quinoa, roasted sweet potato, chickpeas, tahini.',340, array['https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=800'], true, true, 10),
  ('a1111111-0000-0000-0000-000000000004','b4000000-0000-0000-0000-000000000002','Caesar Kale','Kale, cashew parmesan, sourdough croutons.',320, array['https://images.unsplash.com/photo-1551248429-40975aa4de74?w=800'], true, false, 8),
  ('a1111111-0000-0000-0000-000000000004','b4000000-0000-0000-0000-000000000003','Avocado Sourdough','House sourdough, smashed avo, chilli flakes, poached egg.',360, array['https://images.unsplash.com/photo-1603046891744-76e6300f82ef?w=800'], true, true, 10),
  ('a1111111-0000-0000-0000-000000000004','b4000000-0000-0000-0000-000000000004','Green Glow','Kale, cucumber, apple, ginger, lemon.',260, array['https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=800'], true, false, 5);

-- TANDOOR & GRILL
insert into public.menu_categories (id, restaurant_id, name, icon, sort_order) values
  ('b5000000-0000-0000-0000-000000000001','a1111111-0000-0000-0000-000000000005','Kebabs','flame.fill',1),
  ('b5000000-0000-0000-0000-000000000002','a1111111-0000-0000-0000-000000000005','Biryani','fork.knife',2),
  ('b5000000-0000-0000-0000-000000000003','a1111111-0000-0000-0000-000000000005','Curries','fork.knife',3)
on conflict (id) do nothing;

insert into public.menu_items (restaurant_id, category_id, name, description, price, images, is_veg, is_bestseller, spice_level, prep_time_minutes) values
  ('a1111111-0000-0000-0000-000000000005','b5000000-0000-0000-0000-000000000001','Galouti Kebab','Lucknowi lamb kebabs melting with saffron.',460, array['https://images.unsplash.com/photo-1574484184081-afea8a62f9a1?w=800'], false, true, 2, 18),
  ('a1111111-0000-0000-0000-000000000005','b5000000-0000-0000-0000-000000000001','Hariyali Paneer Tikka','Paneer in mint-coriander marinade.',340, array['https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800'], true, false, 2, 15),
  ('a1111111-0000-0000-0000-000000000005','b5000000-0000-0000-0000-000000000002','Hyderabadi Dum Biryani','Long-grain basmati, dum cooked with mutton.',520, array['https://images.unsplash.com/photo-1563379091339-03246963d96c?w=800'], false, true, 3, 30),
  ('a1111111-0000-0000-0000-000000000005','b5000000-0000-0000-0000-000000000002','Vegetable Biryani','Saffron rice with seasonal vegetables, raita.',360, array['https://images.unsplash.com/photo-1631292784640-2b24be6ce4f1?w=800'], true, false, 2, 25),
  ('a1111111-0000-0000-0000-000000000005','b5000000-0000-0000-0000-000000000003','Nihari','Slow-cooked lamb shank in aromatic gravy.',620, array['https://images.unsplash.com/photo-1574484184081-afea8a62f9a1?w=800'], false, true, 3, 25);

-- MOCHA CAFE
insert into public.menu_categories (id, restaurant_id, name, icon, sort_order) values
  ('b6000000-0000-0000-0000-000000000001','a1111111-0000-0000-0000-000000000006','Breakfast','sunrise.fill',1),
  ('b6000000-0000-0000-0000-000000000002','a1111111-0000-0000-0000-000000000006','Sandwiches','fork.knife',2),
  ('b6000000-0000-0000-0000-000000000003','a1111111-0000-0000-0000-000000000006','Coffee','cup.and.saucer.fill',3),
  ('b6000000-0000-0000-0000-000000000004','a1111111-0000-0000-0000-000000000006','Bakery','birthday.cake.fill',4)
on conflict (id) do nothing;

insert into public.menu_items (restaurant_id, category_id, name, description, price, images, is_veg, is_bestseller, prep_time_minutes) values
  ('a1111111-0000-0000-0000-000000000006','b6000000-0000-0000-0000-000000000001','Eggs Benedict','Poached eggs, ham, hollandaise on toasted muffin.',380, array['https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800'], false, true, 12),
  ('a1111111-0000-0000-0000-000000000006','b6000000-0000-0000-0000-000000000001','French Toast','Brioche, maple syrup, berries.',320, array['https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800'], true, false, 10),
  ('a1111111-0000-0000-0000-000000000006','b6000000-0000-0000-0000-000000000002','Chicken Club','Grilled chicken, bacon, lettuce, tomato, fries.',420, array['https://images.unsplash.com/photo-1540713434306-58505cf1b6fc?w=800'], false, true, 12),
  ('a1111111-0000-0000-0000-000000000006','b6000000-0000-0000-0000-000000000003','Flat White','Double shot, steamed milk.',180, array['https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800'], true, true, 4),
  ('a1111111-0000-0000-0000-000000000006','b6000000-0000-0000-0000-000000000004','Chocolate Croissant','Butter croissant with dark chocolate.',160, array['https://images.unsplash.com/photo-1623334044303-241021148842?w=800'], true, false, 3);


-- ========================================================================
-- 008: Seed ops (tables, staff, offers, bookings, reviews, etc.)
-- ========================================================================

-- TABLES
insert into public.tables (id, restaurant_id, number, seats, zone, status, position_x, position_y, qr_data)
select gen_random_uuid(), r_id, n, seats, zone, 'available'::table_status, px, py,
       json_build_object('r', r_id, 't', n)::text
from (values
  ('a1111111-0000-0000-0000-000000000001'::uuid, 1,  2, 'indoor'::table_zone, 10.0, 10.0),
  ('a1111111-0000-0000-0000-000000000001'::uuid, 2,  2, 'indoor',             10.0, 35.0),
  ('a1111111-0000-0000-0000-000000000001'::uuid, 3,  4, 'indoor',             35.0, 10.0),
  ('a1111111-0000-0000-0000-000000000001'::uuid, 4,  4, 'indoor',             35.0, 35.0),
  ('a1111111-0000-0000-0000-000000000001'::uuid, 5,  6, 'indoor',             60.0, 10.0),
  ('a1111111-0000-0000-0000-000000000001'::uuid, 6,  6, 'indoor',             60.0, 35.0),
  ('a1111111-0000-0000-0000-000000000001'::uuid, 7,  4, 'outdoor',            10.0, 65.0),
  ('a1111111-0000-0000-0000-000000000001'::uuid, 8,  4, 'outdoor',            35.0, 65.0),
  ('a1111111-0000-0000-0000-000000000001'::uuid, 9,  2, 'bar',                85.0, 10.0),
  ('a1111111-0000-0000-0000-000000000001'::uuid, 10, 2, 'bar',                85.0, 35.0),
  ('a1111111-0000-0000-0000-000000000001'::uuid, 11, 8, 'private',            85.0, 65.0),
  ('a1111111-0000-0000-0000-000000000001'::uuid, 12, 8, 'private',            60.0, 65.0),
  ('a1111111-0000-0000-0000-000000000002'::uuid, 1, 2, 'indoor', 10,10),
  ('a1111111-0000-0000-0000-000000000002'::uuid, 2, 2, 'indoor', 10,35),
  ('a1111111-0000-0000-0000-000000000002'::uuid, 3, 4, 'indoor', 35,10),
  ('a1111111-0000-0000-0000-000000000002'::uuid, 4, 4, 'indoor', 35,35),
  ('a1111111-0000-0000-0000-000000000002'::uuid, 5, 6, 'indoor', 60,10),
  ('a1111111-0000-0000-0000-000000000002'::uuid, 6, 4, 'outdoor', 60,35),
  ('a1111111-0000-0000-0000-000000000002'::uuid, 7, 2, 'outdoor', 85,10),
  ('a1111111-0000-0000-0000-000000000002'::uuid, 8, 2, 'bar', 85,35),
  ('a1111111-0000-0000-0000-000000000003'::uuid, 1, 2, 'indoor', 10,10),
  ('a1111111-0000-0000-0000-000000000003'::uuid, 2, 2, 'indoor', 10,35),
  ('a1111111-0000-0000-0000-000000000003'::uuid, 3, 4, 'indoor', 35,10),
  ('a1111111-0000-0000-0000-000000000003'::uuid, 4, 4, 'indoor', 35,35),
  ('a1111111-0000-0000-0000-000000000003'::uuid, 5, 6, 'private', 60,20),
  ('a1111111-0000-0000-0000-000000000003'::uuid, 6, 2, 'bar', 85,20),
  ('a1111111-0000-0000-0000-000000000004'::uuid, 1, 2, 'indoor', 10,10),
  ('a1111111-0000-0000-0000-000000000004'::uuid, 2, 4, 'indoor', 35,10),
  ('a1111111-0000-0000-0000-000000000004'::uuid, 3, 4, 'indoor', 60,10),
  ('a1111111-0000-0000-0000-000000000004'::uuid, 4, 4, 'outdoor', 10,40),
  ('a1111111-0000-0000-0000-000000000004'::uuid, 5, 2, 'outdoor', 35,40),
  ('a1111111-0000-0000-0000-000000000005'::uuid, 1, 4, 'indoor', 10,10),
  ('a1111111-0000-0000-0000-000000000005'::uuid, 2, 4, 'indoor', 35,10),
  ('a1111111-0000-0000-0000-000000000005'::uuid, 3, 6, 'indoor', 60,10),
  ('a1111111-0000-0000-0000-000000000005'::uuid, 4, 8, 'private', 85,10),
  ('a1111111-0000-0000-0000-000000000006'::uuid, 1, 2, 'indoor', 10,10),
  ('a1111111-0000-0000-0000-000000000006'::uuid, 2, 2, 'indoor', 35,10),
  ('a1111111-0000-0000-0000-000000000006'::uuid, 3, 4, 'indoor', 60,10),
  ('a1111111-0000-0000-0000-000000000006'::uuid, 4, 4, 'outdoor', 10,40),
  ('a1111111-0000-0000-0000-000000000006'::uuid, 5, 2, 'outdoor', 35,40)
) as t(r_id, n, seats, zone, px, py)
on conflict (restaurant_id, number) do nothing;

-- STAFF
insert into public.staff (restaurant_id, user_id, name, phone, role, pin, permissions, is_active)
values
  ('a1111111-0000-0000-0000-000000000001','44444444-4444-4444-4444-444444444444','Arjun Mehta','+919900000004','owner','1234',
    jsonb_build_object(
      'view_all_data',true,'edit_restaurant_profile',true,'manage_staff',true,'edit_menu',true,
      'toggle_menu_availability',true,'view_revenue',true,'view_inventory',true,'log_expenses',true,
      'manage_offers',true,'access_floor_manager',true,'assign_tables',true,'manage_reservations',true,
      'take_orders',true,'view_kitchen_display',true,'mark_orders_prepared',true,'generate_bill',true,
      'apply_discount_low',true,'apply_discount_high',true,'void_order',true,'close_bill',true,'reply_to_reviews',true
    ), true),
  ('a1111111-0000-0000-0000-000000000001', null, 'Ravi Kumar','+919900001001','manager','2001',
    jsonb_build_object('view_all_data',true,'manage_staff',true,'edit_menu',true,'toggle_menu_availability',true,
      'view_revenue',true,'view_inventory',true,'log_expenses',true,'manage_offers',true,'access_floor_manager',true,
      'assign_tables',true,'manage_reservations',true,'take_orders',true,'view_kitchen_display',true,
      'mark_orders_prepared',true,'generate_bill',true,'apply_discount_low',true,'apply_discount_high',true,
      'void_order',true,'close_bill',true,'reply_to_reviews',true), true),
  ('a1111111-0000-0000-0000-000000000001', null, 'Suresh Iyer','+919900001002','chef','3001',
    jsonb_build_object('view_kitchen_display',true,'mark_orders_prepared',true,'toggle_menu_availability',true,'view_inventory',true), true),
  ('a1111111-0000-0000-0000-000000000001', null, 'Neha Das','+919900001003','server','4001',
    jsonb_build_object('take_orders',true,'generate_bill',true,'apply_discount_low',true,'close_bill',true), true),
  ('a1111111-0000-0000-0000-000000000001', null, 'Karan Shah','+919900001004','server','4002',
    jsonb_build_object('take_orders',true,'generate_bill',true,'apply_discount_low',true,'close_bill',true), true),
  ('a1111111-0000-0000-0000-000000000001', null, 'Meera Joshi','+919900001005','host','5001',
    jsonb_build_object('assign_tables',true,'manage_reservations',true,'take_orders',true), true),
  ('a1111111-0000-0000-0000-000000000002','44444444-4444-4444-4444-444444444444','Arjun Mehta','+919900000004','owner','1234',
    jsonb_build_object('view_all_data',true,'edit_restaurant_profile',true,'manage_staff',true,'edit_menu',true,
      'toggle_menu_availability',true,'view_revenue',true,'view_inventory',true,'log_expenses',true,
      'manage_offers',true,'access_floor_manager',true,'assign_tables',true,'manage_reservations',true,
      'take_orders',true,'view_kitchen_display',true,'mark_orders_prepared',true,'generate_bill',true,
      'apply_discount_low',true,'apply_discount_high',true,'void_order',true,'close_bill',true,'reply_to_reviews',true), true),
  ('a1111111-0000-0000-0000-000000000002', null, 'Giuseppe Rao','+919900002001','chef','3002',
    jsonb_build_object('view_kitchen_display',true,'mark_orders_prepared',true,'toggle_menu_availability',true,'view_inventory',true), true),
  ('a1111111-0000-0000-0000-000000000002', null, 'Anita Rao','+919900002002','server','4003',
    jsonb_build_object('take_orders',true,'generate_bill',true,'apply_discount_low',true,'close_bill',true), true)
on conflict (restaurant_id, pin) do nothing;

-- OFFERS
insert into public.offers (restaurant_id, title, description, discount_type, discount_value, min_order_amount, max_discount_cap, promo_code, valid_from, valid_to, target_audience)
values
  ('a1111111-0000-0000-0000-000000000001','20% off on first order','New diners get 20% off, up to ₹200.',
    'percentage', 20, 500, 200, 'GOLDEN20', now(), now() + interval '60 days', 'new_users'),
  ('a1111111-0000-0000-0000-000000000001','Happy Hours 4-7pm','Flat ₹150 off starters.',
    'flat', 150, 700, null, 'HAPPY150', now(), now() + interval '30 days', 'all'),
  ('a1111111-0000-0000-0000-000000000002','Pizza Party','Buy 1 Pizza Get 1.',
    'bogo', 0, 420, null, 'BOGOPIZZA', now(), now() + interval '30 days', 'all'),
  ('a1111111-0000-0000-0000-000000000003','Gold Week','Platinum & Diamond members get 15% off.',
    'percentage', 15, 1000, 500, 'SUSHIGOLD', now(), now() + interval '14 days', 'tier_gold'),
  ('a1111111-0000-0000-0000-000000000004','Weekday Brunch','Flat ₹100 off breakfast bowls.',
    'flat', 100, 300, null, 'BRUNCH100', now(), now() + interval '30 days', 'all'),
  (null,'Welcome to DIME','First order anywhere: flat ₹100 off.',
    'flat', 100, 300, null, 'WELCOME100', now(), now() + interval '90 days', 'new_users')
on conflict (promo_code) do nothing;

-- BANNERS
insert into public.banners (image_url, link_target, position, is_active, start_date, end_date) values
  ('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600','/restaurant/a1111111-0000-0000-0000-000000000001',0,true, now(), now() + interval '60 days'),
  ('https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1600','/restaurant/a1111111-0000-0000-0000-000000000002',1,true, now(), now() + interval '60 days'),
  ('https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1600','/offers',2,true, now(), now() + interval '60 days');

-- COLLECTIONS
insert into public.collections (name, description, cover_image_url, restaurant_ids, sort_order, is_active) values
  ('Best Biryani in Town','Hand-picked biryani specialists.',
   'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=1200',
   array['a1111111-0000-0000-0000-000000000001','a1111111-0000-0000-0000-000000000005']::uuid[], 1, true),
  ('Rooftop & Fine Dining','Perfect for date nights.',
   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
   array['a1111111-0000-0000-0000-000000000001','a1111111-0000-0000-0000-000000000002','a1111111-0000-0000-0000-000000000003']::uuid[], 2, true),
  ('Budget Eats Under ₹500','Delicious meals that won''t break the bank.',
   'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200',
   array['a1111111-0000-0000-0000-000000000004','a1111111-0000-0000-0000-000000000006']::uuid[], 3, true);

-- SAMPLE REVIEWS
insert into public.reviews (user_id, restaurant_id, overall_rating, food_rating, service_rating, ambience_rating, value_rating, text, recommend)
values
  ('22222222-2222-2222-2222-222222222222','a1111111-0000-0000-0000-000000000001',5,5,5,5,4,'Butter chicken here is unreal. Tender and silky — everything you want.',true),
  ('33333333-3333-3333-3333-333333333333','a1111111-0000-0000-0000-000000000001',4,5,4,4,4,'Loved the galouti-style lamb. Service was quick too.',true),
  ('22222222-2222-2222-2222-222222222222','a1111111-0000-0000-0000-000000000002',5,5,4,5,4,'Best margherita in Bengaluru, crust is textbook Napoletana.',true),
  ('33333333-3333-3333-3333-333333333333','a1111111-0000-0000-0000-000000000003',5,5,5,5,3,'Omakase was phenomenal. Worth every rupee.',true),
  ('22222222-2222-2222-2222-222222222222','a1111111-0000-0000-0000-000000000004',4,4,5,5,5,'Caesar kale became my new Sunday ritual.',true),
  ('33333333-3333-3333-3333-333333333333','a1111111-0000-0000-0000-000000000005',4,5,3,4,4,'Hyderabadi biryani was on point.',true);

update public.reviews
   set reply_text = 'Thank you Priya! See you again soon. — Chef Suresh',
       reply_at = now()
 where restaurant_id = 'a1111111-0000-0000-0000-000000000001'
   and user_id = '22222222-2222-2222-2222-222222222222';

-- SAMPLE BOOKINGS
insert into public.bookings (user_id, restaurant_id, date, time, guests, seating_preference, status, source)
values
  ('22222222-2222-2222-2222-222222222222','a1111111-0000-0000-0000-000000000001', current_date + 1,'20:00', 2, 'indoor','confirmed','app'),
  ('22222222-2222-2222-2222-222222222222','a1111111-0000-0000-0000-000000000002', current_date + 3,'19:30', 4, 'outdoor','pending','app'),
  ('33333333-3333-3333-3333-333333333333','a1111111-0000-0000-0000-000000000003', current_date + 2,'21:00', 2, 'indoor','confirmed','app'),
  ('33333333-3333-3333-3333-333333333333','a1111111-0000-0000-0000-000000000001', current_date - 2,'20:00', 3, 'indoor','completed','app');

-- SAMPLE INVENTORY
insert into public.inventory (restaurant_id, name, quantity, unit, price_per_unit, min_threshold, supplier_name) values
  ('a1111111-0000-0000-0000-000000000001','Chicken', 24, 'kg', 320, 10, 'Venky''s'),
  ('a1111111-0000-0000-0000-000000000001','Paneer',   8, 'kg', 380,  4, 'Milky Mist'),
  ('a1111111-0000-0000-0000-000000000001','Basmati Rice', 30, 'kg', 180, 10, 'Daawat'),
  ('a1111111-0000-0000-0000-000000000001','Tomato',    14, 'kg',  40,  6, 'HOPCOMS'),
  ('a1111111-0000-0000-0000-000000000001','Butter',    3, 'kg', 560,  5, 'Amul'),
  ('a1111111-0000-0000-0000-000000000001','Cream',     2, 'liter', 220, 3, 'Amul');

-- SAMPLE EXPENSES
insert into public.expenses (restaurant_id, amount, category, date, description, is_recurring, recurring_frequency)
values
  ('a1111111-0000-0000-0000-000000000001', 150000, 'rent', date_trunc('month', current_date)::date,'Monthly rent',true,'monthly'),
  ('a1111111-0000-0000-0000-000000000001',  85000, 'salaries', date_trunc('month', current_date)::date,'Staff salaries',true,'monthly'),
  ('a1111111-0000-0000-0000-000000000001',  24000, 'utilities', date_trunc('month', current_date)::date,'Electricity & water',true,'monthly'),
  ('a1111111-0000-0000-0000-000000000001',  48000, 'ingredients', current_date - 3,'Weekly produce run',false,null);


-- ========================================================================
-- 009: Storage buckets
-- ========================================================================

insert into storage.buckets (id, name, public)
values
  ('restaurant-media', 'restaurant-media', true),
  ('menu-media', 'menu-media', true),
  ('review-media', 'review-media', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Public read" on storage.objects;
create policy "Public read"
  on storage.objects for select
  using (bucket_id in ('restaurant-media','menu-media','review-media','avatars'));

drop policy if exists "Authenticated users can upload" on storage.objects;
create policy "Authenticated users can upload"
  on storage.objects for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Owners and uploader can update" on storage.objects;
create policy "Owners and uploader can update"
  on storage.objects for update
  using (auth.role() = 'authenticated');

drop policy if exists "Owners and uploader can delete" on storage.objects;
create policy "Owners and uploader can delete"
  on storage.objects for delete
  using (auth.role() = 'authenticated');


-- ========================================================================
-- 011: Restaurant logo column
-- ========================================================================

alter table public.restaurants
  add column if not exists logo_url text;


-- ========================================================================
-- 012: Admin creator backend
-- ========================================================================

do $$ begin
  create type admin_role as enum (
    'super', 'support', 'marketing', 'sales', 'ops', 'finance', 'engineering', 'intern'
  );
exception when duplicate_object then null; end $$;

alter table public.users
  add column if not exists admin_role admin_role,
  add column if not exists admin_permissions jsonb not null default '{}'::jsonb;

create index if not exists idx_users_admin_role on public.users(admin_role);

create table if not exists public.feature_flags (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  description text,
  enabled bool not null default false,
  rollout_percent int not null default 100 check (rollout_percent between 0 and 100),
  restaurant_ids uuid[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists tg_ff_updated on public.feature_flags;
create trigger tg_ff_updated before update on public.feature_flags
  for each row execute function public.tg_set_updated_at();

insert into public.feature_flags (key, description, enabled, rollout_percent) values
  ('group_ordering', 'Multiple phones can join one table order', false, 0),
  ('waitlist_priority', 'Allow VIP priority on waitlists', true, 100),
  ('ai_menu_generator', 'AI menu designer (coming soon)', false, 0),
  ('split_bill_by_items', 'Itemised split bill UI', true, 100),
  ('referrals_2x', 'Double referral points week', false, 0)
on conflict (key) do nothing;

alter table public.feature_flags enable row level security;
drop policy if exists "ff_public_read" on public.feature_flags;
create policy "ff_public_read" on public.feature_flags for select using (true);
drop policy if exists "ff_admin_write" on public.feature_flags;
create policy "ff_admin_write" on public.feature_flags for all
  using (public.is_super_admin()) with check (public.is_super_admin());

do $$ begin
  create type campaign_status as enum ('draft','scheduled','sent','cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text not null,
  segment jsonb not null default '{"all":true}'::jsonb,
  cta_url text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  recipients_count int not null default 0,
  status campaign_status not null default 'draft',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_campaigns_status on public.campaigns(status);
drop trigger if exists tg_campaigns_updated on public.campaigns;
create trigger tg_campaigns_updated before update on public.campaigns
  for each row execute function public.tg_set_updated_at();

alter table public.campaigns enable row level security;
drop policy if exists "campaigns_admin" on public.campaigns;
create policy "campaigns_admin" on public.campaigns for all
  using (public.is_super_admin()) with check (public.is_super_admin());

create or replace function public.campaign_recipients(seg jsonb)
returns setof uuid language plpgsql security definer set search_path = public as $$
declare
  rec record;
begin
  for rec in
    select u.id, u.role, u.loyalty_tier, u.created_at, u.is_active
    from public.users u
    where u.is_active and u.role = 'customer'
  loop
    if (seg ? 'all' and (seg->>'all')::bool) then
      return next rec.id;
      continue;
    end if;
    if seg ? 'tiers' and rec.loyalty_tier::text = any (
      select jsonb_array_elements_text(seg->'tiers')
    ) then
      return next rec.id;
      continue;
    end if;
    if (seg ? 'new_users' and (seg->>'new_users')::bool) and rec.created_at > now() - interval '7 days' then
      return next rec.id;
      continue;
    end if;
    if seg ? 'inactive_days' then
      if not exists (
        select 1 from public.orders o
         where o.user_id = rec.id
           and o.created_at > now() - ((seg->>'inactive_days')::int || ' days')::interval
      ) then
        return next rec.id;
        continue;
      end if;
    end if;
  end loop;
  return;
end $$;

create or replace function public.send_campaign(p_campaign_id uuid)
returns int language plpgsql security definer set search_path = public as $$
declare
  c record;
  uid uuid;
  count_sent int := 0;
begin
  select * into c from public.campaigns where id = p_campaign_id;
  if c is null then return 0; end if;
  if c.status = 'sent' then return 0; end if;

  for uid in select * from public.campaign_recipients(c.segment) loop
    insert into public.notifications(user_id, type, title, message, data)
    values (uid, 'offer', c.title, c.body,
      jsonb_build_object('campaign_id', c.id, 'cta', c.cta_url));
    count_sent := count_sent + 1;
  end loop;

  update public.campaigns
     set status = 'sent', sent_at = now(), recipients_count = count_sent
   where id = p_campaign_id;
  return count_sent;
end $$;

create or replace view public.flagged_users as
  select
    u.id,
    u.name,
    u.email,
    u.is_active,
    u.created_at,
    coalesce(b.total_bookings, 0) as bookings,
    coalesce(b.no_shows, 0) as no_shows,
    coalesce(b.cancellations, 0) as cancellations,
    coalesce(t.tickets_open, 0) as tickets_open,
    coalesce(o.orders_count, 0) as orders_count,
    coalesce(o.refunds, 0) as refunds,
    least(100,
      coalesce(b.no_shows, 0) * 15 +
      coalesce(b.cancellations, 0) * 5 +
      coalesce(t.tickets_open, 0) * 8
    ) as risk_score
  from public.users u
  left join (
    select user_id,
      count(*) as total_bookings,
      count(*) filter (where status = 'no_show') as no_shows,
      count(*) filter (where status = 'cancelled') as cancellations
    from public.bookings group by user_id
  ) b on b.user_id = u.id
  left join (
    select user_id, count(*) filter (where status not in ('resolved','closed')) as tickets_open
    from public.support_tickets group by user_id
  ) t on t.user_id = u.id
  left join (
    select user_id,
      count(*) as orders_count,
      count(*) filter (where status = 'cancelled') as refunds
    from public.orders group by user_id
  ) o on o.user_id = u.id
  where u.role = 'customer';

update public.users set admin_role = 'super',
  admin_permissions = jsonb_build_object(
    'manage_team', true,
    'manage_billing', true,
    'manage_flags', true,
    'manage_campaigns', true,
    'view_revenue', true,
    'view_audit', true,
    'view_risk', true,
    'view_cohorts', true,
    'manage_content', true,
    'manage_restaurants', true,
    'manage_users', true
  )
where role = 'super_admin' and admin_role is null;


-- ========================================================================
-- 013: Ads system
-- ========================================================================

do $$ begin
  create type ad_status as enum ('draft','pending_review','approved','active','paused','completed','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ad_placement as enum ('home_banner','home_featured','discover_inline','restaurant_top');
exception when duplicate_object then null; end $$;

create table if not exists public.ads (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  created_by uuid references public.users(id) on delete set null,
  template_id text not null,
  title text not null,
  subtitle text,
  body text,
  cta_text text default 'Learn more',
  cta_link text,
  image_url text,
  design_json jsonb not null default '{}'::jsonb,
  placement ad_placement not null default 'home_banner',
  daily_budget numeric(10,2) not null check (daily_budget >= 100),
  duration_days int not null default 7 check (duration_days between 1 and 90),
  total_cost numeric(12,2) generated always as (daily_budget * duration_days) stored,
  start_date date,
  end_date date,
  status ad_status not null default 'draft',
  admin_notes text,
  impressions int not null default 0,
  clicks int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ads_status on public.ads(status);
create index if not exists idx_ads_placement on public.ads(placement, status, start_date, end_date);
create index if not exists idx_ads_restaurant on public.ads(restaurant_id);

drop trigger if exists tg_ads_updated on public.ads;
create trigger tg_ads_updated before update on public.ads
  for each row execute function public.tg_set_updated_at();

create or replace function public.tg_ads_dates()
returns trigger language plpgsql as $$
begin
  if new.status = 'active' and (old.status is distinct from 'active') then
    if new.start_date is null then new.start_date := current_date; end if;
    if new.end_date is null then
      new.end_date := new.start_date + (new.duration_days || ' days')::interval;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists tg_ads_set_dates on public.ads;
create trigger tg_ads_set_dates before insert or update of status on public.ads
  for each row execute function public.tg_ads_dates();

create or replace function public.bump_ad_impression(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.ads set impressions = impressions + 1 where id = p_id;
$$;

create or replace function public.bump_ad_click(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.ads set clicks = clicks + 1 where id = p_id;
$$;

create or replace view public.live_ads as
  select * from public.ads
  where status = 'active'
    and (start_date is null or start_date <= current_date)
    and (end_date is null or end_date >= current_date);

alter table public.ads enable row level security;

drop policy if exists "ads_public_read_live" on public.ads;
create policy "ads_public_read_live"
  on public.ads for select
  using (
    status = 'active'
    or public.is_super_admin()
    or (restaurant_id is not null and public.is_restaurant_staff(restaurant_id))
    or (created_by is not null and created_by = auth.uid())
  );

drop policy if exists "ads_owner_write" on public.ads;
create policy "ads_owner_write"
  on public.ads for all
  using (
    public.is_super_admin()
    or (restaurant_id is not null and public.is_restaurant_staff(restaurant_id))
    or (created_by is not null and created_by = auth.uid())
  )
  with check (
    public.is_super_admin()
    or (restaurant_id is not null and public.is_restaurant_staff(restaurant_id))
    or (created_by is not null and created_by = auth.uid())
  );

do $$ begin alter publication supabase_realtime add table public.ads; exception when duplicate_object then null; end $$;
