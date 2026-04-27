-- Super-admin "creator backend": team roles, feature flags, campaigns,
-- and a `flagged_users` view for risk monitoring.

-- 1. Admin team roles (internal admin org). Distinct from user_role.
do $$ begin
  create type admin_role as enum (
    'super', 'support', 'marketing', 'sales', 'ops', 'finance', 'engineering', 'intern'
  );
exception when duplicate_object then null; end $$;

alter table public.users
  add column if not exists admin_role admin_role,
  add column if not exists admin_permissions jsonb not null default '{}'::jsonb;

create index if not exists idx_users_admin_role on public.users(admin_role);

-- 2. Feature flags table
create table if not exists public.feature_flags (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  description text,
  enabled bool not null default false,
  rollout_percent int not null default 100 check (rollout_percent between 0 and 100),
  restaurant_ids uuid[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists tg_ff_updated on public.feature_flags;
create trigger tg_ff_updated before update on public.feature_flags
  for each row execute function public.tg_set_updated_at();

-- Sensible default flags so the page isn't empty on first load.
insert into public.feature_flags (key, description, enabled, rollout_percent) values
  ('group_ordering', 'Multiple phones can join one table order', false, 0),
  ('waitlist_priority', 'Allow VIP priority on waitlists', true, 100),
  ('ai_menu_generator', 'AI menu designer (coming soon)', false, 0),
  ('split_bill_by_items', 'Itemised split bill UI', true, 100),
  ('referrals_2x', 'Double referral points week', false, 0)
on conflict (key) do nothing;

alter table public.feature_flags enable row level security;
drop policy if exists "ff_public_read" on public.feature_flags;
create policy "ff_public_read" on public.feature_flags for select using (true);
drop policy if exists "ff_admin_write" on public.feature_flags;
create policy "ff_admin_write" on public.feature_flags for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- 3. Campaigns: in-app broadcasts to user segments.
do $$ begin
  create type campaign_status as enum ('draft','scheduled','sent','cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text not null,
  segment jsonb not null default '{"all":true}'::jsonb,
  -- Examples:
  --   {"all":true}
  --   {"tiers":["gold","platinum","diamond"]}
  --   {"cities":["Bengaluru"]}
  --   {"inactive_days":30}
  --   {"new_users":true}
  cta_url text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  recipients_count int not null default 0,
  status campaign_status not null default 'draft',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_campaigns_status on public.campaigns(status);
drop trigger if exists tg_campaigns_updated on public.campaigns;
create trigger tg_campaigns_updated before update on public.campaigns
  for each row execute function public.tg_set_updated_at();

alter table public.campaigns enable row level security;
drop policy if exists "campaigns_admin" on public.campaigns;
create policy "campaigns_admin" on public.campaigns for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- 4. Helper: pick recipient ids for a segment object.
create or replace function public.campaign_recipients(seg jsonb)
returns setof uuid language plpgsql security definer set search_path = public as $$
declare
  rec record;
begin
  for rec in
    select u.id, u.role, u.loyalty_tier, u.created_at, u.is_active
    from public.users u
    where u.is_active and u.role = 'customer'
  loop
    -- All
    if (seg ? 'all' and (seg->>'all')::bool) then
      return next rec.id;
      continue;
    end if;
    -- Tiers
    if seg ? 'tiers' and rec.loyalty_tier::text = any (
      select jsonb_array_elements_text(seg->'tiers')
    ) then
      return next rec.id;
      continue;
    end if;
    -- New users (created in last 7 days)
    if (seg ? 'new_users' and (seg->>'new_users')::bool) and rec.created_at > now() - interval '7 days' then
      return next rec.id;
      continue;
    end if;
    -- Inactive
    if seg ? 'inactive_days' then
      if not exists (
        select 1 from public.orders o
         where o.user_id = rec.id
           and o.created_at > now() - ((seg->>'inactive_days')::int || ' days')::interval
      ) then
        return next rec.id;
        continue;
      end if;
    end if;
  end loop;
  return;
end $$;

-- 5. Send a campaign — create a notification per recipient.
create or replace function public.send_campaign(p_campaign_id uuid)
returns int language plpgsql security definer set search_path = public as $$
declare
  c record;
  uid uuid;
  count_sent int := 0;
begin
  select * into c from public.campaigns where id = p_campaign_id;
  if c is null then return 0; end if;
  if c.status = 'sent' then return 0; end if;

  for uid in select * from public.campaign_recipients(c.segment) loop
    insert into public.notifications(user_id, type, title, message, data)
    values (uid, 'offer', c.title, c.body,
      jsonb_build_object('campaign_id', c.id, 'cta', c.cta_url));
    count_sent := count_sent + 1;
  end loop;

  update public.campaigns
     set status = 'sent', sent_at = now(), recipients_count = count_sent
   where id = p_campaign_id;
  return count_sent;
end $$;

-- 6. Risk view: customers with concerning patterns.
create or replace view public.flagged_users as
  select
    u.id,
    u.name,
    u.email,
    u.is_active,
    u.created_at,
    coalesce(b.total_bookings, 0) as bookings,
    coalesce(b.no_shows, 0) as no_shows,
    coalesce(b.cancellations, 0) as cancellations,
    coalesce(t.tickets_open, 0) as tickets_open,
    coalesce(o.orders_count, 0) as orders_count,
    coalesce(o.refunds, 0) as refunds,
    -- Simple risk score 0-100
    least(100,
      coalesce(b.no_shows, 0) * 15 +
      coalesce(b.cancellations, 0) * 5 +
      coalesce(t.tickets_open, 0) * 8
    ) as risk_score
  from public.users u
  left join (
    select user_id,
      count(*) as total_bookings,
      count(*) filter (where status = 'no_show') as no_shows,
      count(*) filter (where status = 'cancelled') as cancellations
    from public.bookings group by user_id
  ) b on b.user_id = u.id
  left join (
    select user_id, count(*) filter (where status not in ('resolved','closed')) as tickets_open
    from public.support_tickets group by user_id
  ) t on t.user_id = u.id
  left join (
    select user_id,
      count(*) as orders_count,
      count(*) filter (where status = 'cancelled') as refunds
    from public.orders group by user_id
  ) o on o.user_id = u.id
  where u.role = 'customer';

-- 7. Promote the seeded super_admin to head super so they can invite team.
update public.users set admin_role = 'super',
  admin_permissions = jsonb_build_object(
    'manage_team', true,
    'manage_billing', true,
    'manage_flags', true,
    'manage_campaigns', true,
    'view_revenue', true,
    'view_audit', true,
    'view_risk', true,
    'view_cohorts', true,
    'manage_content', true,
    'manage_restaurants', true,
    'manage_users', true
  )
where role = 'super_admin' and admin_role is null;
