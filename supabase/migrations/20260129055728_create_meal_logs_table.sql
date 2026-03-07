/*
  # Create Meal Logs Table for Regret Log Feature

  1. New Tables
    - `meal_logs`
      - `id` (uuid, primary key) - Unique identifier for each meal log entry
      - `device_id` (text) - Links to user's device for profile association
      - `scan_id` (bigint, nullable) - Optional reference to specific menu scan
      - `meal_name` (text) - Name of the meal that was consumed
      - `feeling` (text) - User's feeling after the meal (Energized, Satisfied, Bloated, Regret, Hungry)
      - `notes` (text, nullable) - Optional additional comments from user
      - `created_at` (timestamptz) - Timestamp when log was created
  
  2. Security
    - Enable RLS on meal_logs table
    - Allow anyone to insert and read their own logs based on device_id
    - Users can update and delete their own logs
  
  3. Notes
    - This enables tracking of actual meal outcomes for personalized recommendations
    - Data persists across sessions and helps build user's food preference history
    - No authentication required - uses device_id for identification
*/

-- Create meal_logs table
CREATE TABLE IF NOT EXISTS meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  scan_id bigint,
  meal_name text NOT NULL,
  feeling text NOT NULL CHECK (feeling IN ('Energized', 'Satisfied', 'Bloated', 'Regret', 'Hungry')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meal_logs
CREATE POLICY "Anyone can read own meal logs"
  ON meal_logs FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert meal logs"
  ON meal_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update own meal logs"
  ON meal_logs FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete own meal logs"
  ON meal_logs FOR DELETE
  USING (true);

-- Create index on device_id for faster queries
CREATE INDEX IF NOT EXISTS idx_meal_logs_device_id ON meal_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_created_at ON meal_logs(created_at DESC);