-- Tạo admin user
INSERT INTO public.employees (
  id, name, email, hourly_rate, total_hours_this_month, 
  is_currently_working, password_hash, password, role, 
  is_active, phone
) VALUES (
  gen_random_uuid(),
  'Quản trị viên',
  'manager@company.com',
  0,
  0,
  false,
  '$2b$10$adminHashedPassword', -- bcrypt hash mẫu
  'admin123',
  'manager',
  true,
  '0900000000'
)
ON CONFLICT (email) DO UPDATE SET 
  role = 'manager',
  password = 'manager123';

-- Insert sample employees
INSERT INTO public.employees (
  id, name, email, hourly_rate, total_hours_this_month, 
  is_currently_working, password_hash, password, role, 
  is_active, phone
) VALUES 
  (gen_random_uuid(), 'Nguyễn Văn An', 'nguyen.van.an@company.com', 150000, 168, true,  '$2b$10$rOzJqQqQqQqQqQgQgQgQgO', 'password123', 'employee', true, '0901234567')
ON CONFLICT (email) DO UPDATE SET 
  password = 'password123';

-- Update existing timesheets to fill employee_name (nếu thiếu)
UPDATE public.timesheets t
SET employee_name = e.name
FROM public.employees e
WHERE t.employee_id = e.id
  AND t.employee_name IS NULL;

-- Insert additional sample timesheets
INSERT INTO public.timesheets (
  id, employee_id, employee_name, date, 
  check_in, check_out, check_in_time, check_out_time,
  hours_worked, salary
)
SELECT 
  gen_random_uuid(),
  e.id,
  e.name,
  CURRENT_DATE - INTERVAL '1 day',
  (CURRENT_DATE - INTERVAL '1 day' + TIME '08:00:00'),
  (CURRENT_DATE - INTERVAL '1 day' + TIME '17:00:00'),
  (CURRENT_DATE - INTERVAL '1 day' + TIME '08:00:00'),
  (CURRENT_DATE - INTERVAL '1 day' + TIME '17:00:00'),
  8.0,
  e.hourly_rate * 8
FROM public.employees e 
WHERE e.role = 'employee'
ON CONFLICT (employee_id, date) DO NOTHING;
