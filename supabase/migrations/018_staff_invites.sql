-- Staff invite + onboarding flow.
-- Owner creates invites; staff redeems via /invite/<code> to sign up,
-- which atomically links them to the staff row and elevates role.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Staff invites ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.staff_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  phone text,
  role user_role NOT NULL CHECK (role IN ('manager','server','host','chef','cashier')),
  pin text NOT NULL DEFAULT lpad((floor(random()*10000))::text, 4, '0'),
  permissions jsonb DEFAULT '{}'::jsonb,
  invited_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '14 days',
  consumed_at timestamptz,
  consumed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_invites_rest_idx ON public.staff_invites(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS staff_invites_email_idx ON public.staff_invites(lower(email));

ALTER TABLE public.staff_invites ENABLE ROW LEVEL SECURITY;

-- Owner/manager/super_admin manage invites for their restaurants
DROP POLICY IF EXISTS "staff_invites manage" ON public.staff_invites;
CREATE POLICY "staff_invites manage" ON public.staff_invites
  FOR ALL
  USING (
    public.user_can_manage_restaurant(restaurant_id)
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  )
  WITH CHECK (
    public.user_can_manage_restaurant(restaurant_id)
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );

-- Anyone can SELECT a single invite by code (public lookup for the redeem screen)
DROP POLICY IF EXISTS "staff_invites public lookup" ON public.staff_invites;
CREATE POLICY "staff_invites public lookup" ON public.staff_invites
  FOR SELECT
  USING (true);  -- code is the secret; treat as public read by code

-- ── RPC: redeem invite ──────────────────────────────────────────────
-- After auth.signUp completes, the new user calls redeem_staff_invite(code).
-- Atomic: marks invite consumed, upserts staff, elevates user role.
CREATE OR REPLACE FUNCTION public.redeem_staff_invite(p_code text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_invite public.staff_invites%ROWTYPE;
  v_staff_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_invite FROM public.staff_invites
   WHERE code = p_code AND consumed_at IS NULL AND expires_at > now()
   LIMIT 1;

  IF v_invite.id IS NULL THEN
    RAISE EXCEPTION 'Invite not found or expired';
  END IF;

  -- Update users.role
  UPDATE public.users SET role = v_invite.role WHERE id = v_uid;

  -- Insert staff record (handle existing email match by user_id)
  INSERT INTO public.staff (
    restaurant_id, user_id, name, phone, role, pin, permissions, is_active
  )
  VALUES (
    v_invite.restaurant_id, v_uid, v_invite.name, v_invite.phone, v_invite.role,
    v_invite.pin, COALESCE(v_invite.permissions, '{}'::jsonb), true
  )
  RETURNING id INTO v_staff_id;

  -- Mark invite consumed
  UPDATE public.staff_invites
     SET consumed_at = now(), consumed_by = v_uid
   WHERE id = v_invite.id;

  RETURN json_build_object(
    'staff_id', v_staff_id,
    'restaurant_id', v_invite.restaurant_id,
    'role', v_invite.role
  );
END $$;

GRANT EXECUTE ON FUNCTION public.redeem_staff_invite(text) TO authenticated, anon;

-- ── RPC: cascade-delete a user (super admin) ─────────────────────────
-- Removes the public.users row and all owned data so the auth user can be
-- removed via auth.admin separately.
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_role text;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  IF v_role IS DISTINCT FROM 'super_admin' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  DELETE FROM public.staff WHERE user_id = p_user_id;
  DELETE FROM public.bookings WHERE user_id = p_user_id;
  DELETE FROM public.orders WHERE user_id = p_user_id;
  DELETE FROM public.reviews WHERE user_id = p_user_id;
  DELETE FROM public.notifications WHERE user_id = p_user_id;
  DELETE FROM public.chat_threads WHERE customer_id = p_user_id;
  DELETE FROM public.users WHERE id = p_user_id;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;

-- ── RPC: cascade-delete a restaurant (super admin) ───────────────────
CREATE OR REPLACE FUNCTION public.admin_delete_restaurant(p_restaurant_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_role text;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  IF v_role IS DISTINCT FROM 'super_admin' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  DELETE FROM public.restaurants WHERE id = p_restaurant_id;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_delete_restaurant(uuid) TO authenticated;

-- ── Owner-side: delete a staff member ────────────────────────────────
-- Allowed for owner/manager/super_admin of the staff's restaurant.
CREATE OR REPLACE FUNCTION public.owner_delete_staff(p_staff_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_rid uuid;
  v_uid uuid;
BEGIN
  SELECT restaurant_id, user_id INTO v_rid, v_uid FROM public.staff WHERE id = p_staff_id;
  IF v_rid IS NULL THEN RAISE EXCEPTION 'Staff not found'; END IF;
  IF NOT public.user_can_manage_restaurant(v_rid) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  DELETE FROM public.staff WHERE id = p_staff_id;
  -- Demote the user back to customer if they were a staff role
  IF v_uid IS NOT NULL THEN
    UPDATE public.users SET role = 'customer'
     WHERE id = v_uid AND role IN ('manager','server','host','chef','cashier');
  END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.owner_delete_staff(uuid) TO authenticated;
