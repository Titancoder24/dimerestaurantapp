-- Real-time chat system + restaurant map coordinates.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. Restaurant map coordinates ────────────────────────────────────
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS latitude numeric(10,7);
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS longitude numeric(10,7);

-- ── 2. Chat threads ──────────────────────────────────────────────────
-- kind = 'customer_owner' (user ↔ restaurant) | 'owner_support' (owner ↔ super_admin)
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('customer_owner','owner_support')),
  subject text,
  status text NOT NULL DEFAULT 'open',
  last_message text,
  last_message_at timestamptz,
  customer_unread int NOT NULL DEFAULT 0,
  owner_unread int NOT NULL DEFAULT 0,
  admin_unread int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_threads_rest_idx ON public.chat_threads(restaurant_id, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS chat_threads_customer_idx ON public.chat_threads(customer_id, last_message_at DESC NULLS LAST);
CREATE UNIQUE INDEX IF NOT EXISTS chat_threads_customer_owner_uq
  ON public.chat_threads(restaurant_id, customer_id)
  WHERE kind = 'customer_owner';

-- ── 3. Chat messages ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  sender_role text NOT NULL,
  body text NOT NULL,
  attachments text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_messages_thread_idx ON public.chat_messages(thread_id, created_at);

-- ── 4. Trigger: bump thread on new message ───────────────────────────
CREATE OR REPLACE FUNCTION public.chat_after_insert_msg()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r record;
BEGIN
  SELECT kind, customer_id INTO r FROM public.chat_threads WHERE id = NEW.thread_id;
  UPDATE public.chat_threads
    SET last_message = LEFT(NEW.body, 200),
        last_message_at = NEW.created_at,
        updated_at = NEW.created_at,
        customer_unread = CASE
          WHEN NEW.sender_role IN ('owner','manager','super_admin')
          THEN customer_unread + 1 ELSE customer_unread
        END,
        owner_unread = CASE
          WHEN NEW.sender_role IN ('customer','super_admin')
          THEN owner_unread + 1 ELSE owner_unread
        END,
        admin_unread = CASE
          WHEN NEW.sender_role IN ('owner','manager') AND r.kind = 'owner_support'
          THEN admin_unread + 1 ELSE admin_unread
        END
    WHERE id = NEW.thread_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS chat_msg_after_insert ON public.chat_messages;
CREATE TRIGGER chat_msg_after_insert
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.chat_after_insert_msg();

-- ── 5. RLS ───────────────────────────────────────────────────────────
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_threads access" ON public.chat_threads;
CREATE POLICY "chat_threads access" ON public.chat_threads
  FOR ALL
  USING (
    -- customer in customer_owner thread
    (kind = 'customer_owner' AND customer_id = auth.uid())
    -- owner / manager / staff of the restaurant
    OR (restaurant_id IS NOT NULL AND public.user_can_manage_restaurant(restaurant_id))
    -- super_admin
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  )
  WITH CHECK (
    (kind = 'customer_owner' AND customer_id = auth.uid())
    OR (restaurant_id IS NOT NULL AND public.user_can_manage_restaurant(restaurant_id))
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );

DROP POLICY IF EXISTS "chat_messages access" ON public.chat_messages;
CREATE POLICY "chat_messages access" ON public.chat_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = chat_messages.thread_id
        AND (
          (t.kind = 'customer_owner' AND t.customer_id = auth.uid())
          OR (t.restaurant_id IS NOT NULL AND public.user_can_manage_restaurant(t.restaurant_id))
          OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = chat_messages.thread_id
        AND (
          (t.kind = 'customer_owner' AND t.customer_id = auth.uid())
          OR (t.restaurant_id IS NOT NULL AND public.user_can_manage_restaurant(t.restaurant_id))
          OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
        )
    )
  );

-- ── 6. Realtime: include in publication ──────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages';
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_threads';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Updated_at touch
DROP TRIGGER IF EXISTS chat_threads_touch ON public.chat_threads;
CREATE TRIGGER chat_threads_touch BEFORE UPDATE ON public.chat_threads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
