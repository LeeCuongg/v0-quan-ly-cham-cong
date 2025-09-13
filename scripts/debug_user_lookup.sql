-- Debug script để kiểm tra tình trạng user và password
-- Chạy script này để xem chính xác user có tồn tại và password_hash như thế nào

SELECT 
  '=== USER LOOKUP DEBUG ===' as section;

-- Kiểm tra user kimanh@1 cụ thể
SELECT 
  id,
  name,
  email,
  role,
  is_active,
  password_hash,
  password,
  created_at,
  updated_at
FROM public.employees 
WHERE email = 'kimanh@1';

-- Kiểm tra tất cả users có email tương tự
SELECT 
  '=== SIMILAR EMAILS ===' as section;
  
SELECT 
  id,
  name,
  email,
  role,
  is_active,
  CASE 
    WHEN password_hash IS NOT NULL THEN 'Has hash' 
    ELSE 'No hash' 
  END as hash_status,
  CASE 
    WHEN password IS NOT NULL THEN 'Plain: ' || password 
    ELSE 'No plain text' 
  END as plain_status
FROM public.employees 
WHERE email ILIKE '%kimanh%' OR email ILIKE '%manager%';

-- Kiểm tra tất cả managers
SELECT 
  '=== ALL MANAGERS ===' as section;
  
SELECT 
  id,
  name,
  email,
  role,
  is_active,
  password_hash,
  password
FROM public.employees 
WHERE role = 'manager';

-- Kiểm tra tất cả users active
SELECT 
  '=== ALL ACTIVE USERS ===' as section;
  
SELECT 
  id,
  name,
  email,
  role,
  is_active,
  CASE 
    WHEN password_hash IS NOT NULL THEN '✓ Has hash' 
    ELSE '✗ No hash' 
  END as hash_status,
  CASE 
    WHEN password IS NOT NULL THEN '⚠️ Plain: ' || password 
    ELSE '✓ No plain text' 
  END as plain_status
FROM public.employees 
WHERE is_active = true
ORDER BY role DESC, name;
