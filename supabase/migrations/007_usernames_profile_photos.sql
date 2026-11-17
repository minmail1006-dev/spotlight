-- Spotlight usernames and manually moderated profile photos.
-- Review this migration before applying it to the active Supabase project.
begin;

alter table public.profiles
  add column if not exists username text,
  add column if not exists username_change_count integer not null default 0,
  add column if not exists username_changed_at timestamptz,
  add column if not exists avatar_path text,
  add column if not exists avatar_submitted_at timestamptz,
  add column if not exists avatar_status text not null default 'none'
    check (avatar_status in ('none', 'pending', 'approved', 'rejected'));

-- Give existing accounts stable, unique handles without changing display names.
do $$
declare
  r record;
  base_name text;
  candidate text;
begin
  for r in select id, display_name from public.profiles where username is null order by created_at, id loop
    base_name := lower(trim(both '_' from regexp_replace(coalesce(r.display_name, ''), '[^a-zA-Z0-9]+', '_', 'g')));
    if char_length(base_name) < 3 then base_name := 'user'; end if;
    base_name := left(base_name, 13);
    candidate := base_name;
    if exists (select 1 from public.profiles p where lower(p.username) = candidate) then
      candidate := left(base_name, 11) || '_' || substr(replace(r.id::text, '-', ''), 1, 8);
    end if;
    update public.profiles set username = candidate where id = r.id;
  end loop;
end $$;

alter table public.profiles alter column username set not null;
alter table public.profiles
  add constraint profiles_username_format
  check (username = lower(username) and username ~ '^[a-z0-9_]{3,20}$');
create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username));

create or replace function public.username_is_allowed(p_username text)
returns boolean
language sql immutable
set search_path = ''
as $$
  select coalesce(
    lower(p_username) ~ '^[a-z0-9_]{3,20}$'
    and lower(p_username) <> all (array[
      'admin','administrator','support','spotlight','moderator','staff',
      'fuck','shit','bitch','bastard','asshole','nigger','faggot'
    ]::text[]),
    false
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text := lower(trim(coalesce(new.raw_user_meta_data ->> 'username', '')));
  v_display_name text := left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)), 40);
begin
  if coalesce((new.raw_user_meta_data ->> 'over18')::boolean, false) is not true then
    raise exception 'Spotlight is for people aged 18 or over';
  end if;
  if not public.username_is_allowed(v_username) then
    raise exception 'Choose a username with 3–20 letters, numbers or underscores. That username is not allowed.';
  end if;
  insert into public.profiles (id, display_name, username, confirmed_18)
  values (new.id, v_display_name, v_username, true);
  return new;
end;
$$;

create or replace function public.set_username(p_username text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text := lower(trim(coalesce(p_username, '')));
  v_profile public.profiles%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if not public.username_is_allowed(v_username) then
    raise exception 'Username must be 3–20 characters using letters, numbers or underscores, and must not contain blocked terms.';
  end if;
  select * into v_profile from public.profiles where id = auth.uid() for update;
  if not found then raise exception 'Profile not found'; end if;
  if v_username = v_profile.username then return; end if;
  if v_profile.username_change_count > 0
     and v_profile.username_changed_at > now() - interval '30 days' then
    raise exception 'You can change your username once every 30 days.';
  end if;
  update public.profiles
  set username = v_username,
      username_change_count = username_change_count + 1,
      username_changed_at = now()
  where id = auth.uid();
end;
$$;

-- Users cannot bypass the username RPC or change moderation status directly.
revoke update on public.profiles from public, anon, authenticated;
grant update (display_name, discoverable) on public.profiles to authenticated;
revoke all on function public.username_is_allowed(text) from public, anon, authenticated;
revoke all on function public.set_username(text) from public, anon;
grant execute on function public.set_username(text) to authenticated;

-- Private bucket: new uploads are not readable by other users until approved.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public = false, file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp'];

create or replace function public.can_read_profile_photo(p_path text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select auth.uid() is not null and (
    split_part(p_path, '/', 1) = auth.uid()::text
    or public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.avatar_path = p_path and p.avatar_status = 'approved'
    )
  );
$$;

drop policy if exists "profile photo uploads by owner" on storage.objects;
create policy "profile photo uploads by owner"
on storage.objects for insert to authenticated
with check (bucket_id = 'profile-photos' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "profile photo reads" on storage.objects;
create policy "profile photo reads"
on storage.objects for select to authenticated
using (bucket_id = 'profile-photos' and public.can_read_profile_photo(name));

drop policy if exists "profile photo owner deletes" on storage.objects;
create policy "profile photo owner deletes"
on storage.objects for delete to authenticated
using (bucket_id = 'profile-photos' and split_part(name, '/', 1) = auth.uid()::text);

create or replace function public.submit_profile_photo(p_path text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if p_path is null or split_part(p_path, '/', 1) <> auth.uid()::text
     or p_path !~ '^[0-9a-f-]{36}/[A-Za-z0-9-]+\.(jpg|png|webp)$' then
    raise exception 'Invalid photo path';
  end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = 'profile-photos' and o.name = p_path) then
    raise exception 'Photo upload not found';
  end if;
  update public.profiles set avatar_path = p_path, avatar_submitted_at = now(), avatar_status = 'pending' where id = auth.uid();
end;
$$;

create table if not exists public.profile_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  content_type text not null check (content_type in ('username','photo')),
  reason text not null check (char_length(reason) between 3 and 300),
  status text not null default 'open' check (status in ('open','reviewed')),
  created_at timestamptz not null default now(),
  constraint profile_report_not_self check (reporter_id <> target_user_id)
);
create unique index if not exists profile_one_open_report
  on public.profile_reports (reporter_id, target_user_id, content_type) where status = 'open';
alter table public.profile_reports enable row level security;
revoke all on public.profile_reports from public, anon, authenticated;

create or replace function public.report_profile(p_user uuid, p_content_type text, p_reason text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if p_user is null or p_user = auth.uid() then raise exception 'Invalid profile'; end if;
  if p_content_type not in ('username','photo') then raise exception 'Invalid report type'; end if;
  if length(trim(coalesce(p_reason,''))) < 3 or length(trim(p_reason)) > 300 then
    raise exception 'Please provide a short reason (3–300 characters).';
  end if;
  if not exists (select 1 from public.profiles where id = p_user and (p_content_type = 'username' or avatar_status = 'approved')) then
    raise exception 'This profile content is not available to report.';
  end if;
  insert into public.profile_reports(reporter_id, target_user_id, content_type, reason)
  values (auth.uid(), p_user, p_content_type, trim(p_reason))
  on conflict (reporter_id, target_user_id, content_type) where status = 'open' do nothing;
end;
$$;

create or replace function public.admin_list_profile_reports()
returns table(report_id uuid, user_id uuid, display_name text, username text, content_type text, reason text, reporter_name text, created_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select r.id, p.id, p.display_name, p.username, r.content_type, r.reason, reporter.display_name, r.created_at
  from public.profile_reports r
  join public.profiles p on p.id = r.target_user_id
  join public.profiles reporter on reporter.id = r.reporter_id
  where public.is_admin() and r.status = 'open'
  order by r.created_at desc;
$$;

create or replace function public.resolve_profile_report(p_report uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  update public.profile_reports set status = 'reviewed' where id = p_report and status = 'open';
end;
$$;

create or replace function public.admin_list_pending_photos()
returns table(user_id uuid, display_name text, username text, avatar_path text, submitted_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.display_name, p.username, p.avatar_path, p.avatar_submitted_at
  from public.profiles p
  where public.is_admin() and p.avatar_status = 'pending' and p.avatar_path is not null
  order by p.avatar_submitted_at;
$$;

create or replace function public.review_profile_photo(p_user uuid, p_approve boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  update public.profiles
  set avatar_status = case when p_approve then 'approved' else 'rejected' end
  where id = p_user and avatar_status = 'pending';
  if not found then raise exception 'Pending photo not found'; end if;
end;
$$;

revoke all on function public.can_read_profile_photo(text) from public, anon;
revoke all on function public.submit_profile_photo(text) from public, anon;
revoke all on function public.report_profile(uuid,text,text) from public, anon;
revoke all on function public.admin_list_pending_photos() from public, anon;
revoke all on function public.admin_list_profile_reports() from public, anon;
revoke all on function public.review_profile_photo(uuid,boolean) from public, anon;
revoke all on function public.resolve_profile_report(uuid) from public, anon;
grant execute on function public.can_read_profile_photo(text) to authenticated;
grant execute on function public.submit_profile_photo(text) to authenticated;
grant execute on function public.report_profile(uuid,text,text) to authenticated;
grant execute on function public.admin_list_pending_photos() to authenticated;
grant execute on function public.admin_list_profile_reports() to authenticated;
grant execute on function public.review_profile_photo(uuid,boolean) to authenticated;
grant execute on function public.resolve_profile_report(uuid) to authenticated;

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
returns table(user_id uuid, display_name text, username text, avatar_path text)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.display_name, p.username,
         case when p.avatar_status = 'approved' then p.avatar_path else null end
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
returns table(user_id uuid, display_name text, username text, avatar_path text)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.display_name, p.username,
         case when p.avatar_status = 'approved' then p.avatar_path else null end
  from public.amigos a
  join public.profiles p on p.id = case when a.user_low = auth.uid() then a.user_high else a.user_low end
  where auth.uid() is not null and (a.user_low = auth.uid() or a.user_high = auth.uid())
  order by p.display_name;
$$;

drop function if exists public.list_amigo_requests();
create function public.list_amigo_requests()
returns table(request_id uuid, user_id uuid, display_name text, direction text, created_at timestamptz, username text, avatar_path text)
language sql stable security definer set search_path = ''
as $$
  select r.id, p.id, p.display_name,
         case when r.recipient_id = auth.uid() then 'received' else 'sent' end,
         r.created_at, p.username,
         case when p.avatar_status = 'approved' then p.avatar_path else null end
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
