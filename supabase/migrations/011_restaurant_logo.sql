-- Restaurants get their own logo separate from the cover hero photo.
-- Used by menu designer templates, owner settings, and (optionally)
-- customer-facing restaurant cards as a brand mark.

alter table public.restaurants
  add column if not exists logo_url text;
