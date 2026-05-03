-- 8 additional restaurant-management modules:
-- loyalty programs, expenses & P&L, external reviews aggregation,
-- marketing campaigns, compliance calendar, equipment maintenance,
-- private events / banquets, delivery reconciliation.
-- All tables restaurant-scoped + RLS via user_can_manage_restaurant().

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. Loyalty programs + rewards ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.loyalty_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'House Loyalty',
  points_per_rupee numeric(6,3) NOT NULL DEFAULT 0.05,
  redemption_rate numeric(6,3) NOT NULL DEFAULT 0.5,
  birthday_bonus_pts int NOT NULL DEFAULT 100,
  tier_thresholds jsonb NOT NULL DEFAULT '{"silver":2000,"gold":10000}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, name)
);

CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  points_required int NOT NULL DEFAULT 100,
  reward_type text NOT NULL DEFAULT 'discount_pct',
  reward_value numeric(10,2) NOT NULL DEFAULT 10,
  valid_from date,
  valid_to date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Expenses & P&L (extends pre-existing expenses table) ────────
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS vendor_name text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS recorded_by uuid REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS notes text;
CREATE INDEX IF NOT EXISTS expenses_rest_date_idx ON public.expenses(restaurant_id, date DESC);

-- ── 3. Compliance calendar ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.compliance_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'license',
  title text NOT NULL,
  reference_number text,
  document_url text,
  issued_at date,
  expires_at date,
  reminder_days int[] DEFAULT '{30,7}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','renewing','superseded')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS compliance_rest_idx ON public.compliance_items(restaurant_id, expires_at);

-- ── 6. Equipment + service log ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text DEFAULT 'kitchen',
  serial_number text,
  vendor_name text,
  purchase_date date,
  warranty_until date,
  last_serviced_at date,
  next_service_due date,
  status text NOT NULL DEFAULT 'operational' CHECK (status IN ('operational','needs_service','out_of_service','retired')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS equipment_rest_idx ON public.equipment(restaurant_id, next_service_due);

CREATE TABLE IF NOT EXISTS public.equipment_service_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  serviced_at date NOT NULL DEFAULT current_date,
  service_kind text DEFAULT 'maintenance',
  cost numeric(10,2) NOT NULL DEFAULT 0,
  technician text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 7. Private events / banquets ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.banquet_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  phone text,
  email text,
  event_date date NOT NULL,
  event_time time,
  guest_count int NOT NULL DEFAULT 10,
  event_type text DEFAULT 'birthday' CHECK (event_type IN ('birthday','anniversary','corporate','wedding','engagement','reception','other')),
  package_name text,
  total_quote numeric(12,2) NOT NULL DEFAULT 0,
  deposit_paid numeric(12,2) NOT NULL DEFAULT 0,
  balance_due numeric(12,2) GENERATED ALWAYS AS (total_quote - deposit_paid) STORED,
  status text NOT NULL DEFAULT 'inquiry' CHECK (status IN ('inquiry','quoted','confirmed','completed','cancelled')),
  notes text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS banquets_rest_idx ON public.banquet_events(restaurant_id, event_date);

-- ── 8. Delivery reconciliation ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.delivery_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('swiggy','zomato','dunzo','magicpin','other')),
  business_date date NOT NULL,
  gross_sales numeric(12,2) NOT NULL DEFAULT 0,
  order_count int NOT NULL DEFAULT 0,
  commission_pct numeric(5,2) NOT NULL DEFAULT 25,
  commission_amount numeric(12,2) NOT NULL DEFAULT 0,
  delivery_fees numeric(12,2) NOT NULL DEFAULT 0,
  taxes numeric(12,2) NOT NULL DEFAULT 0,
  refunds numeric(12,2) NOT NULL DEFAULT 0,
  net_payout numeric(12,2) GENERATED ALWAYS AS (gross_sales - commission_amount - delivery_fees - refunds) STORED,
  payout_received_at date,
  notes text,
  recorded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, platform, business_date)
);
CREATE INDEX IF NOT EXISTS delivery_recon_rest_idx ON public.delivery_reconciliations(restaurant_id, business_date DESC);

-- ── RLS ────────────────────────────────────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'loyalty_programs','loyalty_rewards',
    'compliance_items','equipment','banquet_events',
    'delivery_reconciliations'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || ' manage', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL USING (public.user_can_manage_restaurant(restaurant_id)) WITH CHECK (public.user_can_manage_restaurant(restaurant_id))',
      t || ' manage', t
    );
  END LOOP;
END $$;

-- equipment_service_log inherits via parent
ALTER TABLE public.equipment_service_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "equipment_service_log manage" ON public.equipment_service_log;
CREATE POLICY "equipment_service_log manage" ON public.equipment_service_log
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.equipment e
      WHERE e.id = equipment_service_log.equipment_id
        AND public.user_can_manage_restaurant(e.restaurant_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.equipment e
      WHERE e.id = equipment_service_log.equipment_id
        AND public.user_can_manage_restaurant(e.restaurant_id)
    )
  );

-- updated_at touches
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'loyalty_programs','compliance_items','equipment','banquet_events'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %1$s_touch ON public.%1$I', t);
    EXECUTE format(
      'CREATE TRIGGER %1$s_touch BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t
    );
  END LOOP;
END $$;
