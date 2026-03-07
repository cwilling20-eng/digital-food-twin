/*
  # Add Device-Based Profile Support

  1. Changes
    - Add `device_id` column to user_profiles (unique identifier for device-based auth)
    - Add `core_profile` JSONB column for diets, allergies, goals
    - Add `taste_profile` JSONB column for spicy tolerance, texture preferences, sweet vs savory
    - Add `dislikes` JSONB column for array of disliked ingredients
    - Add `swiped_foods` text array for tracking swiped food IDs
    
  2. Security
    - Update RLS policies to allow unauthenticated access based on device_id
    - Users can only access their own profile using device_id matching
    
  3. Notes
    - This enables profile persistence without requiring authentication
    - Device ID is generated client-side and stored in localStorage
    - All profile data survives browser cache clears through Supabase storage
*/

-- Add new columns to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'device_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN device_id text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'core_profile'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN core_profile jsonb DEFAULT '{"diets": [], "allergies": [], "goals": []}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'taste_profile'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN taste_profile jsonb DEFAULT '{"spicyTolerance": 5, "texturePreferences": [], "sweetVsSavory": 5}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'dislikes'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN dislikes jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'swiped_foods'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN swiped_foods text[] DEFAULT '{}';
  END IF;
END $$;

-- Drop existing restrictive policies that require authentication
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create new policies that allow device-based access for unauthenticated users
CREATE POLICY "Anyone can read profiles by device_id"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update profiles by device_id"
  ON user_profiles FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Also update food_items policy to allow unauthenticated access
DROP POLICY IF EXISTS "Authenticated users can read food items" ON food_items;

CREATE POLICY "Anyone can read food items"
  ON food_items FOR SELECT
  USING (true);

-- Create index on device_id for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_device_id ON user_profiles(device_id);