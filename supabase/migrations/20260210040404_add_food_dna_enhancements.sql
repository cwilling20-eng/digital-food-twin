/*
  # Food DNA Hub Database Enhancements

  1. New Tables
    - `user_food_dislikes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `disliked_foods` (text array) - specific foods user dislikes
      - `avoid_ingredients` (text array) - ingredients to always avoid
      - `created_at` / `updated_at` timestamps

  2. Table Modifications
    - `user_cuisine_preferences` - add fields for cuisine-specific data:
      - `adventure_level` (integer 1-10) - how adventurous for this cuisine
      - `style_preferences` (text array) - e.g., for sushi: nigiri, sashimi, maki
      - `extra_preferences` (jsonb) - cuisine-specific extra data

  3. Security
    - Enable RLS on user_food_dislikes
    - Add policies for authenticated users to manage their own data
*/

-- Create user_food_dislikes table
CREATE TABLE IF NOT EXISTS user_food_dislikes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  disliked_foods text[] DEFAULT '{}',
  avoid_ingredients text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_food_dislikes_user_id_unique UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE user_food_dislikes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_food_dislikes
CREATE POLICY "Users can read own food dislikes"
  ON user_food_dislikes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food dislikes"
  ON user_food_dislikes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food dislikes"
  ON user_food_dislikes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own food dislikes"
  ON user_food_dislikes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add additional columns to user_cuisine_preferences if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_cuisine_preferences' AND column_name = 'adventure_level'
  ) THEN
    ALTER TABLE user_cuisine_preferences ADD COLUMN adventure_level integer DEFAULT 5;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_cuisine_preferences' AND column_name = 'style_preferences'
  ) THEN
    ALTER TABLE user_cuisine_preferences ADD COLUMN style_preferences text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_cuisine_preferences' AND column_name = 'extra_preferences'
  ) THEN
    ALTER TABLE user_cuisine_preferences ADD COLUMN extra_preferences jsonb DEFAULT '{}';
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_food_dislikes_user_id ON user_food_dislikes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dietary_constraints_user_id ON user_dietary_constraints(user_id);
CREATE INDEX IF NOT EXISTS idx_user_flavor_profile_user_id ON user_flavor_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_user_meal_favorites_user_id ON user_meal_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cuisine_preferences_user_id ON user_cuisine_preferences(user_id);
