-- Migration: Allow multiple check-ins per day
-- Drop the unique constraint that prevents multiple check-ins per employee per day

-- Remove existing constraint
ALTER TABLE timesheets DROP CONSTRAINT IF EXISTS timesheets_employee_id_date_key;

-- Add session_id column if it doesn't exist
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Create new constraint that allows multiple check-ins but prevents exact duplicates
ALTER TABLE timesheets ADD CONSTRAINT timesheets_employee_session_unique 
UNIQUE (employee_id, date, check_in_time, session_id);

-- Add index for better performance on queries
CREATE INDEX IF NOT EXISTS idx_timesheets_employee_date 
ON timesheets (employee_id, date);

-- Add index for session queries
CREATE INDEX IF NOT EXISTS idx_timesheets_session 
ON timesheets (employee_id, session_id);
