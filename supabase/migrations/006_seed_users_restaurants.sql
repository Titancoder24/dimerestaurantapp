-- Seed: demo auth users + restaurants + owner ownership.
-- Idempotent: inserts guarded by ON CONFLICT.

-- Deterministic UUIDs so seeds can be referenced across files.
do $$ declare
  uid_demo constant uuid := '11111111-1111-1111-1111-111111111111';
  uid_priya constant uuid := '22222222-2222-2222-2222-222222222222';
  uid_rahul constant uuid := '33333333-3333-3333-3333-333333333333';
  uid_owner constant uuid := '44444444-4444-4444-4444-444444444444';
  uid_admin constant uuid := '55555555-5555-5555-5555-555555555555';
begin
  -- seed auth.users with bcrypt-hashed passwords ("demo123", "priya123", etc.)
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

  -- Upsert public.users (trigger may have inserted some already)
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

-- Restaurants --------------------------------------------------------
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
