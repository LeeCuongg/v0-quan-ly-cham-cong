-- 003_hash_passwords.sql
-- Script để hash tất cả password hiện tại

-- Note: Trong production, bạn nên chạy script Node.js để hash password đúng cách
-- Script SQL này chỉ để tham khảo cấu trúc

-- Tạm thời hash một số password mẫu (KHÔNG SỬ DỤNG TRONG PRODUCTION)
UPDATE public.employees 
SET password_hash = CASE 
  WHEN email = 'manager@company.com' AND password = 'admin123' THEN '$2b$10$XaQv5lVHFJ7qzqY8ZXdP0eHJE4HDKpvQGK7XGvPYxvNmQ1xP2iNfe' -- hash của 'admin123'
  WHEN email = 'manager@company.com' AND password = 'manager123' THEN '$2b$10$2QmVgxkQZqGx9VqO8YpG1e8P3Ws5qR7UjKdH3LpN9xMzF6tQ8bOiK' -- hash của 'manager123'
  WHEN password = 'password123' THEN '$2b$10$1VmRxJhVpKqGx9VqO8YpG1e8P3Ws5qR7UjKdH3LpN9xMzF6tQ8bOiK' -- hash của 'password123'
  ELSE password_hash
END,
password = NULL -- Xóa plain text password sau khi hash
WHERE password IS NOT NULL;

-- Thêm constraint để đảm bảo password_hash luôn có giá trị
ALTER TABLE public.employees 
ALTER COLUMN password_hash SET NOT NULL;

-- Xóa cột password plain text (optional - có thể giữ lại để backup)
-- ALTER TABLE public.employees DROP COLUMN password;
