-- Paid ad placements + Canva-lite poster designer storage.
-- Restaurant owners (and the platform itself) compose ads, pick a placement
-- and a daily budget, and submit for super-admin review. Once approved
-- they surface in the customer home feed during the date window.

do $$ begin
  create type ad_status as enum ('draft','pending_review','approved','active','paused','completed','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ad_placement as enum ('home_banner','home_featured','discover_inline','restaurant_top');
exception when duplicate_object then null; end $$;

create table if not exists public.ads (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  created_by uuid references public.users(id) on delete set null,

  -- Design payload
  template_id text not null,           -- e.g. 'spotlight', 'bold-banner'
  title text not null,
  subtitle text,
  body text,
  cta_text text default 'Learn more',
  cta_link text,                       -- internal app deep link
  image_url text,
  design_json jsonb not null default '{}'::jsonb,

  placement ad_placement not null default 'home_banner',
  daily_budget numeric(10,2) not null check (daily_budget >= 100),
  duration_days int not null default 7 check (duration_days between 1 and 90),
  total_cost numeric(12,2) generated always as (daily_budget * duration_days) stored,
  start_date date,
  end_date date,

  status ad_status not null default 'draft',
  admin_notes text,

  impressions int not null default 0,
  clicks int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ads_status on public.ads(status);
create index if not exists idx_ads_placement on public.ads(placement, status, start_date, end_date);
create index if not exists idx_ads_restaurant on public.ads(restaurant_id);

drop trigger if exists tg_ads_updated on public.ads;
create trigger tg_ads_updated before update on public.ads
  for each row execute function public.tg_set_updated_at();

-- Auto-fill end_date when status flips to active and we have a start_date.
create or replace function public.tg_ads_dates()
returns trigger language plpgsql as $$
begin
  if new.status = 'active' and (old.status is distinct from 'active') then
    if new.start_date is null then new.start_date := current_date; end if;
    if new.end_date is null then
      new.end_date := new.start_date + (new.duration_days || ' days')::interval;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists tg_ads_set_dates on public.ads;
create trigger tg_ads_set_dates before insert or update of status on public.ads
  for each row execute function public.tg_ads_dates();

-- Cheap impression / click counters (RPC so clients don't need write perms on ads)
create or replace function public.bump_ad_impression(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.ads set impressions = impressions + 1 where id = p_id;
$$;

create or replace function public.bump_ad_click(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.ads set clicks = clicks + 1 where id = p_id;
$$;

-- A single source of truth for "what should the customer feed show right now"
create or replace view public.live_ads as
  select * from public.ads
  where status = 'active'
    and (start_date is null or start_date <= current_date)
    and (end_date is null or end_date >= current_date);

-- RLS
alter table public.ads enable row level security;

drop policy if exists "ads_public_read_live" on public.ads;
create policy "ads_public_read_live"
  on public.ads for select
  using (
    status = 'active'
    or public.is_super_admin()
    or (restaurant_id is not null and public.is_restaurant_staff(restaurant_id))
    or (created_by is not null and created_by = auth.uid())
  );

drop policy if exists "ads_owner_write" on public.ads;
create policy "ads_owner_write"
  on public.ads for all
  using (
    public.is_super_admin()
    or (restaurant_id is not null and public.is_restaurant_staff(restaurant_id))
    or (created_by is not null and created_by = auth.uid())
  )
  with check (
    public.is_super_admin()
    or (restaurant_id is not null and public.is_restaurant_staff(restaurant_id))
    or (created_by is not null and created_by = auth.uid())
  );

-- Realtime so admin queue and home feed stay live
alter publication supabase_realtime add table public.ads;
