-- DIME enums
do $$ begin
  create type user_role as enum ('customer','owner','manager','host','chef','cashier','server','super_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type loyalty_tier as enum ('silver','gold','platinum','diamond');
exception when duplicate_object then null; end $$;

do $$ begin
  create type restaurant_type as enum ('fine_dine','qsr','cafe','bar','bakery','cloud_kitchen','food_court');
exception when duplicate_object then null; end $$;

do $$ begin
  create type restaurant_status as enum ('pending','verified','suspended','banned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type staff_role as enum ('owner','manager','host','chef','cashier','server');
exception when duplicate_object then null; end $$;

do $$ begin
  create type table_zone as enum ('indoor','outdoor','rooftop','private','bar');
exception when duplicate_object then null; end $$;

do $$ begin
  create type table_status as enum ('available','occupied','reserved','blocked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status as enum ('pending','confirmed','arrived','cancelled','no_show','completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_source as enum ('app','walk_in','phone');
exception when duplicate_object then null; end $$;

do $$ begin
  create type seating_pref as enum ('any','indoor','outdoor','rooftop','private','bar');
exception when duplicate_object then null; end $$;

do $$ begin
  create type waitlist_status as enum ('waiting','notified','seated','expired','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_type as enum ('dine_in','takeaway','delivery');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('received','preparing','ready','served','paid','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('unpaid','paid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_item_status as enum ('pending','preparing','ready','served');
exception when duplicate_object then null; end $$;

do $$ begin
  create type loyalty_tx_type as enum ('earned_order','earned_review','earned_referral','earned_bonus','redeemed','expired','adjusted_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type discount_type as enum ('percentage','flat','bogo','free_item');
exception when duplicate_object then null; end $$;

do $$ begin
  create type target_audience as enum ('all','new_users','tier_gold','tier_platinum','tier_diamond');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum ('order_update','booking_update','offer','loyalty','system');
exception when duplicate_object then null; end $$;

do $$ begin
  create type inventory_unit as enum ('kg','g','liter','ml','piece','dozen','packet');
exception when duplicate_object then null; end $$;

do $$ begin
  create type inventory_status as enum ('in_stock','low_stock','out_of_stock');
exception when duplicate_object then null; end $$;

do $$ begin
  create type expense_category as enum ('rent','salaries','utilities','ingredients','maintenance','marketing','licenses','misc');
exception when duplicate_object then null; end $$;

do $$ begin
  create type recurring_freq as enum ('monthly','weekly','yearly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ticket_category as enum ('order_issue','payment_issue','booking_issue','app_bug','restaurant_complaint','account_issue','feedback','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ticket_priority as enum ('low','medium','high','critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ticket_status as enum ('open','in_progress','waiting_on_user','resolved','closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sender_type as enum ('user','admin');
exception when duplicate_object then null; end $$;
