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
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- bcrypt hash của 'admin123'
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
  'manager',
  true,
  '0900000000'
)
ON CONFLICT (email) DO UPDATE SET 
  role = 'manager',
  password = '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW';

-- Insert sample employees
INSERT INTO public.employees (
  id, name, email, hourly_rate, total_hours_this_month, 
  is_currently_working, password_hash, password, role, 
  is_active, phone
) VALUES 
  (gen_random_uuid(), 'Nguyễn Văn An', 'nguyen.van.an@company.com', 150000, 168, true, '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employee', true, '0901234567')
ON CONFLICT (email) DO UPDATE SET 
  password = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

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
