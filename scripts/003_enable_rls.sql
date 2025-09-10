-- Bật Row Level Security cho bảo mật
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;

-- Tạo policy cho employees - admin có thể xem tất cả, employee chỉ xem được thông tin của mình
CREATE POLICY "Employees can view own data" ON employees
  FOR SELECT USING (
    auth.jwt() ->> 'email' = email OR 
    EXISTS (
      SELECT 1 FROM employees 
      WHERE email = auth.jwt() ->> 'email' AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all employees" ON employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE email = auth.jwt() ->> 'email' AND role = 'admin'
    )
  );

-- Tạo policy cho timesheets - admin có thể xem tất cả, employee chỉ xem được của mình
CREATE POLICY "Users can view own timesheets" ON timesheets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = timesheets.employee_id AND email = auth.jwt() ->> 'email'
    ) OR
    EXISTS (
      SELECT 1 FROM employees 
      WHERE email = auth.jwt() ->> 'email' AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all timesheets" ON timesheets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE email = auth.jwt() ->> 'email' AND role = 'admin'
    )
  );

CREATE POLICY "Employees can insert own timesheets" ON timesheets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = timesheets.employee_id AND email = auth.jwt() ->> 'email'
    )
  );
