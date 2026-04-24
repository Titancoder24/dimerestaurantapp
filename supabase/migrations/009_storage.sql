-- Storage buckets for owner-uploaded media.
-- restaurant-media: cover, gallery, document uploads
-- menu-media: item photos
-- review-media: customer review photos
-- avatars: user profile pictures

insert into storage.buckets (id, name, public)
values
  ('restaurant-media', 'restaurant-media', true),
  ('menu-media', 'menu-media', true),
  ('review-media', 'review-media', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Anyone may read public buckets.
drop policy if exists "Public read" on storage.objects;
create policy "Public read"
  on storage.objects for select
  using (bucket_id in ('restaurant-media','menu-media','review-media','avatars'));

-- Owners write to their own restaurant's folder.
-- Convention: object path = "<restaurant_id>/<filename>" or "<user_id>/<filename>".
drop policy if exists "Authenticated users can upload" on storage.objects;
create policy "Authenticated users can upload"
  on storage.objects for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Owners and uploader can update" on storage.objects;
create policy "Owners and uploader can update"
  on storage.objects for update
  using (auth.role() = 'authenticated');

drop policy if exists "Owners and uploader can delete" on storage.objects;
create policy "Owners and uploader can delete"
  on storage.objects for delete
  using (auth.role() = 'authenticated');
