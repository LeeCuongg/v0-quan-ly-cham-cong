const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

// Sample data from the original database.ts
const sampleEmployees = [
  {
    name: "Nguyễn Văn An",
    email: "nguyen.van.an@company.com",
    hourlyRate: 150000,
    totalHoursThisMonth: 168,
    isCurrentlyWorking: true,
    password: "emp123",
    role: "employee",
    isActive: true,
    phone: "0901234567",
  },
  {
    name: "Trần Thị Bình",
    email: "tran.thi.binh@company.com",
    hourlyRate: 180000,
    totalHoursThisMonth: 172,
    isCurrentlyWorking: false,
    password: "emp123",
    role: "employee",
    isActive: true,
    phone: "0901234568",
  },
  {
    name: "Lê Minh Cường",
    email: "le.minh.cuong@company.com",
    hourlyRate: 200000,
    totalHoursThisMonth: 165,
    isCurrentlyWorking: true,
    password: "emp123",
    role: "employee",
    isActive: true,
    phone: "0901234569",
  },
  {
    name: "Phạm Thị Dung",
    email: "pham.thi.dung@company.com",
    hourlyRate: 175000,
    totalHoursThisMonth: 170,
    isCurrentlyWorking: false,
    password: "emp123",
    role: "employee",
    isActive: true,
    phone: "0901234570",
  },
  {
    name: "Hoàng Văn Em",
    email: "hoang.van.em@company.com",
    hourlyRate: 160000,
    totalHoursThisMonth: 168,
    isCurrentlyWorking: true,
    password: "emp123",
    role: "employee",
    isActive: true,
    phone: "0901234571",
  },
]

const adminUser = {
  name: "Quản trị viên",
  email: "admin@company.com",
  hourlyRate: 0,
  totalHoursThisMonth: 0,
  isCurrentlyWorking: false,
  password: "admin123",
  role: "manager",
  isActive: true,
  phone: "0900000000",
}

async function migrateData() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/timesheet-management"
    await mongoose.connect(MONGODB_URI)

    console.log("Connected to MongoDB")

    // Define schemas
    const EmployeeSchema = new mongoose.Schema(
      {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        hourlyRate: { type: Number, required: true },
        totalHoursThisMonth: { type: Number, default: 0 },
        isCurrentlyWorking: { type: Boolean, default: false },
        password: { type: String, required: true },
        role: { type: String, enum: ["employee", "manager"], default: "employee" },
        isActive: { type: Boolean, default: true },
        phone: String,
      },
      { timestamps: true },
    )

    const Employee = mongoose.models.Employee || mongoose.model("Employee", EmployeeSchema)

    // Clear existing data
    await Employee.deleteMany({})
    console.log("Cleared existing employee data")

    // Migrate admin user
    const hashedAdminPassword = await bcrypt.hash(adminUser.password, 10)
    const admin = new Employee({
      ...adminUser,
      password: hashedAdminPassword,
      email: adminUser.email.toLowerCase(),
    })
    await admin.save()
    console.log("Migrated admin user")

    // Migrate employees
    for (const emp of sampleEmployees) {
      const hashedPassword = await bcrypt.hash(emp.password, 10)
      const employee = new Employee({
        ...emp,
        password: hashedPassword,
        email: emp.email.toLowerCase(),
      })
      await employee.save()
      console.log(`Migrated employee: ${emp.name}`)
    }

    console.log("Migration completed successfully!")
  } catch (error) {
    console.error("Migration failed:", error)
  } finally {
    await mongoose.disconnect()
  }
}

migrateData()
