-- Spotlight + Amigos: restrict profile access and harden privileged functions.
-- Apply only after migrations 001 through 005 have been applied to the intended project.
begin;

-- Browser queries may read only the public identity columns needed by the app.
revoke select on table public.profiles from public, anon, authenticated;
grant select (id, display_name) on table public.profiles to authenticated;

-- Keep profile names available where the existing app displays Plan hosts/attendees.
-- Private profile fields are never exposed through ordinary table selects.
drop policy if exists "profiles readable by signed-in users" on public.profiles;
drop policy if exists "profile names visible on plans" on public.profiles;

create policy "profile names visible on plans"
  on public.profiles
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or (select public.is_admin())
    or exists (
      select 1
      from public.plans p
      where p.host_id = profiles.id
    )
    or exists (
      select 1
      from public.rsvps r
      where r.user_id = profiles.id
    )
  );

-- A signed-in Lighter can retrieve their own complete profile only.
create or replace function public.get_my_profile()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'id', p.id,
    'display_name', p.display_name,
    'is_admin', p.is_admin,
    'is_test_account', p.is_test_account,
    'seed_key', p.seed_key,
    'discoverable', p.discoverable
  )
  from public.profiles p
  where p.id = auth.uid();
$$;

-- Admin-only profile metadata for the existing admin/test dashboard.
create or replace function public.admin_list_profiles()
returns table (
  id uuid,
  display_name text,
  is_admin boolean,
  seed_key text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name, p.is_admin, p.seed_key
  from public.profiles p
  where public.is_admin()
  order by p.display_name;
$$;

revoke all on function public.get_my_profile() from public, anon;
grant execute on function public.get_my_profile() to authenticated;

revoke all on function public.admin_list_profiles() from public, anon;
grant execute on function public.admin_list_profiles() to authenticated;

-- is_admin() is used by authenticated RLS policies and privileged RPCs.
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- All functions below use schema-qualified application/auth objects.
-- PostgreSQL resolves built-in functions from pg_catalog even with an empty
-- search_path; explicitly qualified public/auth references remain available.
alter function public.is_admin() set search_path = '';
alter function public.handle_new_user() set search_path = '';
alter function public.before_plan_insert() set search_path = '';
alter function public.after_plan_insert() set search_path = '';
alter function public.join_plan(uuid) set search_path = '';
alter function public.leave_plan(uuid) set search_path = '';
alter function public.cancel_plan(uuid) set search_path = '';
alter function public.check_in(uuid, text) set search_path = '';
alter function public.get_venue_codes() set search_path = '';
alter function public.seed_demo_plans() set search_path = '';
alter function public.reset_demo_data(boolean) set search_path = '';
alter function public.search_lighters(text) set search_path = '';
alter function public.list_amigos() set search_path = '';
alter function public.list_amigo_requests() set search_path = '';
alter function public.send_amigo_request(uuid) set search_path = '';
alter function public.respond_amigo_request(uuid, boolean) set search_path = '';
alter function public.remove_amigo(uuid) set search_path = '';

commit;
