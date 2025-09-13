-- Script cuối cùng để đảm bảo login hoạt động
-- Đặt lại user để có password plain text và test trước

-- Reset user kimanh@1 về trạng thái plain text
UPDATE public.employees 
SET 
  password_hash = NULL,
  password = '1',
  is_active = true,
  updated_at = NOW()
WHERE email = 'kimanh@1';

-- Kiểm tra user sau khi reset
SELECT 
  '=== USER AFTER RESET ===' as section;

SELECT 
  id,
  name,
  email,
  role,
  is_active,
  password_hash,
  password,
  CASE 
    WHEN password_hash IS NOT NULL THEN 'Will use bcrypt'
    WHEN password IS NOT NULL THEN 'Will use plain text comparison'
    ELSE 'ERROR: No password method'
  END as login_method
FROM public.employees 
WHERE email = 'kimanh@1';

-- Test với một vài employees khác cũng vậy
UPDATE public.employees 
SET 
  password_hash = NULL,
  password = '1',
  is_active = true,
  updated_at = NOW()
WHERE email IN ('Lam', 'Oanh', 'cuong@gmail');

-- Kiểm tra tất cả users
SELECT 
  '=== ALL USERS STATUS ===' as section;

SELECT 
  name,
  email,
  role,
  is_active,
  CASE 
    WHEN password_hash IS NOT NULL THEN '🔐 Bcrypt hash'
    WHEN password IS NOT NULL THEN '📝 Plain text: ' || password
    ELSE '❌ No password'
  END as password_status
FROM public.employees 
WHERE is_active = true
ORDER BY role DESC, name;
