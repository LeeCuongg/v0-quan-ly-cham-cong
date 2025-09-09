import connectDB from "./mongodb"
import Employee, { type IEmployee } from "./models/Employee"
import Timesheet, { type ITimesheet } from "./models/Timesheet"
import bcrypt from "bcryptjs"

// Connect to database
export async function initializeDB() {
  console.log("[v0] 🚀 Khởi tạo database...")
  await connectDB()
  console.log("[v0] ✅ Database đã sẵn sàng!")
}

// Employee operations
export async function findUserByEmail(email: string): Promise<IEmployee | null> {
  console.log("[v0] 🔍 Tìm user theo email:", email)
  await connectDB()
  const user = await Employee.findOne({ email: email.toLowerCase(), isActive: true }).exec()
  console.log("[v0] 📊 Kết quả tìm user:", user ? "Tìm thấy" : "Không tìm thấy")
  return user
}

export async function findUserById(id: string): Promise<IEmployee | null> {
  console.log("[v0] 🔍 Tìm user theo ID:", id)
  await connectDB()
  const user = await Employee.findById(id).exec()
  console.log("[v0] 📊 Kết quả tìm user:", user ? "Tìm thấy" : "Không tìm thấy")
  return user
}

export async function createUser(userData: {
  name: string
  email: string
  password: string
  hourlyRate: number
  role?: "employee" | "manager"
  phone?: string
}): Promise<IEmployee> {
  console.log("[v0] ➕ Tạo user mới:", userData.name, userData.email)
  await connectDB()

  // Hash password
  console.log("[v0] 🔐 Đang hash password...")
  const hashedPassword = await bcrypt.hash(userData.password, 10)

  const newEmployee = new Employee({
    ...userData,
    password: hashedPassword,
    email: userData.email.toLowerCase(),
  })

  const savedEmployee = await newEmployee.save()
  console.log("[v0] ✅ Tạo user thành công với ID:", savedEmployee._id)
  return savedEmployee
}

export async function updateUser(id: string, updates: Partial<IEmployee>): Promise<IEmployee | null> {
  await connectDB()

  // Hash password if provided
  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 10)
  }

  return await Employee.findByIdAndUpdate(id, updates, { new: true }).exec()
}

export async function deleteUser(id: string): Promise<boolean> {
  await connectDB()
  const result = await Employee.findByIdAndUpdate(id, { isActive: false }, { new: true }).exec()
  return !!result
}

export async function getAllEmployees(): Promise<IEmployee[]> {
  await connectDB()
  return await Employee.find({ isActive: true }).exec()
}

// Employee management functions as aliases and new functions
export async function getEmployeeById(id: string): Promise<IEmployee | null> {
  return await findUserById(id)
}

export async function createEmployee(employeeData: {
  name: string
  email: string
  password: string
  hourlyRate: number
  role?: "employee" | "manager"
  phone?: string
}): Promise<IEmployee> {
  return await createUser(employeeData)
}

export async function getEmployeeByEmail(email: string): Promise<IEmployee | null> {
  return await findUserByEmail(email)
}

export async function updateEmployee(id: string, updates: Partial<IEmployee>): Promise<IEmployee | null> {
  return await updateUser(id, updates)
}

export async function deleteEmployee(id: string): Promise<boolean> {
  return await deleteUser(id)
}

// Timesheet operations
export async function createTimesheet(timesheetData: {
  employeeId: string
  employeeName: string
  date: Date
  checkIn: string
  checkOut?: string | null
  totalHours?: number
  salary?: number
}): Promise<ITimesheet> {
  console.log("[v0] ⏰ Tạo timesheet mới cho:", timesheetData.employeeName, "ngày:", timesheetData.date)
  await connectDB()

  const timesheet = new Timesheet(timesheetData)
  const savedTimesheet = await timesheet.save()
  console.log("[v0] ✅ Tạo timesheet thành công với ID:", savedTimesheet._id)
  return savedTimesheet
}

export async function updateTimesheet(id: string, updates: Partial<ITimesheet>): Promise<ITimesheet | null> {
  console.log("[v0] 📝 Cập nhật timesheet ID:", id, "với dữ liệu:", updates)
  await connectDB()
  const updatedTimesheet = await Timesheet.findByIdAndUpdate(id, updates, { new: true }).exec()
  console.log("[v0] 📊 Kết quả cập nhật timesheet:", updatedTimesheet ? "Thành công" : "Thất bại")
  return updatedTimesheet
}

export async function getTimesheetsByEmployee(
  employeeId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<ITimesheet[]> {
  console.log("[v0] 📋 Lấy timesheets cho employee:", employeeId, "từ:", startDate, "đến:", endDate)
  await connectDB()

  const query: any = { employeeId }

  if (startDate || endDate) {
    query.date = {}
    if (startDate) query.date.$gte = startDate
    if (endDate) query.date.$lte = endDate
  }

  const timesheets = await Timesheet.find(query).sort({ date: -1 }).exec()
  console.log("[v0] 📊 Tìm thấy", timesheets.length, "timesheets")
  return timesheets
}

export async function getAllTimesheets(): Promise<ITimesheet[]> {
  await connectDB()
  return await Timesheet.find().sort({ date: -1 }).exec()
}

export async function getTodayTimesheet(employeeId: string): Promise<ITimesheet | null> {
  console.log("[v0] 📅 Lấy timesheet hôm nay cho employee:", employeeId)
  await connectDB()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const timesheet = await Timesheet.findOne({
    employeeId,
    date: {
      $gte: today,
      $lt: tomorrow,
    },
  }).exec()

  console.log("[v0] 📊 Timesheet hôm nay:", timesheet ? "Có" : "Chưa có")
  return timesheet
}

export async function findTodayTimesheet(employeeId: string, dateString: string): Promise<ITimesheet | null> {
  await connectDB()

  const date = new Date(dateString)
  date.setHours(0, 0, 0, 0)

  const nextDay = new Date(date)
  nextDay.setDate(nextDay.getDate() + 1)

  return await Timesheet.findOne({
    employeeId,
    date: {
      $gte: date,
      $lt: nextDay,
    },
  }).exec()
}

export async function getTodayTimesheets(dateString: string): Promise<ITimesheet[]> {
  await connectDB()

  const date = new Date(dateString)
  date.setHours(0, 0, 0, 0)

  const nextDay = new Date(date)
  nextDay.setDate(nextDay.getDate() + 1)

  return await Timesheet.find({
    date: {
      $gte: date,
      $lt: nextDay,
    },
  }).exec()
}

// Utility functions (keep existing ones)
export function calculateTotalHours(checkIn: string, checkOut: string): number {
  const [inHour, inMinute] = checkIn.split(":").map(Number)
  const [outHour, outMinute] = checkOut.split(":").map(Number)

  const checkInTime = inHour + inMinute / 60
  const checkOutTime = outHour + outMinute / 60

  // Subtract 1 hour for lunch break
  return Math.max(0, checkOutTime - checkInTime - 1)
}

export function calculateSalary(totalHours: number, hourlyRate: number): number {
  return totalHours * hourlyRate
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount)
}
