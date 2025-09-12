-- Cập nhật dữ liệu mẫu với role 'admin' và password field
-- Insert admin user
INSERT INTO public.employees (id, name, email, hourly_rate, total_hours_this_month, is_currently_working, password_hash, password, role, is_active, phone)
VALUES (
  'admin-uuid-1234-5678-9012-123456789012',
  'Quản trị viên',
  'admin@company.com',
  0,
  0,
  false,
  '$2b$10$adminHashedPassword',
  'admin123',
  'admin',
  true,
  '0900000000'
) ON CONFLICT (email) DO UPDATE SET 
  role = 'admin',
  password = 'admin123';

-- Cập nhật nhân viên mẫu với password field
-- Insert sample employees
INSERT INTO public.employees (id, name, email, hourly_rate, total_hours_this_month, is_currently_working, password_hash, password, role, is_active, phone)
VALUES 
  ('emp-uuid-1234-5678-9012-123456789001', 'Nguyễn Văn An', 'nguyen.van.an@company.com', 150000, 168, true, '$2b$10$rOzJqQqQqQqQqQgQgQgQgO', 'password123', 'employee', true, '0901234567'),
  ('emp-uuid-1234-5678-9012-123456789002', 'Trần Thị Bình', 'tran.thi.binh@company.com', 180000, 172, false, '$2b$10$rOzJqQqQqQqQqQgQgQgQgO', 'password123', 'employee', true, '0901234568'),
  ('emp-uuid-1234-5678-9012-123456789003', 'Lê Minh Cường', 'le.minh.cuong@company.com', 200000, 165, true, '$2b$10$rOzJqQqQqQqQqQgQgQgQgO', 'password123', 'employee', true, '0901234569'),
  ('emp-uuid-1234-5678-9012-123456789004', 'Phạm Thị Dung', 'pham.thi.dung@company.com', 175000, 170, false, '$2b$10$rOzJqQqQqQqQqQgQgQgQgO', 'password123', 'employee', true, '0901234570'),
  ('emp-uuid-1234-5678-9012-123456789005', 'Hoàng Văn Em', 'hoang.van.em@company.com', 160000, 168, true, '$2b$10$rOzJqQqQqQqQqQgQgQgQgO', 'password123', 'employee', true, '0901234571')
ON CONFLICT (email) DO UPDATE SET 
  password = 'password123';

-- Cập nhật dữ liệu timesheets với employee_name và cấu trúc mới
-- Update existing timesheets with employee names
UPDATE public.timesheets SET employee_name = (
  SELECT name FROM public.employees WHERE id = timesheets.employee_id
) WHERE employee_name IS NULL;

-- Insert additional sample timesheets with proper structure
INSERT INTO public.timesheets (employee_id, employee_name, date, check_in, check_out, hours_worked, salary)
SELECT 
  e.id,
  e.name,
  CURRENT_DATE - INTERVAL '1 day',
  CURRENT_DATE - INTERVAL '1 day' + TIME '08:00:00',
  CURRENT_DATE - INTERVAL '1 day' + TIME '17:00:00',
  8.0,
  e.hourly_rate * 8
FROM public.employees e 
WHERE e.role = 'employee'
ON CONFLICT (employee_id, date) DO NOTHING;
