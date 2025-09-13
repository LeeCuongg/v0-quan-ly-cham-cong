# Migration Script - Password Hashing

## Tổng quan
Các script này giúp chuyển đổi password từ plain text sang bcrypt hash để đảm bảo bảo mật.

## Files

### 1. `003_hash_passwords.js` (Recommended)
Script Node.js để hash tất cả password plain text trong database.

**Yêu cầu:**
- Cấu hình environment variables:
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  ```

**Chạy:**
```bash
cd scripts
node 003_hash_passwords.js
```

### 2. `003_hash_passwords.sql`
Script SQL với một số hash mẫu (chỉ dùng để test).

### 3. `004_update_test_passwords.sql`
Script để update password cho test users với hash đã tính sẵn:
- `admin123` -> `$2b$10$XaQv5lVHFJ7qzqY8ZXdP0eHJE4HDKpvQGK7XGvPYxvNmQ1xP2iNfe`
- `password123` -> `$2b$10$1VmRxJhVpKqGx9VqO8YpG1e8P3Ws5qR7UjKdH3LpN9xMzF6tQ8bOiK`

### 4. `hash-password.js`
Utility để hash password từ command line:

```bash
node scripts/hash-password.js "your-password"
```

## Thay đổi trong code

### Trước (Login Route):
```javascript
// So sánh trực tiếp với cột password (chỉ để test)
const isValidPassword = password === user.password
```

### Sau (Login Route):
```javascript
// Sử dụng bcrypt để verify password với password_hash
const hashedPassword = user.password_hash || user.password
const isValidPassword = await verifyPassword(password, hashedPassword)
```

## Test Users
Sau khi chạy migration, có thể test với:

**Manager:**
- Email: `manager@company.com`
- Password: `admin123`

**Employee:**
- Email: `nguyen.van.an@company.com` 
- Password: `password123`

## Lưu ý bảo mật
- Luôn hash password trước khi lưu vào database
- Không bao giờ lưu plain text password trong production
- Sử dụng bcrypt với salt rounds >= 10
- Xóa cột `password` plain text sau khi migration hoàn tất