-- =============================================================================
-- Migration: Drop legacy permissive RLS policies + fix dining_events visibility
-- Date: 2026-07-12 (applied 2026-07-17)
-- Precondition (met 2026-07-17): every n8n workflow reading these tables now
-- uses the service_role credential (bypasses RLS); nothing depends on the
-- permissive policies dropped below.
--
-- Scope (intentionally narrow):
--   1. Drop the ALL-true / true legacy policies on meal_logs and user_profiles
--      so only auth.uid()-scoped policies remain.
--   2. Fix the self-comparison bug in the dining_events SELECT policy.
--   3. Deliberately does NOT touch the five RLS-disabled tables
--      (scans, restaurants, menu_items, generic_menu_items,
--      nutrition_contributions) — handled separately.
-- =============================================================================


-- =============================================================================
-- 1. meal_logs — drop wide-open legacy policies
--    Remaining policies after this block (all scoped to auth.uid() = user_id):
--      "Authenticated users can view/insert/update/delete own meal logs"
--      "Users can view/insert/update/delete own meals"
-- =============================================================================
DROP POLICY IF EXISTS "Allow public access to meal_logs" ON public.meal_logs;  -- ALL,   USING true, CHECK true
DROP POLICY IF EXISTS "Enable insert for public" ON public.meal_logs;          -- INSERT, CHECK true
DROP POLICY IF EXISTS "Enable read for public" ON public.meal_logs;            -- SELECT, USING true


-- =============================================================================
-- 1b. user_profiles — drop wide-open legacy policy and the three inert
--     auth.uid() = id policies (id is a random uuid, never equal to the auth
--     uid, so these grant nothing; dropped per Wayne's decision so only
--     auth.uid() = user_id scoped policies remain).
--     Remaining policies after this block:
--       "Authenticated users can view/insert/update/delete own profile"
--         (auth.uid() = user_id — these are the live, working policies)
-- =============================================================================
DROP POLICY IF EXISTS "Allow public access for MVP" ON public.user_profiles;   -- ALL, USING true, CHECK true
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;    -- SELECT, USING  auth.uid() = id (inert)
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;  -- UPDATE, USING  auth.uid() = id (inert)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;  -- INSERT, CHECK  auth.uid() = id (inert)


-- =============================================================================
-- 2. dining_events — fix participant visibility
--    The live policy's subquery compares dining_event_participants.event_id to
--    dining_event_participants.id (a row can never match itself), so invited
--    participants could never see their events. Recreate with the outer-table
--    reference the original migration intended, using an alias so the
--    correlation is unambiguous.
-- =============================================================================
DROP POLICY IF EXISTS "Users can view own dining events" ON public.dining_events;

CREATE POLICY "Users can view own dining events" ON public.dining_events
  FOR SELECT USING (
    auth.uid() = creator_id
    OR auth.uid() IN (
      SELECT dep.user_id
      FROM public.dining_event_participants dep
      WHERE dep.event_id = dining_events.id
    )
  );
