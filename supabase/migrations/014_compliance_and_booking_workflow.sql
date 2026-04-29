-- Add compliance/business fields to restaurants
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS fssai_certificate_url text,
  ADD COLUMN IF NOT EXISTS pan_number text,
  ADD COLUMN IF NOT EXISTS bank_account_name text,
  ADD COLUMN IF NOT EXISTS bank_account_number text,
  ADD COLUMN IF NOT EXISTS bank_ifsc text,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Add booking response fields
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS responded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS response_note text;

-- Extend notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'booking_request';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'booking_confirmed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'booking_rejected';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'restaurant_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'restaurant_rejected';

-- Notify restaurant owner on new booking
CREATE OR REPLACE FUNCTION public.notify_owner_on_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_owner_id uuid; v_restaurant_name text; v_user_name text;
BEGIN
  SELECT owner_id, name INTO v_owner_id, v_restaurant_name FROM public.restaurants WHERE id = NEW.restaurant_id;
  SELECT COALESCE(name, email) INTO v_user_name FROM public.users WHERE id = NEW.user_id;
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (v_owner_id, 'booking_request', 'New reservation request',
    COALESCE(v_user_name, 'A guest') || ' wants to book ' || NEW.guests || ' guests on ' || to_char(NEW.date, 'DD Mon') || ' at ' || to_char(NEW.time, 'HH12:MI AM'),
    jsonb_build_object('booking_id', NEW.id, 'restaurant_id', NEW.restaurant_id, 'restaurant_name', v_restaurant_name, 'user_name', v_user_name, 'date', NEW.date, 'time', NEW.time, 'guests', NEW.guests, 'seating', NEW.seating_preference, 'occasion', NEW.occasion, 'notes', NEW.special_requests));
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS tg_booking_notify_owner ON public.bookings;
CREATE TRIGGER tg_booking_notify_owner AFTER INSERT ON public.bookings FOR EACH ROW WHEN (NEW.status = 'pending') EXECUTE FUNCTION public.notify_owner_on_booking();

-- Notify user on booking response
CREATE OR REPLACE FUNCTION public.notify_user_on_booking_response()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_restaurant_name text; v_notif_type notification_type; v_title text; v_message text;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;
  SELECT name INTO v_restaurant_name FROM public.restaurants WHERE id = NEW.restaurant_id;
  IF NEW.status = 'confirmed' THEN
    v_notif_type := 'booking_confirmed'; v_title := 'Booking confirmed!';
    v_message := v_restaurant_name || ' confirmed your reservation for ' || NEW.guests || ' on ' || to_char(NEW.date, 'DD Mon') || ' at ' || to_char(NEW.time, 'HH12:MI AM');
  ELSIF NEW.status = 'cancelled' AND OLD.status = 'pending' THEN
    v_notif_type := 'booking_rejected'; v_title := 'Booking not available';
    v_message := v_restaurant_name || ' could not accommodate your request for ' || to_char(NEW.date, 'DD Mon') || '. ' || COALESCE(NEW.response_note, '');
  ELSE RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (NEW.user_id, v_notif_type, v_title, v_message, jsonb_build_object('booking_id', NEW.id, 'restaurant_id', NEW.restaurant_id, 'restaurant_name', v_restaurant_name, 'status', NEW.status, 'date', NEW.date, 'time', NEW.time));
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS tg_booking_notify_user ON public.bookings;
CREATE TRIGGER tg_booking_notify_user AFTER UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.notify_user_on_booking_response();

-- Notify owner on restaurant approval/rejection
CREATE OR REPLACE FUNCTION public.notify_owner_on_restaurant_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_notif_type notification_type; v_title text; v_message text;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.status = 'verified' AND OLD.status = 'pending' THEN
    v_notif_type := 'restaurant_approved'; v_title := 'Restaurant approved!';
    v_message := NEW.name || ' has been approved and is now live on DIME!';
  ELSIF NEW.status = 'suspended' OR NEW.status = 'banned' THEN
    v_notif_type := 'restaurant_rejected'; v_title := 'Restaurant status updated';
    v_message := NEW.name || ' has been ' || NEW.status || '.' || COALESCE(' Reason: ' || NEW.rejection_reason, '');
  ELSE RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (NEW.owner_id, v_notif_type, v_title, v_message, jsonb_build_object('restaurant_id', NEW.id, 'status', NEW.status, 'reason', NEW.rejection_reason));
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS tg_restaurant_status_notify ON public.restaurants;
CREATE TRIGGER tg_restaurant_status_notify AFTER UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.notify_owner_on_restaurant_status();
