-- Tạm thời sử dụng cách đơn giản hơn: update lại password plain text
-- và để login route xử lý với fallback logic hiện tại

-- Trước tiên, hãy đặt lại password = "1" và xóa password_hash 
-- để test với fallback logic trong code login

UPDATE public.employees 
SET 
  password_hash = NULL,
  password = '1',
  updated_at = NOW()
WHERE email = 'kimanh@1';

-- Kiểm tra kết quả
SELECT 
  id, 
  name, 
  email, 
  role, 
  is_active,
  password_hash,
  password,
  updated_at
FROM public.employees
WHERE email = 'kimanh@1';