-- 014_dineout_metadata.sql
-- Adds the columns the Dineout listing + premium detail screens read.
-- Idempotent.

alter table restaurants
  add column if not exists cost_for_two int default 1200,
  add column if not exists distance_km numeric(4,1),
  add column if not exists pre_booking_discount_pct int,
  add column if not exists bank_offer_label text,
  add column if not exists cashback_pct int default 20,
  add column if not exists gallery_urls text[] default '{}'::text[];

alter table reviews
  add column if not exists beverages_rating numeric(2,1);

-- food_rating and service_rating already exist on reviews (003_tables.sql).
-- We add only the new beverages axis above.

-- Backfill: where gallery_urls is empty and gallery_images has data, mirror it.
update restaurants
   set gallery_urls = gallery_images
 where (gallery_urls is null or array_length(gallery_urls, 1) is null)
   and array_length(gallery_images, 1) is not null;
