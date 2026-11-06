-- =====================================================================
-- Run AFTER the accounts have been created (see scripts/create-accounts.mjs
-- or the Supabase dashboard > Authentication > Add user).
--   seed.<name>@spotlight.test  fictional hosts behind the sample plans
--   <name>@spotlight.test       test accounts for the user tests
--   admin@spotlight.test        admin (reset button, stats, venue codes)
-- =====================================================================

update public.profiles p
set seed_key = split_part(split_part(u.email, '@', 1), '.', 2), is_test_account = true
from auth.users u
where u.id = p.id and u.email like 'seed.%@spotlight.test';

update public.profiles p
set is_test_account = true
from auth.users u
where u.id = p.id and u.email like '%@spotlight.test';

update public.profiles p
set is_admin = true
from auth.users u
where u.id = p.id and u.email = 'admin@spotlight.test';

select public.seed_demo_plans();
