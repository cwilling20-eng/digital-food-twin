/*
  # Digital Food Twin Database Schema

  1. New Tables
    - `food_items`
      - `id` (uuid, primary key)
      - `name` (text) - Name of the food item
      - `image_url` (text) - URL to food image
      - `tags` (text[]) - Array of descriptive tags
      - `savory_score` (int) - Savory flavor score 0-100
      - `spicy_score` (int) - Spicy flavor score 0-100
      - `fresh_score` (int) - Fresh flavor score 0-100
      - `created_at` (timestamptz)
    
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `onboarding_complete` (boolean) - Whether user completed onboarding
      - `savory_preference` (int) - Calculated savory preference 0-100
      - `spicy_preference` (int) - Calculated spicy preference 0-100
      - `fresh_preference` (int) - Calculated fresh preference 0-100
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `food_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `food_id` (uuid, references food_items)
      - `liked` (boolean) - True if liked, false if disliked
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Food items are readable by all authenticated users
    - User profiles and preferences restricted to owner
*/

-- Create food_items table
CREATE TABLE IF NOT EXISTS food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  savory_score int NOT NULL DEFAULT 50 CHECK (savory_score >= 0 AND savory_score <= 100),
  spicy_score int NOT NULL DEFAULT 50 CHECK (spicy_score >= 0 AND spicy_score <= 100),
  fresh_score int NOT NULL DEFAULT 50 CHECK (fresh_score >= 0 AND fresh_score <= 100),
  created_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_complete boolean DEFAULT false,
  savory_preference int DEFAULT 50 CHECK (savory_preference >= 0 AND savory_preference <= 100),
  spicy_preference int DEFAULT 50 CHECK (spicy_preference >= 0 AND spicy_preference <= 100),
  fresh_preference int DEFAULT 50 CHECK (fresh_preference >= 0 AND fresh_preference <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create food_preferences table
CREATE TABLE IF NOT EXISTS food_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  food_id uuid NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  liked boolean NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, food_id)
);

-- Enable RLS
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_preferences ENABLE ROW LEVEL SECURITY;

-- Food items policies (readable by all authenticated users)
CREATE POLICY "Authenticated users can read food items"
  ON food_items FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- User profiles policies
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Food preferences policies
CREATE POLICY "Users can read own preferences"
  ON food_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON food_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON food_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON food_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert sample food items
INSERT INTO food_items (name, image_url, tags, savory_score, spicy_score, fresh_score) VALUES
  ('Spicy Thai Basil Chicken', 'https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Thai', 'Spicy', 'Aromatic'], 85, 90, 40),
  ('Mediterranean Quinoa Bowl', 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Healthy', 'Fresh', 'Vegetarian'], 45, 15, 95),
  ('BBQ Pulled Pork Sandwich', 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Smoky', 'Hearty', 'American'], 95, 35, 20),
  ('Fresh Poke Bowl', 'https://images.pexels.com/photos/1352270/pexels-photo-1352270.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Hawaiian', 'Raw Fish', 'Light'], 70, 25, 90),
  ('Chicken Tikka Masala', 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Indian', 'Creamy', 'Spiced'], 90, 70, 25),
  ('Garden Fresh Salad', 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Organic', 'Crisp', 'Low-Cal'], 25, 10, 100),
  ('Truffle Mushroom Risotto', 'https://images.pexels.com/photos/6287525/pexels-photo-6287525.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Italian', 'Creamy', 'Umami'], 95, 5, 30),
  ('Korean Fried Chicken', 'https://images.pexels.com/photos/60616/fried-chicken-chicken-fried-crunchy-60616.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Korean', 'Crispy', 'Sweet-Spicy'], 85, 75, 15),
  ('Avocado Toast', 'https://images.pexels.com/photos/1351238/pexels-photo-1351238.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Trendy', 'Healthy', 'Simple'], 40, 15, 85),
  ('Sichuan Mapo Tofu', 'https://images.pexels.com/photos/5773968/pexels-photo-5773968.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Chinese', 'Numbing', 'Bold'], 80, 95, 30),
  ('Grilled Salmon', 'https://images.pexels.com/photos/3655916/pexels-photo-3655916.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Omega-3', 'Protein', 'Clean'], 75, 10, 80),
  ('Margherita Pizza', 'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Italian', 'Classic', 'Cheesy'], 85, 10, 50);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_food_preferences_user_id ON food_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_food_preferences_food_id ON food_preferences(food_id);