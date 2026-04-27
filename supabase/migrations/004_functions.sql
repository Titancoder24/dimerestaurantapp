-- Domain functions & triggers

-- 1. New Supabase auth.user -> public.users row with default role & referral code.
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

-- 2. Recompute a restaurant's rating after reviews change.
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

-- 3. Loyalty tier calculator.
create or replace function public.calculate_loyalty_tier(points int)
returns loyalty_tier language sql immutable as $$
  select case
    when points >= 5000 then 'diamond'::loyalty_tier
    when points >= 2000 then 'platinum'::loyalty_tier
    when points >= 500 then 'gold'::loyalty_tier
    else 'silver'::loyalty_tier
  end
$$;

-- 4. Keep users.loyalty_points and tier in sync with the ledger.
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

-- 5. When an order becomes paid: release table, award loyalty, fire notification.
create or replace function public.tg_order_status_effects()
returns trigger language plpgsql as $$
declare
  earn int;
begin
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
      values (new.user_id, 'order_update', 'Order complete',
              'Your order ' || new.order_number || ' is complete. Enjoy!',
              jsonb_build_object('order_id', new.id));
    end if;
  end if;

  if new.status = 'ready' and old.status <> 'ready' and new.user_id is not null then
    insert into public.notifications(user_id, type, title, message, data)
    values (new.user_id, 'order_update', 'Your order is ready',
            'Order ' || new.order_number || ' is ready to be served.',
            jsonb_build_object('order_id', new.id));
  end if;

  return new;
end $$;

drop trigger if exists tg_orders_status on public.orders;
create trigger tg_orders_status
  before update on public.orders
  for each row execute function public.tg_order_status_effects();

-- 6. Booking confirmation notification.
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

-- 7. Inventory status view.
create or replace view public.inventory_with_status as
  select i.*,
         case
           when i.quantity <= 0 then 'out_of_stock'::inventory_status
           when i.quantity <= i.min_threshold then 'low_stock'::inventory_status
           else 'in_stock'::inventory_status
         end as status
  from public.inventory i;

-- 8. Generate table QR data (JSON) at insert.
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

-- 9. Auto-recompute order totals from line items when items change.
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
