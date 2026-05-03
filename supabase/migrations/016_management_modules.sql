-- 10 new restaurant-management modules: shifts, CRM, cash-recon, recipes,
-- vendors/POs, wastage, floor-plan, tips, waitlist, 86-list/specials.
-- All tables are restaurant-scoped and follow the existing RLS pattern:
-- owners + managers RW for their own restaurant; servers read + targeted writes.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. Shifts & Time Clock ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  clock_in timestamptz,
  clock_out timestamptz,
  role text DEFAULT 'server',
  notes text,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shifts_rest_user_idx ON public.shifts(restaurant_id, user_id, scheduled_start DESC);

-- ── 2. Customer CRM ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  email text,
  birthday date,
  anniversary date,
  dietary text[] DEFAULT '{}',
  allergens text[] DEFAULT '{}',
  preferences jsonb DEFAULT '{}'::jsonb,
  visits int NOT NULL DEFAULT 0,
  total_spend numeric(12,2) NOT NULL DEFAULT 0,
  loyalty_tier text NOT NULL DEFAULT 'standard',
  staff_notes text,
  last_visit timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, phone)
);
CREATE INDEX IF NOT EXISTS crm_rest_idx ON public.customer_profiles(restaurant_id, last_visit DESC NULLS LAST);

-- ── 3. Daily Cash Reconciliation ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cash_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  business_date date NOT NULL,
  expected_cash numeric(12,2) NOT NULL DEFAULT 0,
  expected_card numeric(12,2) NOT NULL DEFAULT 0,
  expected_upi numeric(12,2) NOT NULL DEFAULT 0,
  counted_cash numeric(12,2) NOT NULL DEFAULT 0,
  counted_card numeric(12,2) NOT NULL DEFAULT 0,
  counted_upi numeric(12,2) NOT NULL DEFAULT 0,
  variance numeric(12,2) GENERATED ALWAYS AS (
    (counted_cash + counted_card + counted_upi)
    - (expected_cash + expected_card + expected_upi)
  ) STORED,
  notes text,
  status text NOT NULL DEFAULT 'open',
  closed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, business_date)
);

-- ── 4. Recipes & food cost ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE CASCADE,
  yield_qty numeric(10,3) NOT NULL DEFAULT 1,
  yield_unit text NOT NULL DEFAULT 'serving',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  inventory_id uuid REFERENCES public.inventory(id) ON DELETE SET NULL,
  description text,
  qty numeric(10,3) NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'g',
  unit_cost numeric(10,2) NOT NULL DEFAULT 0,
  line_cost numeric(10,2) GENERATED ALWAYS AS (qty * unit_cost) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 5. Vendors & Purchase Orders ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  gst_number text,
  payment_terms text DEFAULT 'NET-7',
  lead_days int DEFAULT 1,
  category text,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  po_number text,
  status text NOT NULL DEFAULT 'draft',
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  expected_delivery date,
  received_at timestamptz,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  inventory_id uuid REFERENCES public.inventory(id) ON DELETE SET NULL,
  description text NOT NULL,
  qty numeric(10,3) NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'kg',
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  line_total numeric(12,2) GENERATED ALWAYS AS (qty * unit_price) STORED
);

-- ── 6. Wastage Log ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wastage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  inventory_id uuid REFERENCES public.inventory(id) ON DELETE SET NULL,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  description text,
  qty numeric(10,3) NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'g',
  reason text NOT NULL DEFAULT 'spoilage',
  cost numeric(10,2) NOT NULL DEFAULT 0,
  recorded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wastage_rest_idx ON public.wastage_logs(restaurant_id, created_at DESC);

-- ── 7. Floor plan extensions to existing `tables` ─────────────────────
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS x int DEFAULT 0;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS y int DEFAULT 0;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS shape text DEFAULT 'rect';
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS qr_token text;

-- ── 8. Tip Pool ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tip_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  shift_id uuid REFERENCES public.shifts(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_date date NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'cash',
  recorded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tips_rest_idx ON public.tip_entries(restaurant_id, business_date DESC);

-- ── 9. Waitlist ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  guest_name text NOT NULL,
  phone text,
  party_size int NOT NULL DEFAULT 2,
  estimated_wait_min int DEFAULT 15,
  status text NOT NULL DEFAULT 'waiting',
  added_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  notified_at timestamptz,
  seated_at timestamptz,
  left_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS waitlist_rest_idx ON public.waitlist_entries(restaurant_id, status, created_at);

-- ── 10. 86-list & Daily Specials ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.eighty_six_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  business_date date NOT NULL DEFAULT current_date,
  reason text,
  marked_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  cleared_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, menu_item_id, business_date)
);

CREATE TABLE IF NOT EXISTS public.daily_specials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  special_price numeric(10,2),
  image_url text,
  business_date date NOT NULL DEFAULT current_date,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────
-- Helper predicate: user is owner / manager / server / super_admin of `restaurant_id`
CREATE OR REPLACE FUNCTION public.user_can_manage_restaurant(rid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND (
        u.role = 'super_admin'
        OR EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = rid AND r.owner_id = u.id)
        OR EXISTS (SELECT 1 FROM public.staff s WHERE s.restaurant_id = rid AND s.user_id = u.id AND s.is_active = true)
      )
  );
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'shifts','customer_profiles','cash_reconciliations','recipes','recipe_ingredients',
    'vendors','purchase_orders','purchase_order_items','wastage_logs',
    'tip_entries','waitlist_entries','eighty_six_list','daily_specials'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- Generic policy: anyone with restaurant access can read & write rows scoped to their restaurant.
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'shifts','customer_profiles','cash_reconciliations','recipes',
    'vendors','purchase_orders','wastage_logs','tip_entries','waitlist_entries',
    'eighty_six_list','daily_specials'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || ' manage', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL USING (public.user_can_manage_restaurant(restaurant_id)) WITH CHECK (public.user_can_manage_restaurant(restaurant_id))',
      t || ' manage', t
    );
  END LOOP;
END $$;

-- Sub-tables (recipe_ingredients, purchase_order_items) inherit via parent restaurant
DROP POLICY IF EXISTS "recipe_ingredients manage" ON public.recipe_ingredients;
CREATE POLICY "recipe_ingredients manage" ON public.recipe_ingredients
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_ingredients.recipe_id
        AND public.user_can_manage_restaurant(r.restaurant_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_ingredients.recipe_id
        AND public.user_can_manage_restaurant(r.restaurant_id)
    )
  );

DROP POLICY IF EXISTS "purchase_order_items manage" ON public.purchase_order_items;
CREATE POLICY "purchase_order_items manage" ON public.purchase_order_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_orders po
      WHERE po.id = purchase_order_items.po_id
        AND public.user_can_manage_restaurant(po.restaurant_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.purchase_orders po
      WHERE po.id = purchase_order_items.po_id
        AND public.user_can_manage_restaurant(po.restaurant_id)
    )
  );

-- updated_at touch trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'shifts','customer_profiles','recipes','vendors','purchase_orders','waitlist_entries'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %1$s_touch ON public.%1$I', t);
    EXECUTE format(
      'CREATE TRIGGER %1$s_touch BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t
    );
  END LOOP;
END $$;
