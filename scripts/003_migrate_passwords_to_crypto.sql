-- Script để cập nhật password trong database từ bcrypt format sang crypto format
-- Chạy script này sau khi deploy để cập nhật password hiện có

-- Cập nhật admin password (admin123)
UPDATE public.employees 
SET password = 'a1b2c3d4e5f6:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    password_hash = 'a1b2c3d4e5f6:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
WHERE email = 'manager@company.com';

-- Cập nhật employee password (password123)  
UPDATE public.employees 
SET password = 'b2c3d4e5f6a1:5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    password_hash = 'b2c3d4e5f6a1:5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
WHERE email = 'nguyen.van.an@company.com';

-- Cập nhật user kimanh@1 nếu tồn tại (password123)
UPDATE public.employees 
SET password = 'b2c3d4e5f6a1:5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    password_hash = 'b2c3d4e5f6a1:5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
WHERE email = 'kimanh@1';