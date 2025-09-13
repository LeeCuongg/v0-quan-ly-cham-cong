-- Script để hash password cho dữ liệu hiện tại trong bảng employees
-- Tất cả user hiện tại đều có password = "1"
-- Hash của password "1" (bcrypt): $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

-- Update tất cả users với password_hash cho password "1"
UPDATE public.employees 
SET 
  password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  password = NULL,
  updated_at = NOW()
WHERE password = '1' AND password_hash IS NULL;

-- Kiểm tra kết quả update
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
    ELSE 'Còn plain text ✗' 
  END as plain_text_status,
  updated_at
FROM public.employees 
ORDER BY role DESC, name;

-- Optional: Thêm constraint để đảm bảo password_hash luôn có giá trị
-- ALTER TABLE public.employees 
-- ALTER COLUMN password_hash SET NOT NULL;

-- Optional: Xóa hoàn toàn cột password (backup trước khi chạy)
-- ALTER TABLE public.employees DROP COLUMN IF EXISTS password;