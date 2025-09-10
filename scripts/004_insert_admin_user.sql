-- Xóa dữ liệu cũ nếu có
DELETE FROM timesheets;
DELETE FROM employees;

-- Tạo tài khoản admin
INSERT INTO employees (
    id,
    name,
    email,
    password,
    role,
    hourly_rate,
    is_currently_working,
    total_hours_this_month,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Administrator',
    'admin@company.com',
    'admin123',
    'admin',
    0,
    false,
    0,
    true,
    NOW(),
    NOW()
);

-- Tạo một số nhân viên mẫu
INSERT INTO employees (
    id,
    name,
    email,
    password,
    role,
    hourly_rate,
    is_currently_working,
    total_hours_this_month,
    is_active,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    'Nguyễn Văn A',
    'nva@company.com',
    '123456',
    'employee',
    50000,
    false,
    160,
    true,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Trần Thị B',
    'ttb@company.com',
    '123456',
    'employee',
    45000,
    false,
    155,
    true,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Lê Văn C',
    'lvc@company.com',
    '123456',
    'employee',
    48000,
    false,
    162,
    true,
    NOW(),
    NOW()
);

-- Kiểm tra dữ liệu đã được tạo
SELECT 'Employees created:' as message, count(*) as count FROM employees;
SELECT id, name, email, role FROM employees;
