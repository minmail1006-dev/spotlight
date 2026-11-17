-- Built-in Spotlight avatars: no user photo uploads required.
begin;

alter table public.profiles
  add column if not exists avatar_id text not null default 'spark';

alter table public.profiles
  drop constraint if exists profiles_avatar_id_allowed;
alter table public.profiles
  add constraint profiles_avatar_id_allowed check (avatar_id = any (array[
    'spark','fox','cat','frog','bear','bunny','tiger','panda',
    'alien','robot','ghost','octopus','unicorn','dino','owl','bee',
    'cherry','avocado','mushroom','star','moon','sun','planet','coffee'
  ]::text[]);

create or replace function public.set_avatar(p_avatar_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if p_avatar_id is null or p_avatar_id <> all (array[
    'spark','fox','cat','frog','bear','bunny','tiger','panda',
    'alien','robot','ghost','octopus','unicorn','dino','owl','bee',
    'cherry','avocado','mushroom','star','moon','sun','planet','coffee'
  ]::text[]) then
    raise exception 'Choose an avatar from the Spotlight collection.';
  end if;
  update public.profiles set avatar_id = p_avatar_id where id = auth.uid();
  if not found then raise exception 'Profile not found'; end if;
end;
$$;

revoke all on function public.set_avatar(text) from public, anon;
grant execute on function public.set_avatar(text) to authenticated;

create or replace function public.get_my_profile()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'id', p.id,
    'display_name', p.display_name,
    'username', p.username,
    'username_change_count', p.username_change_count,
    'username_changed_at', p.username_changed_at,
    'avatar_id', p.avatar_id,
    'avatar_path', p.avatar_path,
    'avatar_status', p.avatar_status,
    'is_admin', p.is_admin,
    'is_test_account', p.is_test_account,
    'seed_key', p.seed_key,
    'discoverable', p.discoverable
  )
  from public.profiles p where p.id = auth.uid();
$$;

drop function if exists public.search_lighters(text);
create function public.search_lighters(p_query text default '')
returns table(user_id uuid, display_name text, username text, avatar_path text, avatar_id text)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.display_name, p.username,
         case when p.avatar_status = 'approved' then p.avatar_path else null end,
         p.avatar_id
  from public.profiles p
  where auth.uid() is not null and p.id <> auth.uid()
    and p.discoverable = true and coalesce(p.is_test_account, false) = false
    and length(trim(coalesce(p_query, ''))) >= 2
    and (p.display_name ilike '%' || trim(p_query) || '%'
         or p.username ilike '%' || trim(p_query) || '%')
  order by p.display_name limit 30;
$$;

drop function if exists public.list_amigos();
create function public.list_amigos()
returns table(user_id uuid, display_name text, username text, avatar_path text, avatar_id text)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.display_name, p.username,
         case when p.avatar_status = 'approved' then p.avatar_path else null end,
         p.avatar_id
  from public.amigos a
  join public.profiles p on p.id = case when a.user_low = auth.uid() then a.user_high else a.user_low end
  where auth.uid() is not null and (a.user_low = auth.uid() or a.user_high = auth.uid())
  order by p.display_name;
$$;

drop function if exists public.list_amigo_requests();
create function public.list_amigo_requests()
returns table(request_id uuid, user_id uuid, display_name text, direction text, created_at timestamptz, username text, avatar_path text, avatar_id text)
language sql stable security definer set search_path = ''
as $$
  select r.id, p.id, p.display_name,
         case when r.recipient_id = auth.uid() then 'received' else 'sent' end,
         r.created_at, p.username,
         case when p.avatar_status = 'approved' then p.avatar_path else null end,
         p.avatar_id
  from public.amigo_requests r
  join public.profiles p on p.id = case when r.sender_id = auth.uid() then r.recipient_id else r.sender_id end
  where auth.uid() is not null and r.status = 'pending'
    and (r.sender_id = auth.uid() or r.recipient_id = auth.uid())
  order by r.created_at desc;
$$;

revoke all on function public.search_lighters(text) from public, anon;
revoke all on function public.list_amigos() from public, anon;
revoke all on function public.list_amigo_requests() from public, anon;
grant execute on function public.search_lighters(text) to authenticated;
grant execute on function public.list_amigos() to authenticated;
grant execute on function public.list_amigo_requests() to authenticated;

commit;
