-- =============================================================================
-- 0003_bootstrap_admin.sql — grant yourself admin rights
--
-- Run this last, and only after creating your user.
--
-- Steps:
--   1. Supabase dashboard → Authentication → Providers → Email:
--        - Email provider: enabled
--        - "Confirm email": off is fine for a single operator account
--   2. Authentication → Providers → disable "Allow new users to sign up".
--      There is no registration screen in the app, but this closes signup at
--      the API level too, which is where it actually matters.
--   3. Authentication → Users → "Add user" → set your email and password.
--   4. Replace the address below and run this file.
--
-- Without a row in `admins` the account can sign in but every write is refused
-- by RLS, and the admin UI will say so rather than failing silently.
-- =============================================================================

insert into public.admins (user_id, email)
select id, email
from auth.users
where email = 'you@example.com'   -- ← change this
on conflict (user_id) do nothing;

-- Confirm it worked. Expect exactly one row.
select a.email, a.created_at from public.admins a;
