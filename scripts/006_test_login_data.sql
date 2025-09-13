-- Script test login với dữ liệu thực tế sau khi hash password

-- Test data hiện tại:
-- Manager: kimanh@1 / password: 1
-- Employee: Lam / password: 1  
-- Employee: Oanh / password: 1
-- Employee: Cuong (cuong@gmail) / password: 1

-- Trước khi test, chạy script hash password:
-- \i 004_update_test_passwords.sql

-- Sau đó có thể test login với:

/*
POST /api/auth/login
Content-Type: application/json

{
  "email": "kimanh@1",
  "password": "1"
}
*/

-- Hoặc với employees:
/*
POST /api/auth/login
Content-Type: application/json

{
  "email": "cuong@gmail", 
  "password": "1"
}
*/

-- Verify script - kiểm tra dữ liệu đã được hash chưa
SELECT 
  '=== USERS STATUS ===' as info,
  '' as spacer;

SELECT 
  name,
  email,
  role,
  is_active,
  CASE 
    WHEN password_hash IS NOT NULL THEN '✓ Password đã hash' 
    ELSE '✗ Password chưa hash' 
  END as hash_status,
  CASE 
    WHEN password IS NULL THEN '✓ Plain text đã xóa'
    ELSE '⚠️ Còn plain text: ' || password
  END as security_status
FROM public.employees 
WHERE is_active = true
ORDER BY 
  CASE role WHEN 'manager' THEN 1 ELSE 2 END,
  name;

-- Test data summary
SELECT 
  '' as spacer,
  '=== LOGIN TEST INFO ===' as info,
  '' as spacer2;
  
SELECT 
  'Login credentials after migration:' as note,
  '' as spacer;

SELECT 
  name || ' (' || role || ')' as user_info,
  email as login_email,
  '"1"' as login_password,
  CASE 
    WHEN is_active AND password_hash IS NOT NULL THEN '✓ Ready to test'
    ELSE '✗ Not ready'
  END as test_status
FROM public.employees 
WHERE is_active = true
ORDER BY role DESC, name;