-- Atomic restaurant-owner onboarding: elevate role + create restaurant.
-- Called immediately after auth.signUp by the new owner.

CREATE OR REPLACE FUNCTION public.create_owner_account(
  p_owner_name text,
  p_phone text,
  p_restaurant_name text,
  p_city text DEFAULT 'Bangalore',
  p_address text DEFAULT NULL
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_rid uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Pull email from auth.users (the public.users row may already exist via trigger)
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Auth account missing';
  END IF;

  -- Upsert public.users with owner role + name + phone
  INSERT INTO public.users (id, email, name, phone, role, is_active)
  VALUES (v_uid, v_email, p_owner_name, p_phone, 'owner', true)
  ON CONFLICT (id) DO UPDATE
    SET role = 'owner',
        name = COALESCE(EXCLUDED.name, public.users.name),
        phone = COALESCE(EXCLUDED.phone, public.users.phone),
        is_active = true;

  -- Bail if this owner already runs a restaurant — return the existing id.
  SELECT id INTO v_rid FROM public.restaurants WHERE owner_id = v_uid LIMIT 1;
  IF v_rid IS NOT NULL THEN
    RETURN json_build_object('restaurant_id', v_rid, 'reused', true);
  END IF;

  -- Create restaurant
  INSERT INTO public.restaurants (
    owner_id, name, city, address, type, status,
    cuisines, amenities, hours, gallery_images, gallery_urls, price_range,
    cost_for_two, cashback_pct
  )
  VALUES (
    v_uid, p_restaurant_name, p_city, p_address, 'casual_dining', 'pending',
    '{}', '{}', '{}'::jsonb, '{}', '{}', 2,
    1200, 20
  )
  RETURNING id INTO v_rid;

  RETURN json_build_object('restaurant_id', v_rid, 'reused', false);
END $$;

GRANT EXECUTE ON FUNCTION public.create_owner_account(text, text, text, text, text) TO authenticated;
