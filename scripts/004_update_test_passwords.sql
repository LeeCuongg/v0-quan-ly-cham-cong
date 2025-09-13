-- Script để thêm user test với password đã hash

-- Hash cho password 'admin123': $2b$10$XaQv5lVHFJ7qzqY8ZXdP0eHJE4HDKpvQGK7XGvPYxvNmQ1xP2iNfe
-- Hash cho password 'password123': $2b$10$1VmRxJhVpKqGx9VqO8YpG1e8P3Ws5qR7UjKdH3LpN9xMzF6tQ8bOiK

-- Update manager user
UPDATE public.employees 
SET 
  password_hash = '$2b$10$XaQv5lVHFJ7qzqY8ZXdP0eHJE4HDKpvQGK7XGvPYxvNmQ1xP2iNfe',
  password = NULL
WHERE email = 'manager@company.com';

-- Update employee users  
UPDATE public.employees 
SET 
  password_hash = '$2b$10$1VmRxJhVpKqGx9VqO8YpG1e8P3Ws5qR7UjKdH3LpN9xMzF6tQ8bOiK',
  password = NULL
WHERE role = 'employee' AND email LIKE '%@company.com';

-- Kiểm tra kết quả
SELECT id, name, email, role, 
       CASE WHEN password_hash IS NOT NULL THEN 'Đã hash' ELSE 'Chưa hash' END as password_status,
       CASE WHEN password IS NOT NULL THEN 'Còn plain text' ELSE 'Đã xóa' END as plain_text_status
FROM public.employees;
