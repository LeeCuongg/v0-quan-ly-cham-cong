-- Insert admin user
INSERT INTO public.employees (id, name, email, hourly_rate, total_hours_this_month, is_currently_working, password_hash, role, is_active, phone)
VALUES (
  'admin-uuid-1234-5678-9012-123456789012',
  'Quản trị viên',
  'admin@company.com',
  0,
  0,
  false,
  '$2b$10$adminHashedPassword',
  'manager',
  true,
  '0900000000'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample employees
INSERT INTO public.employees (id, name, email, hourly_rate, total_hours_this_month, is_currently_working, password_hash, role, is_active, phone)
VALUES 
  ('emp-uuid-1234-5678-9012-123456789001', 'Nguyễn Văn An', 'nguyen.van.an@company.com', 150000, 168, true, '$2b$10$rOzJqQqQqQqQqQgQgQgQgO', 'employee', true, '0901234567'),
  ('emp-uuid-1234-5678-9012-123456789002', 'Trần Thị Bình', 'tran.thi.binh@company.com', 180000, 172, false, '$2b$10$rOzJqQqQqQqQqQgQgQgQgO', 'employee', true, '0901234568'),
  ('emp-uuid-1234-5678-9012-123456789003', 'Lê Minh Cường', 'le.minh.cuong@company.com', 200000, 165, true, '$2b$10$rOzJqQqQqQqQqQgQgQgQgO', 'employee', true, '0901234569'),
  ('emp-uuid-1234-5678-9012-123456789004', 'Phạm Thị Dung', 'pham.thi.dung@company.com', 175000, 170, false, '$2b$10$rOzJqQqQqQqQqQgQgQgQgO', 'employee', true, '0901234570'),
  ('emp-uuid-1234-5678-9012-123456789005', 'Hoàng Văn Em', 'hoang.van.em@company.com', 160000, 168, true, '$2b$10$rOzJqQqQqQqQqQgQgQgQgO', 'employee', true, '0901234571')
ON CONFLICT (email) DO NOTHING;

-- Insert sample timesheets
INSERT INTO public.timesheets (employee_id, date, check_in, check_out, total_hours, salary)
VALUES 
  ('emp-uuid-1234-5678-9012-123456789001', '2024-01-15', '08:00', '17:30', 8.5, 1275000),
  ('emp-uuid-1234-5678-9012-123456789002', '2024-01-15', '08:30', '17:00', 7.5, 1350000),
  ('emp-uuid-1234-5678-9012-123456789003', '2024-01-15', '09:00', '18:00', 8.0, 1600000),
  ('emp-uuid-1234-5678-9012-123456789001', '2024-01-16', '08:15', NULL, 0, 0),
  ('emp-uuid-1234-5678-9012-123456789004', '2024-01-16', '08:00', '16:30', 7.5, 1312500)
ON CONFLICT (employee_id, date) DO NOTHING;
