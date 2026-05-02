-- Dineout-specific metadata for restaurants and reviews
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS cost_for_two int DEFAULT 1200,
  ADD COLUMN IF NOT EXISTS distance_km numeric(4,1),
  ADD COLUMN IF NOT EXISTS pre_booking_discount_pct int,
  ADD COLUMN IF NOT EXISTS bank_offer_label text,
  ADD COLUMN IF NOT EXISTS cashback_pct int DEFAULT 20,
  ADD COLUMN IF NOT EXISTS gallery_urls text[] DEFAULT '{}';

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS food_rating numeric(2,1),
  ADD COLUMN IF NOT EXISTS beverages_rating numeric(2,1),
  ADD COLUMN IF NOT EXISTS service_rating numeric(2,1);

-- Backfill gallery_urls from existing gallery_images for restaurants that have them
UPDATE public.restaurants
SET gallery_urls = COALESCE(gallery_images, '{}')
WHERE (gallery_urls IS NULL OR cardinality(gallery_urls) = 0)
  AND gallery_images IS NOT NULL
  AND cardinality(gallery_images) > 0;

-- Synthesize per-axis review ratings from overall_rating where missing
UPDATE public.reviews
SET food_rating = COALESCE(food_rating, overall_rating),
    beverages_rating = COALESCE(beverages_rating, overall_rating),
    service_rating = COALESCE(service_rating, overall_rating)
WHERE food_rating IS NULL OR beverages_rating IS NULL OR service_rating IS NULL;
