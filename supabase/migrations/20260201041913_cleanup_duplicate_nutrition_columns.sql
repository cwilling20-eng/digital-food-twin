/*
  # Cleanup Duplicate Nutrition Columns

  1. Schema Changes
    - Remove old nutrition columns that are no longer used:
      - Drop `calories` (replaced by `estimated_calories`)
      - Drop `protein` (replaced by `protein_g`)
      - Drop `carbs` (replaced by `carbs_g`)
      - Drop `fat` (replaced by `fat_g`)
    - Update `meal_type` constraint to accept lowercase values

  2. Benefits
    - Eliminates duplicate columns
    - Clarifies which nutrition fields are active
    - Standardizes meal_type format to lowercase

  3. Notes
    - New nutrition fields (estimated_calories, protein_g, etc.) are already in place
    - This migration removes legacy columns only
*/

-- Drop old nutrition columns if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meal_logs' AND column_name = 'calories') THEN
    ALTER TABLE meal_logs DROP COLUMN calories;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meal_logs' AND column_name = 'protein') THEN
    ALTER TABLE meal_logs DROP COLUMN protein;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meal_logs' AND column_name = 'carbs') THEN
    ALTER TABLE meal_logs DROP COLUMN carbs;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meal_logs' AND column_name = 'fat') THEN
    ALTER TABLE meal_logs DROP COLUMN fat;
  END IF;
END $$;

-- Update meal_type constraint to accept lowercase values
DO $$
BEGIN
  ALTER TABLE meal_logs DROP CONSTRAINT IF EXISTS meal_logs_meal_type_check;
  ALTER TABLE meal_logs ADD CONSTRAINT meal_logs_meal_type_check 
    CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'Breakfast', 'Lunch', 'Dinner', 'Snack'));
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;