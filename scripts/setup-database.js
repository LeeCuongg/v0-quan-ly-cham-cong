import { MongoClient } from "mongodb"
import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })

const MONGODB_URI = process.env.MONGODB_URI
const DATABASE_NAME = "quan-ly-cham-cong"

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI không được tìm thấy trong .env.local")
  process.exit(1)
}

async function setupDatabase() {
  const client = new MongoClient(MONGODB_URI)

  try {
    console.log("🔄 Đang kết nối đến MongoDB...")
    await client.connect()

    const db = client.db(DATABASE_NAME)

    // Tạo collections với validation schema
    console.log("📝 Tạo collection employees...")
    try {
      await db.createCollection("employees", {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["name", "email", "role", "department", "salary"],
            properties: {
              name: { bsonType: "string" },
              email: { bsonType: "string" },
              role: { bsonType: "string" },
              department: { bsonType: "string" },
              salary: { bsonType: "number" },
              avatar: { bsonType: "string" },
              createdAt: { bsonType: "date" },
              updatedAt: { bsonType: "date" },
            },
          },
        },
      })
      console.log("✅ Collection employees đã được tạo")
    } catch (error) {
      if (error.codeName === "NamespaceExists") {
        console.log("ℹ️  Collection employees đã tồn tại")
      } else {
        throw error
      }
    }

    console.log("📝 Tạo collection timesheets...")
    try {
      await db.createCollection("timesheets", {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["employeeId", "date"],
            properties: {
              employeeId: { bsonType: "string" },
              date: { bsonType: "date" },
              checkIn: { bsonType: "date" },
              checkOut: { bsonType: "date" },
              hoursWorked: { bsonType: "number" },
              overtime: { bsonType: "number" },
              createdAt: { bsonType: "date" },
              updatedAt: { bsonType: "date" },
            },
          },
        },
      })
      console.log("✅ Collection timesheets đã được tạo")
    } catch (error) {
      if (error.codeName === "NamespaceExists") {
        console.log("ℹ️  Collection timesheets đã tồn tại")
      } else {
        throw error
      }
    }

    // Tạo indexes để tối ưu hiệu suất
    console.log("🔍 Tạo indexes...")

    // Index cho employees
    await db.collection("employees").createIndex({ email: 1 }, { unique: true })
    await db.collection("employees").createIndex({ department: 1 })

    // Index cho timesheets
    await db.collection("timesheets").createIndex({ employeeId: 1, date: 1 }, { unique: true })
    await db.collection("timesheets").createIndex({ date: 1 })
    await db.collection("timesheets").createIndex({ employeeId: 1 })

    console.log("✅ Indexes đã được tạo")

    // Kiểm tra xem đã có dữ liệu chưa
    const employeeCount = await db.collection("employees").countDocuments()

    if (employeeCount === 0) {
      console.log("📊 Khởi tạo dữ liệu mẫu...")

      // Tạo dữ liệu mẫu
      const sampleEmployees = [
        {
          name: "Nguyễn Văn Admin",
          email: "admin@company.com",
          role: "admin",
          department: "Quản lý",
          salary: 20000000,
          avatar: "/placeholder.svg?height=40&width=40",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Trần Thị Hoa",
          email: "hoa.tran@company.com",
          role: "employee",
          department: "Nhân sự",
          salary: 12000000,
          avatar: "/placeholder.svg?height=40&width=40",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Lê Văn Nam",
          email: "nam.le@company.com",
          role: "employee",
          department: "Kỹ thuật",
          salary: 15000000,
          avatar: "/placeholder.svg?height=40&width=40",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Phạm Thị Lan",
          email: "lan.pham@company.com",
          role: "employee",
          department: "Marketing",
          salary: 11000000,
          avatar: "/placeholder.svg?height=40&width=40",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Hoàng Văn Đức",
          email: "duc.hoang@company.com",
          role: "employee",
          department: "Kế toán",
          salary: 13000000,
          avatar: "/placeholder.svg?height=40&width=40",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      await db.collection("employees").insertMany(sampleEmployees)
      console.log("✅ Đã thêm dữ liệu mẫu cho employees")

      // Tạo một số timesheet mẫu cho hôm nay
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const employees = await db.collection("employees").find({}).toArray()
      const sampleTimesheets = []

      for (const employee of employees.slice(1)) {
        // Bỏ qua admin
        const checkIn = new Date(today)
        checkIn.setHours(8, Math.floor(Math.random() * 30)) // 8:00-8:30

        sampleTimesheets.push({
          employeeId: employee._id.toString(),
          date: today,
          checkIn: checkIn,
          hoursWorked: 0,
          overtime: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      if (sampleTimesheets.length > 0) {
        await db.collection("timesheets").insertMany(sampleTimesheets)
        console.log("✅ Đã thêm dữ liệu mẫu cho timesheets")
      }
    } else {
      console.log("ℹ️  Database đã có dữ liệu, bỏ qua việc khởi tạo dữ liệu mẫu")
    }

    console.log("🎉 Database đã được thiết lập thành công!")
    console.log(`📊 Database name: ${DATABASE_NAME}`)
    console.log("📋 Collections: employees, timesheets")
    console.log("🔐 Tài khoản admin: admin@company.com / password: admin123")
  } catch (error) {
    console.error("❌ Lỗi khi thiết lập database:", error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

setupDatabase()
