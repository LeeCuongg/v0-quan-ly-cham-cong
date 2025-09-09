# Hướng dẫn thiết lập Database MongoDB

## Bước 1: Chuẩn bị môi trường

1. **Tạo file .env.local** từ .env.example:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

2. **Cập nhật MONGODB_URI** trong .env.local:
   - **Local MongoDB**: `mongodb://localhost:27017/quan-ly-cham-cong`
   - **MongoDB Atlas**: `mongodb+srv://username:password@cluster.mongodb.net/quan-ly-cham-cong`

## Bước 2: Thiết lập Database

Chạy script tự động thiết lập database:

\`\`\`bash
npm run db:setup
\`\`\`

Script này sẽ:
- ✅ Tạo database `quan-ly-cham-cong`
- ✅ Tạo collections: `employees`, `timesheets`
- ✅ Thiết lập validation schema
- ✅ Tạo indexes để tối ưu hiệu suất
- ✅ Thêm dữ liệu mẫu (5 nhân viên + 1 admin)

## Bước 3: Tài khoản mặc định

Sau khi chạy script, bạn có thể đăng nhập với:

**Admin Account:**
- Email: `admin@company.com`
- Password: `admin123`

**Employee Accounts:**
- `hoa.tran@company.com` / `password123`
- `nam.le@company.com` / `password123`
- `lan.pham@company.com` / `password123`
- `duc.hoang@company.com` / `password123`

## Bước 4: Khởi động ứng dụng

\`\`\`bash
npm run dev
\`\`\`

Truy cập: http://localhost:3000

## Cấu trúc Database

### Collection: employees
\`\`\`javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  role: String, // 'admin' | 'employee'
  department: String,
  salary: Number,
  avatar: String,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

### Collection: timesheets
\`\`\`javascript
{
  _id: ObjectId,
  employeeId: String,
  date: Date,
  checkIn: Date,
  checkOut: Date,
  hoursWorked: Number,
  overtime: Number,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

## Troubleshooting

### Lỗi kết nối MongoDB
- Kiểm tra MongoDB service đang chạy
- Xác nhận MONGODB_URI trong .env.local
- Đảm bảo network access (với MongoDB Atlas)

### Lỗi authentication
- Kiểm tra JWT_SECRET trong .env.local
- Xóa cookies và thử đăng nhập lại

### Reset database
\`\`\`bash
# Xóa toàn bộ dữ liệu và tạo lại
npm run db:setup
