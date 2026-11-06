-- =====================================================================
-- Spotlight MVP: database schema, security rules and business logic
-- Run once on a fresh Supabase project (SQL editor or Management API).
-- Business rules live in the database (RPC functions) so the browser
-- can never skip them, e.g. by checking in with a wrong venue code.
-- =====================================================================

-- ---------- Tables ---------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  seed_key text unique,                       -- set only for fictional seed users
  is_admin boolean not null default false,    -- can reset data and see stats
  is_test_account boolean not null default false,
  confirmed_18 boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
  neighborhood text not null,
  address text not null,
  description text not null,
  offer text not null,
  discount_pct int not null default 20 check (discount_pct between 5 and 50),
  quiet_hours text,
  emoji text not null default '📍',
  color text not null default '#F2C14E',
  is_fictional boolean not null default true,
  sort_order int not null default 0
);

-- Check-in codes are secret: no client can read this table directly.
create table public.venue_codes (
  venue_id uuid primary key references public.venues(id) on delete cascade,
  code text not null
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id),
  host_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  note text check (note is null or char_length(note) <= 300),
  starts_at timestamptz not null,
  max_size int not null default 6 check (max_size between 2 and 8),
  status text not null default 'open' check (status in ('open', 'cancelled')),
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);
create index plans_starts_at_idx on public.plans (starts_at);
create index plans_venue_idx on public.plans (venue_id);

create table public.rsvps (
  plan_id uuid not null references public.plans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (plan_id, user_id)
);

create table public.checkins (
  plan_id uuid not null references public.plans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (plan_id, user_id)
);

create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  venue_id uuid not null references public.venues(id),
  discount_pct int not null,
  code text not null,
  local_date date not null,                    -- Copenhagen calendar date
  created_at timestamptz not null default now(),
  unique (plan_id, user_id),
  unique (user_id, venue_id, local_date)       -- max one discount per venue per day
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  reported_user_id uuid references public.profiles(id) on delete set null,
  reason text not null check (reason in ('unsafe', 'inappropriate', 'spam', 'no_show', 'other')),
  details text check (details is null or char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'reviewed')),
  created_at timestamptz not null default now()
);

-- Simple event log used for the user test (what people did and how long it took)
create table public.events (
  id bigint generated always as identity primary key,
  user_id uuid default auth.uid() references public.profiles(id) on delete set null,
  session_id text,
  name text not null check (char_length(name) <= 40),
  plan_id uuid,
  venue_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index events_created_idx on public.events (created_at);

-- ---------- Helpers ----------------------------------------------------

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.copenhagen_date(ts timestamptz default now())
returns date language sql stable as $$
  select (ts at time zone 'Europe/Copenhagen')::date;
$$;

-- New auth user -> profile. 18+ is enforced here, so it cannot be skipped.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce((new.raw_user_meta_data ->> 'over18')::boolean, false) is not true then
    raise exception 'Spotlight is for people aged 18 or over';
  end if;
  insert into public.profiles (id, display_name, confirmed_18)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)), 40),
    true
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Plan rules: host is always the signed-in user, sensible start times,
-- and max 3 upcoming plans per host (limits "thin plans", loop B1).
create or replace function public.before_plan_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- seed_demo_plans() sets spotlight.seeding so sample plans skip these user rules
  if coalesce(current_setting('spotlight.seeding', true), 'off') <> 'on' then
    new.host_id := auth.uid();
    new.status := 'open';
    if new.starts_at < now() - interval '10 minutes' then
      raise exception 'Pick a start time in the future';
    end if;
    if new.starts_at > now() + interval '14 days' then
      raise exception 'Plans can be posted at most 14 days ahead';
    end if;
    if (select count(*) from public.plans
        where host_id = new.host_id and status = 'open'
          and starts_at > now() - interval '2 hours') >= 3 then
      raise exception 'You can host at most 3 upcoming plans at a time';
    end if;
  end if;
  return new;
end $$;

create trigger plans_before_insert
  before insert on public.plans
  for each row execute function public.before_plan_insert();

-- Host automatically "goes" to their own plan
create or replace function public.after_plan_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.rsvps (plan_id, user_id) values (new.id, new.host_id) on conflict do nothing;
  insert into public.events (user_id, name, plan_id, venue_id)
  values (new.host_id, 'plan_posted', new.id, new.venue_id);
  return new;
end $$;

create trigger plans_after_insert
  after insert on public.plans
  for each row execute function public.after_plan_insert();

-- ---------- Row Level Security ---------------------------------------

alter table public.profiles    enable row level security;
alter table public.venues      enable row level security;
alter table public.venue_codes enable row level security;
alter table public.plans       enable row level security;
alter table public.rsvps       enable row level security;
alter table public.checkins    enable row level security;
alter table public.redemptions enable row level security;
alter table public.reports     enable row level security;
alter table public.events      enable row level security;

-- Only the display name can be changed by the user (not is_admin etc.)
revoke update on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;
revoke all on public.venue_codes from anon, authenticated;
revoke update, delete on public.plans, public.rsvps, public.checkins, public.redemptions, public.events from anon, authenticated;
revoke insert on public.rsvps, public.checkins, public.redemptions from anon, authenticated;

create policy "profiles readable by signed-in users" on public.profiles
  for select to authenticated using (true);
create policy "users edit own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "venues are public" on public.venues
  for select to anon, authenticated using (true);

create policy "plans readable by signed-in users" on public.plans
  for select to authenticated using (true);
create policy "signed-in users post plans" on public.plans
  for insert to authenticated with check (host_id = auth.uid());

create policy "rsvps readable by signed-in users" on public.rsvps
  for select to authenticated using (true);
create policy "checkins readable by signed-in users" on public.checkins
  for select to authenticated using (true);

create policy "own redemptions (admin sees all)" on public.redemptions
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy "users file reports" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());
create policy "own reports (admin sees all)" on public.reports
  for select to authenticated using (reporter_id = auth.uid() or public.is_admin());

create policy "users log own events" on public.events
  for insert to authenticated with check (user_id = auth.uid());
create policy "admin reads events" on public.events
  for select to authenticated using (public.is_admin());

-- ---------- Core actions (RPC) ---------------------------------------

create or replace function public.join_plan(p_plan uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v public.plans; v_count int;
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  select * into v from public.plans where id = p_plan for update;
  if not found then raise exception 'Plan not found'; end if;
  if v.status <> 'open' then raise exception 'This plan was cancelled'; end if;
  if now() > v.starts_at + interval '2 hours' then raise exception 'This plan has ended'; end if;
  if exists (select 1 from public.rsvps where plan_id = p_plan and user_id = auth.uid()) then
    return json_build_object('ok', true, 'already', true);
  end if;
  select count(*) into v_count from public.rsvps where plan_id = p_plan;
  if v_count >= v.max_size then raise exception 'This plan is full'; end if;
  insert into public.rsvps (plan_id, user_id) values (p_plan, auth.uid());
  insert into public.events (user_id, name, plan_id, venue_id) values (auth.uid(), 'plan_joined', p_plan, v.venue_id);
  return json_build_object('ok', true, 'going', v_count + 1);
end $$;

create or replace function public.leave_plan(p_plan uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v public.plans;
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  select * into v from public.plans where id = p_plan;
  if not found then raise exception 'Plan not found'; end if;
  if v.host_id = auth.uid() then raise exception 'You are hosting this plan. Cancel it instead.'; end if;
  if exists (select 1 from public.checkins where plan_id = p_plan and user_id = auth.uid()) then
    raise exception 'You have already checked in';
  end if;
  delete from public.rsvps where plan_id = p_plan and user_id = auth.uid();
  insert into public.events (user_id, name, plan_id, venue_id) values (auth.uid(), 'plan_left', p_plan, v.venue_id);
  return json_build_object('ok', true);
end $$;

create or replace function public.cancel_plan(p_plan uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v public.plans;
begin
  select * into v from public.plans where id = p_plan;
  if not found then raise exception 'Plan not found'; end if;
  if v.host_id <> auth.uid() and not public.is_admin() then raise exception 'Only the host can cancel'; end if;
  update public.plans set status = 'cancelled', cancelled_at = now() where id = p_plan;
  insert into public.events (user_id, name, plan_id, venue_id) values (auth.uid(), 'plan_cancelled', p_plan, v.venue_id);
  return json_build_object('ok', true);
end $$;

-- Check in with the venue code. Discount unlocks when 2+ distinct users
-- on the same plan have checked in inside the window
-- [start - 30 min, start + 2 h]. Max one discount per user per venue per day.
create or replace function public.check_in(p_plan uuid, p_code text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v public.plans; vn public.venues; v_code text; v_n int; v_day date;
  r record; v_mine public.redemptions;
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  select * into v from public.plans where id = p_plan for update;
  if not found then raise exception 'Plan not found'; end if;
  if v.status <> 'open' then raise exception 'This plan was cancelled'; end if;
  if not exists (select 1 from public.rsvps where plan_id = p_plan and user_id = auth.uid()) then
    raise exception 'Join the plan before checking in';
  end if;
  if now() < v.starts_at - interval '30 minutes' then
    raise exception 'Check-in opens 30 minutes before the plan starts';
  end if;
  if now() > v.starts_at + interval '2 hours' then raise exception 'This plan has ended'; end if;

  select code into v_code from public.venue_codes where venue_id = v.venue_id;
  if v_code is null or upper(trim(coalesce(p_code, ''))) <> upper(v_code) then
    insert into public.events (user_id, name, plan_id, venue_id, meta)
    values (auth.uid(), 'checkin_failed', p_plan, v.venue_id, jsonb_build_object('reason', 'wrong_code'));
    return json_build_object('ok', false, 'error', 'That code does not match this venue. Ask the staff for the Spotlight code.');
  end if;

  insert into public.checkins (plan_id, user_id) values (p_plan, auth.uid()) on conflict do nothing;
  if found then
    insert into public.events (user_id, name, plan_id, venue_id) values (auth.uid(), 'checked_in', p_plan, v.venue_id);
  end if;

  select count(*) into v_n from public.checkins where plan_id = p_plan;
  select * into vn from public.venues where id = v.venue_id;
  v_day := public.copenhagen_date(now());

  if v_n >= 2 then
    for r in
      select c.user_id from public.checkins c
      where c.plan_id = p_plan
        and not exists (select 1 from public.redemptions x where x.plan_id = p_plan and x.user_id = c.user_id)
    loop
      if exists (select 1 from public.redemptions x
                 where x.user_id = r.user_id and x.venue_id = v.venue_id and x.local_date = v_day) then
        continue; -- already used a discount at this venue today
      end if;
      insert into public.redemptions (plan_id, user_id, venue_id, discount_pct, code, local_date)
      values (p_plan, r.user_id, v.venue_id, vn.discount_pct,
              upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)), v_day);
      insert into public.events (user_id, name, plan_id, venue_id, meta)
      values (r.user_id, 'discount_unlocked', p_plan, v.venue_id, jsonb_build_object('checkins', v_n));
    end loop;
  end if;

  select * into v_mine from public.redemptions where plan_id = p_plan and user_id = auth.uid();
  return json_build_object(
    'ok', true,
    'checked_in', v_n,
    'unlocked', v_mine.id is not null,
    'discount_pct', vn.discount_pct,
    'redemption_code', v_mine.code,
    'daily_limit_reached', (v_n >= 2 and v_mine.id is null)
  );
end $$;

-- ---------- Admin / testing support ----------------------------------

create or replace function public.get_venue_codes()
returns table (venue_id uuid, venue_name text, code text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  return query select v.id, v.name, c.code from public.venues v join public.venue_codes c on c.venue_id = v.id order by v.sort_order;
end $$;

-- Sample plans hosted by fictional seed users, placed relative to "now"
create or replace function public.seed_demo_plans()
returns int language plpgsql security definer set search_path = public as $$
declare
  n int;
  today timestamp := date_trunc('day', now() at time zone 'Europe/Copenhagen');
  soon timestamptz := date_trunc('hour', now()) + interval '2 hours';
begin
  perform set_config('spotlight.seeding', 'on', true);
  insert into public.plans (venue_id, host_id, title, note, starts_at, max_size)
  select v.id, p.id, s.title, s.note, s.starts_at, s.max_size
  from (values
    ('the-corner-pint', 'maya',   'Chelsea vs Arsenal on the big screen', 'I''ll grab a table near the screen. Any team shirt welcome.', soon, 6),
    ('dice-and-dram',   'oliver', 'Catan & chill, beginners welcome',     'Happening now. I''ll explain the rules, promise.', now() - interval '15 minutes', 5),
    ('paper-lantern',   'oliver', 'Ramen and good conversation',         'Cheap, warm and loud. Perfect weeknight dinner.', soon + interval '1 hour', 4),
    ('clay-and-coffee', 'sofie',  'First time on the pottery wheel',     'Nobody here is good at it. That''s the point.', (today + interval '1 day 17 hours') at time zone 'Europe/Copenhagen', 4),
    ('nordlys-art-house','lukas', 'Late opening: new photo exhibition',  'Walk around, then coffee and a chat about what we saw.', (today + interval '1 day 19 hours') at time zone 'Europe/Copenhagen', 6),
    ('boulder-loft',    'maya',   'Bouldering for all levels',           'Shoes can be rented at the desk.', (today + interval '1 day 18 hours') at time zone 'Europe/Copenhagen', 5),
    ('kaelderen-quiz',  'ida',    'Pub quiz team needs more brains',     'We are terrible at sports questions. Help.', (today + interval '2 days 20 hours') at time zone 'Europe/Copenhagen', 6),
    ('jazz-cellar',     'noah',   'Thursday jam session',                'Just listening, no instrument needed.', (today + interval '2 days 21 hours') at time zone 'Europe/Copenhagen', 4),
    ('havn-sauna',      'ida',    'Harbour sauna and a cold dip',        'Bring a towel. Swimwear required.', (today + interval '3 days 8 hours') at time zone 'Europe/Copenhagen', 4),
    ('kanal-kajak',     'sofie',  'Sunset kayak on the canals',          'Double kayaks, so we''ll pair up on the spot.', (today + interval '3 days 16 hours 30 minutes') at time zone 'Europe/Copenhagen', 6)
  ) as s(slug, host, title, note, starts_at, max_size)
  join public.venues v on v.slug = s.slug
  join public.profiles p on p.seed_key = s.host;
  get diagnostics n = row_count;

  insert into public.rsvps (plan_id, user_id)
  select pl.id, p.id
  from (values
    ('Chelsea vs Arsenal on the big screen', 'oliver'),
    ('Chelsea vs Arsenal on the big screen', 'noah'),
    ('Catan & chill, beginners welcome', 'ida'),
    ('First time on the pottery wheel', 'lukas'),
    ('Late opening: new photo exhibition', 'maya'),
    ('Late opening: new photo exhibition', 'sofie'),
    ('Bouldering for all levels', 'noah'),
    ('Pub quiz team needs more brains', 'oliver'),
    ('Harbour sauna and a cold dip', 'maya')
  ) as j(title, who)
  join public.plans pl on pl.title = j.title and pl.status = 'open'
  join public.profiles p on p.seed_key = j.who
  on conflict do nothing;

  -- seed activity is not test data
  delete from public.events where name = 'plan_posted' and user_id in (select id from public.profiles where seed_key is not null);
  perform set_config('spotlight.seeding', 'off', true);
  return n;
end $$;
revoke execute on function public.seed_demo_plans() from anon, authenticated, public;

-- Reset button on the admin page. Keeps the event log unless asked not to.
create or replace function public.reset_demo_data(p_clear_events boolean default false)
returns json language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  delete from public.reports where true;
  delete from public.redemptions where true;
  delete from public.checkins where true;
  delete from public.rsvps where true;
  delete from public.plans where true;
  if p_clear_events then delete from public.events where true; end if;
  n := public.seed_demo_plans();
  insert into public.events (user_id, name, meta) values (auth.uid(), 'data_reset', jsonb_build_object('cleared_events', p_clear_events));
  return json_build_object('ok', true, 'seeded_plans', n);
end $$;

revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- ---------- Realtime (live RSVP counts and check-ins) ----------------

alter publication supabase_realtime add table public.plans, public.rsvps, public.checkins, public.redemptions;
