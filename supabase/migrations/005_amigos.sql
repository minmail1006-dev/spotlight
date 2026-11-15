-- Spotlight + Amigos: opt-in discovery, private requests, and accepted connections.
-- Review copy only. Apply only after confirming the existing Spotlight schema and
-- testing the matching application code. This migration does not alter existing Plans.

begin;

alter table public.profiles
  add column if not exists discoverable boolean not null default false;

grant update (discoverable) on public.profiles to authenticated;

create table if not exists public.amigo_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint amigo_requests_not_self check (sender_id <> recipient_id)
);

-- A pending request is unique for the pair, regardless of who sent it.
-- This closes the race where two users send requests to one another at once.
drop index if exists public.amigo_requests_one_pending_direction;
create unique index if not exists amigo_requests_one_pending_pair
  on public.amigo_requests (
    (least(sender_id, recipient_id)),
    (greatest(sender_id, recipient_id))
  )
  where status = 'pending';

create table if not exists public.amigos (
  user_low uuid not null references public.profiles(id) on delete cascade,
  user_high uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_low, user_high),
  constraint amigos_canonical_pair check (user_low < user_high)
);

alter table public.amigo_requests enable row level security;
alter table public.amigos enable row level security;

drop policy if exists "amigo requests visible to participants" on public.amigo_requests;
create policy "amigo requests visible to participants"
  on public.amigo_requests for select to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());

drop policy if exists "amigos visible to participants" on public.amigos;
create policy "amigos visible to participants"
  on public.amigos for select to authenticated
  using (user_low = auth.uid() or user_high = auth.uid());

revoke all on public.amigo_requests from anon, authenticated;
grant select on public.amigo_requests to authenticated;
revoke all on public.amigos from anon, authenticated;
grant select on public.amigos to authenticated;

create or replace function public.search_lighters(p_query text default '')
returns table(user_id uuid, display_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name
  from public.profiles p
  where auth.uid() is not null
    and p.id <> auth.uid()
    and p.discoverable = true
    and coalesce(p.is_test_account, false) = false
    and length(trim(coalesce(p_query, ''))) >= 2
    and p.display_name ilike '%' || trim(p_query) || '%'
  order by p.display_name
  limit 30;
$$;

create or replace function public.list_amigos()
returns table(user_id uuid, display_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name
  from public.amigos a
  join public.profiles p
    on p.id = case when a.user_low = auth.uid() then a.user_high else a.user_low end
  where auth.uid() is not null
    and (a.user_low = auth.uid() or a.user_high = auth.uid())
  order by p.display_name;
$$;

create or replace function public.list_amigo_requests()
returns table(
  request_id uuid,
  user_id uuid,
  display_name text,
  direction text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id,
         p.id,
         p.display_name,
         case when r.recipient_id = auth.uid() then 'received' else 'sent' end,
         r.created_at
  from public.amigo_requests r
  join public.profiles p
    on p.id = case when r.sender_id = auth.uid() then r.recipient_id else r.sender_id end
  where auth.uid() is not null
    and r.status = 'pending'
    and (r.sender_id = auth.uid() or r.recipient_id = auth.uid())
  order by r.created_at desc;
$$;

create or replace function public.send_amigo_request(p_recipient uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if p_recipient is null or p_recipient = auth.uid() then
    raise exception 'Choose another person';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = p_recipient
      and p.discoverable = true
      and coalesce(p.is_test_account, false) = false
  ) then raise exception 'This Lighter is not available to find'; end if;
  if exists (
    select 1 from public.amigos a
    where a.user_low = least(auth.uid(), p_recipient)
      and a.user_high = greatest(auth.uid(), p_recipient)
  ) then raise exception 'You are already Amigos'; end if;
  if exists (
    select 1 from public.amigo_requests r
    where r.status = 'pending'
      and r.sender_id = p_recipient
      and r.recipient_id = auth.uid()
  ) then raise exception 'They have already sent you a request'; end if;

  insert into public.amigo_requests(sender_id, recipient_id)
  values (auth.uid(), p_recipient)
  on conflict do nothing;
  if not found then raise exception 'A request is already pending'; end if;
end;
$$;

create or replace function public.respond_amigo_request(p_request uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sender uuid;
  v_recipient uuid;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  select sender_id, recipient_id into v_sender, v_recipient
  from public.amigo_requests
  where id = p_request and recipient_id = auth.uid() and status = 'pending'
  for update;
  if not found then raise exception 'Request not found'; end if;

  update public.amigo_requests
  set status = case when p_accept then 'accepted' else 'declined' end,
      updated_at = now()
  where id = p_request;

  if p_accept then
    insert into public.amigos(user_low, user_high)
    values (least(v_sender, v_recipient), greatest(v_sender, v_recipient))
    on conflict do nothing;
  end if;
end;
$$;

create or replace function public.remove_amigo(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  delete from public.amigos
  where user_low = least(auth.uid(), p_user)
    and user_high = greatest(auth.uid(), p_user);
end;
$$;

revoke all on function public.search_lighters(text) from public, anon;
revoke all on function public.list_amigos() from public, anon;
revoke all on function public.list_amigo_requests() from public, anon;
revoke all on function public.send_amigo_request(uuid) from public, anon;
revoke all on function public.respond_amigo_request(uuid, boolean) from public, anon;
revoke all on function public.remove_amigo(uuid) from public, anon;

grant execute on function public.search_lighters(text) to authenticated;
grant execute on function public.list_amigos() to authenticated;
grant execute on function public.list_amigo_requests() to authenticated;
grant execute on function public.send_amigo_request(uuid) to authenticated;
grant execute on function public.respond_amigo_request(uuid, boolean) to authenticated;
grant execute on function public.remove_amigo(uuid) to authenticated;

commit;
