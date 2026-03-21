-- Add quantity, unit, nutrition_source, and per-unit nutrition columns to meal_logs.
-- DO NOT RUN — Wayne will run this manually in the Supabase dashboard.

ALTER TABLE meal_logs ADD COLUMN IF NOT EXISTS quantity NUMERIC(6,2) DEFAULT 1;
ALTER TABLE meal_logs ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'serving';
ALTER TABLE meal_logs ADD COLUMN IF NOT EXISTS nutrition_source TEXT DEFAULT 'estimated';
ALTER TABLE meal_logs ADD COLUMN IF NOT EXISTS per_unit_calories INTEGER;
ALTER TABLE meal_logs ADD COLUMN IF NOT EXISTS per_unit_protein_g REAL;
ALTER TABLE meal_logs ADD COLUMN IF NOT EXISTS per_unit_carbs_g REAL;
ALTER TABLE meal_logs ADD COLUMN IF NOT EXISTS per_unit_fat_g REAL;

COMMENT ON COLUMN meal_logs.quantity IS 'Number of units consumed (e.g., 2 eggs, 1.5 cups)';
COMMENT ON COLUMN meal_logs.unit IS 'Unit of measurement: serving, oz, g, cup, tbsp, piece';
COMMENT ON COLUMN meal_logs.nutrition_source IS 'How nutrition was determined: estimated, manual, or combined';
COMMENT ON COLUMN meal_logs.per_unit_calories IS 'Calories per single unit — allows quantity changes without re-fetching';
COMMENT ON COLUMN meal_logs.per_unit_protein_g IS 'Protein per single unit';
COMMENT ON COLUMN meal_logs.per_unit_carbs_g IS 'Carbs per single unit';
COMMENT ON COLUMN meal_logs.per_unit_fat_g IS 'Fat per single unit';
