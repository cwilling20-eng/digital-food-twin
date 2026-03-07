/*
  # Add Favorite Foods to User Profiles

  1. Changes
    - Add `favorite_foods` column to `user_profiles` table
      - Type: text[] (array of strings)
      - Default: empty array
      - Purpose: Store user's favorite foods for AI recommendations
  
  2. Notes
    - This allows the AI to prioritize these items when analyzing menus
    - Stored as an array for flexible querying and filtering
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'favorite_foods'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN favorite_foods text[] DEFAULT '{}';
  END IF;
END $$;