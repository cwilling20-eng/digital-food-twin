-- Phase 3.1: Restaurant menu items table
-- Supports optional images uploaded by restaurant owners.
-- Used by ChatResultCard to render image variants of FoodResultCard
-- when a matching menu item with image_url exists.

CREATE TABLE restaurant_menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_name TEXT NOT NULL,
  restaurant_google_place_id TEXT,
  item_name TEXT NOT NULL,
  item_description TEXT,
  image_url TEXT,
  calories INTEGER,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  tags TEXT[],
  uploaded_by UUID REFERENCES auth.users(id),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_menu_items_restaurant ON restaurant_menu_items(restaurant_name);
CREATE INDEX idx_menu_items_place_id ON restaurant_menu_items(restaurant_google_place_id);

-- Enable RLS
ALTER TABLE restaurant_menu_items ENABLE ROW LEVEL SECURITY;

-- Public read access (any authenticated user can browse menu items)
CREATE POLICY "Anyone can read menu items"
  ON restaurant_menu_items FOR SELECT
  USING (true);

-- Only the uploader can insert/update their own items
CREATE POLICY "Users can insert menu items"
  ON restaurant_menu_items FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own menu items"
  ON restaurant_menu_items FOR UPDATE
  USING (auth.uid() = uploaded_by);
