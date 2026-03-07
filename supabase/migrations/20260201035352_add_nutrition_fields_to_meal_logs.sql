/*
  # Add Nutrition Fields and Meal Type to Meal Logs

  1. Schema Changes
    - Add nutrition fields to `meal_logs` table:
      - `calories` (numeric, nullable) - Estimated calories for the meal
      - `protein` (numeric, nullable) - Estimated protein in grams
      - `carbs` (numeric, nullable) - Estimated carbohydrates in grams
      - `fat` (numeric, nullable) - Estimated fat in grams
      - `meal_type` (text) - Type of meal: Breakfast, Lunch, Dinner, or Snack
  
  2. Benefits
    - Enables automatic nutrition tracking through AI estimation
    - Provides structured meal categorization for better analytics
    - Supports meal planning and daily nutrition summaries
  
  3. Notes
    - Nutrition values are nullable to support manual logging without estimation
    - meal_type helps organize meals by time of day
    - All nutrition values are estimates from AI, not verified nutritional data
*/

-- Add nutrition fields to meal_logs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_logs' AND column_name = 'calories'
  ) THEN
    ALTER TABLE meal_logs ADD COLUMN calories numeric(6,1);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_logs' AND column_name = 'protein'
  ) THEN
    ALTER TABLE meal_logs ADD COLUMN protein numeric(5,1);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_logs' AND column_name = 'carbs'
  ) THEN
    ALTER TABLE meal_logs ADD COLUMN carbs numeric(5,1);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_logs' AND column_name = 'fat'
  ) THEN
    ALTER TABLE meal_logs ADD COLUMN fat numeric(5,1);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_logs' AND column_name = 'meal_type'
  ) THEN
    ALTER TABLE meal_logs ADD COLUMN meal_type text DEFAULT 'Snack' CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack'));
  END IF;
END $$;