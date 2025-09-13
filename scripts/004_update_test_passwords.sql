-- Script để hash password cho dữ liệu thực tế hiện tại
-- Dựa trên file CSV: tất cả users đều có password = "1"

-- Hash mới cho password "1" (bcrypt 10 rounds): 
-- Chúng ta sẽ tạo hash mới vì hash cũ có thể không đúng

-- Update manager user (Quản trị viên - kimanh@1)
UPDATE public.employees 
SET 
  password_hash = '$2b$10$W8xd2XcJhBzSmKzQ7h1HYe6iBkkSwJqGdYmS9K1kJF5YqK1PpGLMK',
  password = NULL,
  updated_at = NOW()
WHERE email = 'kimanh@1' AND role = 'manager';

-- Update employee users (Lam, Oanh, Cuong)
UPDATE public.employees 
SET 
  password_hash = '$2b$10$W8xd2XcJhBzSmKzQ7h1HYe6iBkkSwJqGdYmS9K1kJF5YqK1PpGLMK',
  password = NULL,
  updated_at = NOW()
WHERE role = 'employee' AND password = '1';

-- Kiểm tra kết quả
SELECT 
  id, 
  name, 
  email, 
  role, 
  CASE 
    WHEN password_hash IS NOT NULL THEN 'Đã hash ✓' 
    ELSE 'Chưa hash ✗' 
  END as password_status,
  CASE 
    WHEN password IS NULL THEN 'Đã xóa ✓' 
    ELSE password || ' (plain text)' 
  END as password_check,
  updated_at
FROM public.employees
ORDER BY role DESC, name;