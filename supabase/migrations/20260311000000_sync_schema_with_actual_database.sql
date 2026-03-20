-- =============================================================================
-- Migration: Sync migration files with actual database state
-- Date: 2026-03-11
-- Purpose: The app was built iteratively in Bolt with many manual DB changes
--          that were never captured in migration files. This migration brings
--          the migration history in sync with reality so the schema can be
--          recreated from migrations alone.
--
-- IMPORTANT: This migration is IDEMPOTENT. Every statement uses
--            IF NOT EXISTS / IF EXISTS guards so it is safe to run against
--            both a fresh database AND the current production database.
-- =============================================================================


-- =============================================================================
-- 1. FIX food_items — add missing columns the code expects
-- =============================================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'food_items' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.food_items ADD COLUMN image_url text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'food_items' AND column_name = 'tags'
  ) THEN
    ALTER TABLE public.food_items ADD COLUMN tags text[] NOT NULL DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'food_items' AND column_name = 'savory_score'
  ) THEN
    ALTER TABLE public.food_items ADD COLUMN savory_score integer NOT NULL DEFAULT 50;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'food_items' AND column_name = 'spicy_score'
  ) THEN
    ALTER TABLE public.food_items ADD COLUMN spicy_score integer NOT NULL DEFAULT 50;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'food_items' AND column_name = 'fresh_score'
  ) THEN
    ALTER TABLE public.food_items ADD COLUMN fresh_score integer NOT NULL DEFAULT 50;
  END IF;
END $$;


-- =============================================================================
-- 2. FIX meal_logs — add nutrition columns that migration 6 dropped but the
--    DB was manually patched to re-add. Also make device_id nullable.
-- =============================================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meal_logs' AND column_name = 'estimated_calories'
  ) THEN
    ALTER TABLE public.meal_logs ADD COLUMN estimated_calories integer DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meal_logs' AND column_name = 'protein_g'
  ) THEN
    ALTER TABLE public.meal_logs ADD COLUMN protein_g real;
    COMMENT ON COLUMN public.meal_logs.protein_g IS 'Estimated protein in grams';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meal_logs' AND column_name = 'carbs_g'
  ) THEN
    ALTER TABLE public.meal_logs ADD COLUMN carbs_g real;
    COMMENT ON COLUMN public.meal_logs.carbs_g IS 'Estimated carbohydrates in grams';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meal_logs' AND column_name = 'fat_g'
  ) THEN
    ALTER TABLE public.meal_logs ADD COLUMN fat_g real;
    COMMENT ON COLUMN public.meal_logs.fat_g IS 'Estimated fat in grams';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meal_logs' AND column_name = 'fiber_g'
  ) THEN
    ALTER TABLE public.meal_logs ADD COLUMN fiber_g real;
    COMMENT ON COLUMN public.meal_logs.fiber_g IS 'Estimated fiber in grams';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meal_logs' AND column_name = 'sugar_g'
  ) THEN
    ALTER TABLE public.meal_logs ADD COLUMN sugar_g real;
    COMMENT ON COLUMN public.meal_logs.sugar_g IS 'Estimated sugar in grams';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meal_logs' AND column_name = 'sodium_mg'
  ) THEN
    ALTER TABLE public.meal_logs ADD COLUMN sodium_mg real;
    COMMENT ON COLUMN public.meal_logs.sodium_mg IS 'Estimated sodium in milligrams';
  END IF;
END $$;

-- Make device_id nullable (code no longer provides it after auth migration)
ALTER TABLE public.meal_logs ALTER COLUMN device_id DROP NOT NULL;


-- =============================================================================
-- 3. FIX user_profiles — add nutrition goal columns and daily_calorie_target
-- =============================================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'daily_calorie_target'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN daily_calorie_target integer DEFAULT 2000;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'calorie_goal'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN calorie_goal integer DEFAULT 2000;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'protein_goal'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN protein_goal integer DEFAULT 150;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'carbs_goal'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN carbs_goal integer DEFAULT 200;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'fat_goal'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN fat_goal integer DEFAULT 65;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'water_goal'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN water_goal integer DEFAULT 8;
  END IF;
END $$;


-- =============================================================================
-- 4. CREATE missing tables that exist in DB but have no migration
-- =============================================================================

-- 4a. water_logs
CREATE TABLE IF NOT EXISTS public.water_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  cups integer DEFAULT 1,
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'water_logs' AND policyname = 'Users can view own water logs'
  ) THEN
    CREATE POLICY "Users can view own water logs" ON public.water_logs
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'water_logs' AND policyname = 'Users can insert own water logs'
  ) THEN
    CREATE POLICY "Users can insert own water logs" ON public.water_logs
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'water_logs' AND policyname = 'Users can delete own water logs'
  ) THEN
    CREATE POLICY "Users can delete own water logs" ON public.water_logs
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;


-- 4b. user_dietary_constraints
CREATE TABLE IF NOT EXISTS public.user_dietary_constraints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id),
  allergies text[] DEFAULT '{}',
  sensitivities text[] DEFAULT '{}',
  restrictions text[] DEFAULT '{}',
  health_goals text[] DEFAULT '{}',
  never_eat text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_dietary_constraints ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_dietary_constraints' AND policyname = 'Users can manage own dietary constraints'
  ) THEN
    CREATE POLICY "Users can manage own dietary constraints" ON public.user_dietary_constraints
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;


-- 4c. user_flavor_profile
CREATE TABLE IF NOT EXISTS public.user_flavor_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id),
  sweet_preference integer DEFAULT 5,
  salty_preference integer DEFAULT 5,
  sour_preference integer DEFAULT 5,
  bitter_preference integer DEFAULT 5,
  umami_preference integer DEFAULT 5,
  spicy_preference integer DEFAULT 5,
  breakfast_heaviness integer DEFAULT 5,
  lunch_heaviness integer DEFAULT 5,
  dinner_heaviness integer DEFAULT 5,
  preferred_textures text[] DEFAULT '{}',
  disliked_textures text[] DEFAULT '{}',
  likes_hot_food boolean DEFAULT true,
  likes_cold_food boolean DEFAULT true,
  likes_room_temp boolean DEFAULT true,
  adventurous_eater integer DEFAULT 5,
  presentation_matters integer DEFAULT 5,
  portion_preference text DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_flavor_profile ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_flavor_profile' AND policyname = 'Users can manage own flavor profile'
  ) THEN
    CREATE POLICY "Users can manage own flavor profile" ON public.user_flavor_profile
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;


-- 4d. user_meal_favorites
CREATE TABLE IF NOT EXISTS public.user_meal_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  meal_type text NOT NULL,
  food_items text[] DEFAULT '{}',
  cuisine_preferences text[] DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, meal_type)
);

ALTER TABLE public.user_meal_favorites ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_meal_favorites' AND policyname = 'Users can manage own meal favorites'
  ) THEN
    CREATE POLICY "Users can manage own meal favorites" ON public.user_meal_favorites
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;


-- 4e. user_cuisine_preferences
CREATE TABLE IF NOT EXISTS public.user_cuisine_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  cuisine_type text NOT NULL,
  favorite_dishes text[] DEFAULT '{}',
  favorite_proteins text[] DEFAULT '{}',
  favorite_preparations text[] DEFAULT '{}',
  spice_level integer DEFAULT 5,
  flavor_notes text[] DEFAULT '{}',
  avoid_items text[] DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  adventure_level integer DEFAULT 5,
  style_preferences text[] DEFAULT '{}',
  extra_preferences jsonb DEFAULT '{}',
  UNIQUE(user_id, cuisine_type)
);

ALTER TABLE public.user_cuisine_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_cuisine_preferences' AND policyname = 'Users can manage own cuisine preferences'
  ) THEN
    CREATE POLICY "Users can manage own cuisine preferences" ON public.user_cuisine_preferences
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;


-- 4f. user_public_profiles
CREATE TABLE IF NOT EXISTS public.user_public_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text UNIQUE,
  display_name text,
  avatar_url text,
  share_food_dna boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_public_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_public_profiles' AND policyname = 'Public profiles are viewable by authenticated users'
  ) THEN
    CREATE POLICY "Public profiles are viewable by authenticated users" ON public.user_public_profiles
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_public_profiles' AND policyname = 'Users can update own public profile'
  ) THEN
    CREATE POLICY "Users can update own public profile" ON public.user_public_profiles
      FOR ALL USING (auth.uid() = id);
  END IF;
END $$;


-- 4g. user_friends
CREATE TABLE IF NOT EXISTS public.user_friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  friend_id uuid REFERENCES auth.users(id),
  status text DEFAULT 'pending',
  requested_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE(user_id, friend_id)
);

ALTER TABLE public.user_friends ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_friends' AND policyname = 'Users can view own friendships'
  ) THEN
    CREATE POLICY "Users can view own friendships" ON public.user_friends
      FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_friends' AND policyname = 'Users can manage own friend requests'
  ) THEN
    CREATE POLICY "Users can manage own friend requests" ON public.user_friends
      FOR ALL USING (auth.uid() = user_id OR auth.uid() = friend_id);
  END IF;
END $$;


-- 4h. dining_events
CREATE TABLE IF NOT EXISTS public.dining_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES auth.users(id),
  title text,
  meal_type text,
  cuisine_preference text,
  planned_date date,
  planned_time time,
  location_lat numeric,
  location_long numeric,
  location_name text,
  selected_restaurant_id text,
  selected_restaurant_name text,
  status text DEFAULT 'planning',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.dining_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dining_events' AND policyname = 'Users can create dining events'
  ) THEN
    CREATE POLICY "Users can create dining events" ON public.dining_events
      FOR INSERT WITH CHECK (auth.uid() = creator_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dining_events' AND policyname = 'Users can view own dining events'
  ) THEN
    CREATE POLICY "Users can view own dining events" ON public.dining_events
      FOR SELECT USING (
        auth.uid() = creator_id
        OR auth.uid() IN (
          SELECT user_id FROM public.dining_event_participants
          WHERE event_id = dining_events.id
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dining_events' AND policyname = 'Creators can update own events'
  ) THEN
    CREATE POLICY "Creators can update own events" ON public.dining_events
      FOR UPDATE USING (auth.uid() = creator_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dining_events' AND policyname = 'Creators can delete own events'
  ) THEN
    CREATE POLICY "Creators can delete own events" ON public.dining_events
      FOR DELETE USING (auth.uid() = creator_id);
  END IF;
END $$;


-- 4i. dining_event_participants
CREATE TABLE IF NOT EXISTS public.dining_event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.dining_events(id),
  user_id uuid REFERENCES auth.users(id),
  status text DEFAULT 'invited',
  responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.dining_event_participants ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dining_event_participants' AND policyname = 'Users can view event participants'
  ) THEN
    CREATE POLICY "Users can view event participants" ON public.dining_event_participants
      FOR SELECT USING (
        auth.uid() = user_id
        OR auth.uid() IN (
          SELECT creator_id FROM public.dining_events
          WHERE id = dining_event_participants.event_id
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dining_event_participants' AND policyname = 'Event creators can manage participants'
  ) THEN
    CREATE POLICY "Event creators can manage participants" ON public.dining_event_participants
      FOR ALL USING (
        auth.uid() IN (
          SELECT creator_id FROM public.dining_events
          WHERE id = dining_event_participants.event_id
        )
        OR auth.uid() = user_id
      );
  END IF;
END $$;


-- 4j. restaurants (exists in DB, not referenced by app code, but needed for FK)
CREATE TABLE IF NOT EXISTS public.restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  city text,
  state text,
  google_place_id text UNIQUE,
  lat numeric,
  long numeric,
  cuisine_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);


-- 4k. menu_items (exists in DB, not referenced by app code, but needed for FK)
CREATE TABLE IF NOT EXISTS public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES public.restaurants(id),
  name text NOT NULL,
  name_normalized text,
  description text,
  category text,
  calories integer,
  protein_g real,
  carbs_g real,
  fat_g real,
  fiber_g real,
  sugar_g real,
  sodium_mg real,
  confidence text DEFAULT 'low' CHECK (confidence IN ('low', 'medium', 'high', 'verified')),
  confidence_score numeric DEFAULT 0,
  verification_count integer DEFAULT 1,
  source text DEFAULT 'ai',
  source_details jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(restaurant_id, name_normalized)
);


-- 4l. generic_menu_items (exists in DB, not referenced by app code)
CREATE TABLE IF NOT EXISTS public.generic_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_normalized text UNIQUE,
  description text,
  cuisine_type text,
  calories integer,
  protein_g real,
  carbs_g real,
  fat_g real,
  fiber_g real,
  sugar_g real,
  sodium_mg real,
  calories_min integer,
  calories_max integer,
  confidence text DEFAULT 'low' CHECK (confidence IN ('low', 'medium', 'high', 'verified')),
  verification_count integer DEFAULT 1,
  source text DEFAULT 'ai',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);


-- 4m. nutrition_contributions (exists in DB, not referenced by app code)
CREATE TABLE IF NOT EXISTS public.nutrition_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES public.menu_items(id),
  generic_item_id uuid REFERENCES public.generic_menu_items(id),
  device_id text NOT NULL,
  meal_name text NOT NULL,
  restaurant_name text,
  calories integer,
  protein_g real,
  carbs_g real,
  fat_g real,
  feeling text,
  portion_feedback text,
  estimate_source text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);


-- 4n. scans (exists in DB, not referenced by app code directly)
CREATE TABLE IF NOT EXISTS public.scans (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  ai_response jsonb
);

-- scans insert policy
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scans' AND policyname = 'Enable insert for everyone'
  ) THEN
    CREATE POLICY "Enable insert for everyone" ON public.scans
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;


-- =============================================================================
-- 5. INDEXES for performance (match what exists in production DB)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_id ON public.meal_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_created_at ON public.meal_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_id ON public.water_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_logged_at ON public.water_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_user_friends_user_id ON public.user_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_friend_id ON public.user_friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_dining_events_creator_id ON public.dining_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_dining_events_planned_date ON public.dining_events(planned_date);
CREATE INDEX IF NOT EXISTS idx_user_dietary_constraints_user_id ON public.user_dietary_constraints(user_id);
CREATE INDEX IF NOT EXISTS idx_user_flavor_profile_user_id ON public.user_flavor_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_user_meal_favorites_user_id ON public.user_meal_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cuisine_preferences_user_id ON public.user_cuisine_preferences(user_id);
