import connectDB from "./mongodb"
import Employee, { type IEmployee } from "./models/Employee"
import Timesheet, { type ITimesheet } from "./models/Timesheet"
import bcrypt from "bcryptjs"

// Connect to database
export async function initializeDB() {
  await connectDB()
}

// Employee operations
export async function findUserByEmail(email: string): Promise<IEmployee | null> {
  await connectDB()
  return await Employee.findOne({ email: email.toLowerCase(), isActive: true }).exec()
}

export async function findUserById(id: string): Promise<IEmployee | null> {
  await connectDB()
  return await Employee.findById(id).exec()
}

export async function createUser(userData: {
  name: string
  email: string
  password: string
  hourlyRate: number
  role?: "employee" | "manager"
  phone?: string
}): Promise<IEmployee> {
  await connectDB()

  // Hash password
  const hashedPassword = await bcrypt.hash(userData.password, 10)

  const newEmployee = new Employee({
    ...userData,
    password: hashedPassword,
    email: userData.email.toLowerCase(),
  })

  return await newEmployee.save()
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
  await connectDB()

  const timesheet = new Timesheet(timesheetData)
  return await timesheet.save()
}

export async function updateTimesheet(id: string, updates: Partial<ITimesheet>): Promise<ITimesheet | null> {
  await connectDB()
  return await Timesheet.findByIdAndUpdate(id, updates, { new: true }).exec()
}

export async function getTimesheetsByEmployee(
  employeeId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<ITimesheet[]> {
  await connectDB()

  const query: any = { employeeId }

  if (startDate || endDate) {
    query.date = {}
    if (startDate) query.date.$gte = startDate
    if (endDate) query.date.$lte = endDate
  }

  return await Timesheet.find(query).sort({ date: -1 }).exec()
}

export async function getAllTimesheets(): Promise<ITimesheet[]> {
  await connectDB()
  return await Timesheet.find().sort({ date: -1 }).exec()
}

export async function getTodayTimesheet(employeeId: string): Promise<ITimesheet | null> {
  await connectDB()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return await Timesheet.findOne({
    employeeId,
    date: {
      $gte: today,
      $lt: tomorrow,
    },
  }).exec()
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
