/*
  # Add body metrics and weight plan columns to user_profiles

  1. New Columns on `user_profiles`
    - `starting_weight` (numeric) - starting weight in lbs
    - `current_weight` (numeric) - current weight in lbs
    - `goal_weight` (numeric) - target weight in lbs
    - `height_inches` (integer) - total height in inches
    - `birth_date` (date) - user birth date for age calculation
    - `gender` (text) - male/female/other for BMR calculation
    - `weekly_weight_goal` (numeric) - lbs per week change (negative = loss)
    - `activity_level` (text) - sedentary/lightly_active/moderately_active/very_active/extremely_active
    - `use_custom_goals` (boolean) - whether user overrides calculated goals

  2. Important Notes
    - All columns nullable so existing profiles remain valid
    - use_custom_goals defaults to true to preserve existing manual goal behavior
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'starting_weight'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN starting_weight numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'current_weight'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN current_weight numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'goal_weight'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN goal_weight numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'height_inches'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN height_inches integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN birth_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'gender'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN gender text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'weekly_weight_goal'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN weekly_weight_goal numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'activity_level'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN activity_level text DEFAULT 'sedentary';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'use_custom_goals'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN use_custom_goals boolean DEFAULT true;
  END IF;
END $$;
