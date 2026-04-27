-- Row Level Security policies. Enforces the permission model end-to-end.

-- Helper: is current user a staff (with user_id) of the given restaurant?
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

-- REALTIME ------------------------------------------------------------
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.tables;
alter publication supabase_realtime add table public.waitlist;
alter publication supabase_realtime add table public.notifications;
