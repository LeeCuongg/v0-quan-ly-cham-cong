-- filepath: c:\Users\admin\Downloads\v0-quan-ly-cham-cong-main\v0-quan-ly-cham-cong-main\scripts\002_add_overtime_columns.sql
-- Add overtime columns to timesheets table
ALTER TABLE public.timesheets 
ADD COLUMN IF NOT EXISTS regular_hours DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS overtime_hours DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS regular_pay DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS overtime_pay DECIMAL(10,2) DEFAULT 0;

-- Add overtime rate to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS overtime_rate DECIMAL(8,2) DEFAULT 1.5; -- Default 1.5x multiplier

-- Create indexes for overtime columns
CREATE INDEX IF NOT EXISTS idx_timesheets_overtime_hours ON public.timesheets(overtime_hours);
CREATE INDEX IF NOT EXISTS idx_timesheets_regular_hours ON public.timesheets(regular_hours);

-- Update existing records to calculate regular and overtime hours (10h per day)
UPDATE public.timesheets 
SET 
    regular_hours = LEAST(total_hours, 10),
    overtime_hours = GREATEST(total_hours - 10, 0)
WHERE regular_hours IS NULL OR regular_hours = 0;

-- Add comment for documentation
COMMENT ON COLUMN public.timesheets.regular_hours IS 'Regular working hours (max 10 hours per day)';
COMMENT ON COLUMN public.timesheets.overtime_hours IS 'Overtime hours (hours exceeding 10 per day)';
COMMENT ON COLUMN public.timesheets.regular_pay IS 'Payment for regular hours';
COMMENT ON COLUMN public.timesheets.overtime_pay IS 'Payment for overtime hours with multiplier';
COMMENT ON COLUMN public.employees.overtime_rate IS 'Overtime rate multiplier (e.g., 1.5 for 150%)';