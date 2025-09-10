-- Create employees table
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_hours_this_month DECIMAL(8,2) NOT NULL DEFAULT 0,
  is_currently_working BOOLEAN NOT NULL DEFAULT false,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('employee', 'admin')) DEFAULT 'employee',
  is_active BOOLEAN NOT NULL DEFAULT true,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  password TEXT,
  current_check_in TIMESTAMP WITH TIME ZONE
);

-- Create timesheets table
CREATE TABLE IF NOT EXISTS public.timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in_time TIME NOT NULL,
  check_out_time TIME,
  total_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
  salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  employee_name TEXT,
  hours_worked DECIMAL(8,2),
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  UNIQUE(employee_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

-- Create policies for employees table
CREATE POLICY "employees_select_all" ON public.employees FOR SELECT USING (true);
CREATE POLICY "employees_insert_manager" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "employees_update_manager" ON public.employees FOR UPDATE USING (true);
CREATE POLICY "employees_delete_manager" ON public.employees FOR DELETE USING (true);

-- Create policies for timesheets table  
CREATE POLICY "timesheets_select_all" ON public.timesheets FOR SELECT USING (true);
CREATE POLICY "timesheets_insert_all" ON public.timesheets FOR INSERT WITH CHECK (true);
CREATE POLICY "timesheets_update_all" ON public.timesheets FOR UPDATE USING (true);
CREATE POLICY "timesheets_delete_all" ON public.timesheets FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees(role);
CREATE INDEX IF NOT EXISTS idx_timesheets_employee_id ON public.timesheets(employee_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_date ON public.timesheets(date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON public.timesheets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
