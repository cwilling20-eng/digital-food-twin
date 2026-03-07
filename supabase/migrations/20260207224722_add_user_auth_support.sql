/*
  # Add User Authentication Support

  1. Schema Changes
    - Add `user_id` column (uuid, references auth.users) to `user_profiles`
    - Add `user_id` column (uuid, references auth.users) to `meal_logs`
    - Add unique constraint on `user_id` for `user_profiles`
    - Create index on `user_id` for both tables for fast lookups

  2. Security Changes
    - Update RLS policies on `user_profiles` to use auth.uid()
    - Update RLS policies on `meal_logs` to use auth.uid()
    - Authenticated users can only access their own data

  3. Notes
    - Existing device_id columns are preserved for backward compatibility
    - New rows should use user_id going forward
    - Both columns are nullable to support transition period
*/

-- Add user_id to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Add unique constraint on user_id for user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_user_id_unique'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- Add user_id to meal_logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_logs' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE meal_logs ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_id ON meal_logs(user_id);

-- Drop existing RLS policies on user_profiles
DROP POLICY IF EXISTS "Allow all access to user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow device-based profile access" ON user_profiles;
DROP POLICY IF EXISTS "Allow device-based profile creation" ON user_profiles;
DROP POLICY IF EXISTS "Allow device-based profile updates" ON user_profiles;
DROP POLICY IF EXISTS "Allow device-based profile deletion" ON user_profiles;

-- Create new RLS policies for user_profiles
CREATE POLICY "Authenticated users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own profile"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Drop existing RLS policies on meal_logs
DROP POLICY IF EXISTS "Allow all access to meal_logs" ON meal_logs;
DROP POLICY IF EXISTS "Users can view own meal logs" ON meal_logs;
DROP POLICY IF EXISTS "Users can insert meal logs" ON meal_logs;
DROP POLICY IF EXISTS "Users can update own meal logs" ON meal_logs;
DROP POLICY IF EXISTS "Users can delete own meal logs" ON meal_logs;
DROP POLICY IF EXISTS "Allow device-based meal log access" ON meal_logs;
DROP POLICY IF EXISTS "Allow device-based meal log creation" ON meal_logs;
DROP POLICY IF EXISTS "Allow device-based meal log updates" ON meal_logs;

-- Create new RLS policies for meal_logs
CREATE POLICY "Authenticated users can view own meal logs"
  ON meal_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert own meal logs"
  ON meal_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own meal logs"
  ON meal_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own meal logs"
  ON meal_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);