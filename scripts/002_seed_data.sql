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
  'a1b2c3d4e5f6:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  'a1b2c3d4e5f6:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  'manager',
  true,
  '0900000000'
)
ON CONFLICT (email) DO UPDATE SET 
  role = 'manager',
  password = 'a1b2c3d4e5f6:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';

-- Insert sample employees
INSERT INTO public.employees (
  id, name, email, hourly_rate, total_hours_this_month, 
  is_currently_working, password_hash, password, role, 
  is_active, phone
) VALUES 
  (gen_random_uuid(), 'Nguyễn Văn An', 'nguyen.van.an@company.com', 150000, 168, true, 'b2c3d4e5f6a1:5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'b2c3d4e5f6a1:5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'employee', true, '0901234567')
ON CONFLICT (email) DO UPDATE SET 
  password = 'b2c3d4e5f6a1:5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';

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
