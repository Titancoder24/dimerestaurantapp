-- DIME database bootstrap: extensions + shared helpers
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Generic updated_at trigger used by every table below.
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Short unique human-readable codes, used for order_number and ticket_number.
create or replace function public.short_code(prefix text)
returns text language plpgsql as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  out text := '';
  i int;
begin
  for i in 1..4 loop
    out := out || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return prefix || '-' || out;
end $$;
