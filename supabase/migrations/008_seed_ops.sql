-- Seed: tables, staff, offers, sample bookings + orders, reviews, banners,
-- collections. All scoped to the six seeded restaurants.

-- TABLES (mixed zones per restaurant) --------------------------------
insert into public.tables (id, restaurant_id, number, seats, zone, status, position_x, position_y, qr_data)
select gen_random_uuid(), r_id, n, seats, zone, 'available'::table_status, px, py,
       json_build_object('r', r_id, 't', n)::text
from (values
  -- The Golden Spice: 12 tables
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
  -- Bella Italia
  ('a1111111-0000-0000-0000-000000000002'::uuid, 1, 2, 'indoor', 10,10),
  ('a1111111-0000-0000-0000-000000000002'::uuid, 2, 2, 'indoor', 10,35),
  ('a1111111-0000-0000-0000-000000000002'::uuid, 3, 4, 'indoor', 35,10),
  ('a1111111-0000-0000-0000-000000000002'::uuid, 4, 4, 'indoor', 35,35),
  ('a1111111-0000-0000-0000-000000000002'::uuid, 5, 6, 'indoor', 60,10),
  ('a1111111-0000-0000-0000-000000000002'::uuid, 6, 4, 'outdoor', 60,35),
  ('a1111111-0000-0000-0000-000000000002'::uuid, 7, 2, 'outdoor', 85,10),
  ('a1111111-0000-0000-0000-000000000002'::uuid, 8, 2, 'bar', 85,35),
  -- Sushi Master
  ('a1111111-0000-0000-0000-000000000003'::uuid, 1, 2, 'indoor', 10,10),
  ('a1111111-0000-0000-0000-000000000003'::uuid, 2, 2, 'indoor', 10,35),
  ('a1111111-0000-0000-0000-000000000003'::uuid, 3, 4, 'indoor', 35,10),
  ('a1111111-0000-0000-0000-000000000003'::uuid, 4, 4, 'indoor', 35,35),
  ('a1111111-0000-0000-0000-000000000003'::uuid, 5, 6, 'private', 60,20),
  ('a1111111-0000-0000-0000-000000000003'::uuid, 6, 2, 'bar', 85,20),
  -- Green Bowl
  ('a1111111-0000-0000-0000-000000000004'::uuid, 1, 2, 'indoor', 10,10),
  ('a1111111-0000-0000-0000-000000000004'::uuid, 2, 4, 'indoor', 35,10),
  ('a1111111-0000-0000-0000-000000000004'::uuid, 3, 4, 'indoor', 60,10),
  ('a1111111-0000-0000-0000-000000000004'::uuid, 4, 4, 'outdoor', 10,40),
  ('a1111111-0000-0000-0000-000000000004'::uuid, 5, 2, 'outdoor', 35,40),
  -- Tandoor & Grill
  ('a1111111-0000-0000-0000-000000000005'::uuid, 1, 4, 'indoor', 10,10),
  ('a1111111-0000-0000-0000-000000000005'::uuid, 2, 4, 'indoor', 35,10),
  ('a1111111-0000-0000-0000-000000000005'::uuid, 3, 6, 'indoor', 60,10),
  ('a1111111-0000-0000-0000-000000000005'::uuid, 4, 8, 'private', 85,10),
  -- Mocha Cafe
  ('a1111111-0000-0000-0000-000000000006'::uuid, 1, 2, 'indoor', 10,10),
  ('a1111111-0000-0000-0000-000000000006'::uuid, 2, 2, 'indoor', 35,10),
  ('a1111111-0000-0000-0000-000000000006'::uuid, 3, 4, 'indoor', 60,10),
  ('a1111111-0000-0000-0000-000000000006'::uuid, 4, 4, 'outdoor', 10,40),
  ('a1111111-0000-0000-0000-000000000006'::uuid, 5, 2, 'outdoor', 35,40)
) as t(r_id, n, seats, zone, px, py)
on conflict (restaurant_id, number) do nothing;

-- STAFF (owner seeded as staff for POS/floor access) ------------------
-- Full permissions object for owner
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

  -- Bella Italia
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

-- OFFERS -------------------------------------------------------------
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

-- BANNERS ------------------------------------------------------------
insert into public.banners (image_url, link_target, position, is_active, start_date, end_date) values
  ('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600','/restaurant/a1111111-0000-0000-0000-000000000001',0,true, now(), now() + interval '60 days'),
  ('https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1600','/restaurant/a1111111-0000-0000-0000-000000000002',1,true, now(), now() + interval '60 days'),
  ('https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1600','/offers',2,true, now(), now() + interval '60 days');

-- COLLECTIONS --------------------------------------------------------
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

-- SAMPLE REVIEWS -----------------------------------------------------
insert into public.reviews (user_id, restaurant_id, overall_rating, food_rating, service_rating, ambience_rating, value_rating, text, recommend)
values
  ('22222222-2222-2222-2222-222222222222','a1111111-0000-0000-0000-000000000001',5,5,5,5,4,'Butter chicken here is unreal. Tender and silky — everything you want.',true),
  ('33333333-3333-3333-3333-333333333333','a1111111-0000-0000-0000-000000000001',4,5,4,4,4,'Loved the galouti-style lamb. Service was quick too.',true),
  ('22222222-2222-2222-2222-222222222222','a1111111-0000-0000-0000-000000000002',5,5,4,5,4,'Best margherita in Bengaluru, crust is textbook Napoletana.',true),
  ('33333333-3333-3333-3333-333333333333','a1111111-0000-0000-0000-000000000003',5,5,5,5,3,'Omakase was phenomenal. Worth every rupee.',true),
  ('22222222-2222-2222-2222-222222222222','a1111111-0000-0000-0000-000000000004',4,4,5,5,5,'Caesar kale became my new Sunday ritual.',true),
  ('33333333-3333-3333-3333-333333333333','a1111111-0000-0000-0000-000000000005',4,5,3,4,4,'Hyderabadi biryani was on point.',true);

-- Owner reply on first review
update public.reviews
   set reply_text = 'Thank you Priya! See you again soon. — Chef Suresh',
       reply_at = now()
 where restaurant_id = 'a1111111-0000-0000-0000-000000000001'
   and user_id = '22222222-2222-2222-2222-222222222222';

-- SAMPLE BOOKINGS ----------------------------------------------------
insert into public.bookings (user_id, restaurant_id, date, time, guests, seating_preference, status, source)
values
  ('22222222-2222-2222-2222-222222222222','a1111111-0000-0000-0000-000000000001', current_date + 1,'20:00', 2, 'indoor','confirmed','app'),
  ('22222222-2222-2222-2222-222222222222','a1111111-0000-0000-0000-000000000002', current_date + 3,'19:30', 4, 'outdoor','pending','app'),
  ('33333333-3333-3333-3333-333333333333','a1111111-0000-0000-0000-000000000003', current_date + 2,'21:00', 2, 'indoor','confirmed','app'),
  ('33333333-3333-3333-3333-333333333333','a1111111-0000-0000-0000-000000000001', current_date - 2,'20:00', 3, 'indoor','completed','app');

-- SAMPLE INVENTORY ---------------------------------------------------
insert into public.inventory (restaurant_id, name, quantity, unit, price_per_unit, min_threshold, supplier_name) values
  ('a1111111-0000-0000-0000-000000000001','Chicken', 24, 'kg', 320, 10, 'Venky''s'),
  ('a1111111-0000-0000-0000-000000000001','Paneer',   8, 'kg', 380,  4, 'Milky Mist'),
  ('a1111111-0000-0000-0000-000000000001','Basmati Rice', 30, 'kg', 180, 10, 'Daawat'),
  ('a1111111-0000-0000-0000-000000000001','Tomato',    14, 'kg',  40,  6, 'HOPCOMS'),
  ('a1111111-0000-0000-0000-000000000001','Butter',    3, 'kg', 560,  5, 'Amul'), -- low stock
  ('a1111111-0000-0000-0000-000000000001','Cream',     2, 'liter', 220, 3, 'Amul'); -- low stock

-- SAMPLE EXPENSES ----------------------------------------------------
insert into public.expenses (restaurant_id, amount, category, date, description, is_recurring, recurring_frequency)
values
  ('a1111111-0000-0000-0000-000000000001', 150000, 'rent', date_trunc('month', current_date)::date,'Monthly rent',true,'monthly'),
  ('a1111111-0000-0000-0000-000000000001',  85000, 'salaries', date_trunc('month', current_date)::date,'Staff salaries',true,'monthly'),
  ('a1111111-0000-0000-0000-000000000001',  24000, 'utilities', date_trunc('month', current_date)::date,'Electricity & water',true,'monthly'),
  ('a1111111-0000-0000-0000-000000000001',  48000, 'ingredients', current_date - 3,'Weekly produce run',false,null);
