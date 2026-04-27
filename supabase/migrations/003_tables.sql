-- DIME core tables. Ordered so foreign keys resolve cleanly.

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
