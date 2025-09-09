// Database connection and models for timesheet management
export interface Employee {
  id: string
  name: string
  email: string
  hourlyRate: number
  totalHoursThisMonth: number
  isCurrentlyWorking: boolean
  password?: string
  role: "employee" | "manager"
  isActive: boolean
  createdAt: string
  phone?: string
}

export interface Timesheet {
  id: string
  employeeId: string
  employeeName: string
  date: string
  checkIn: string
  checkOut: string | null
  totalHours: number
  salary: number
}

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: "employee" | "manager"
  isActive: boolean
  createdAt: string
  phone?: string
  hourlyRate: number
}

// Sample Vietnamese employee data
const sampleEmployees: Employee[] = [
  {
    id: "1",
    name: "Nguyễn Văn An",
    email: "nguyen.van.an@company.com",
    hourlyRate: 150000,
    totalHoursThisMonth: 168,
    isCurrentlyWorking: true,
    password: "$2b$10$rOzJqQqQqQqQqQqQqQgQgO", // hashed "emp123"
    role: "employee",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    phone: "0901234567",
  },
  {
    id: "2",
    name: "Trần Thị Bình",
    email: "tran.thi.binh@company.com",
    hourlyRate: 180000,
    totalHoursThisMonth: 172,
    isCurrentlyWorking: false,
    password: "$2b$10$rOzJqQqQqQqQqQgQgQgQgO", // hashed "emp123"
    role: "employee",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    phone: "0901234568",
  },
  {
    id: "3",
    name: "Lê Minh Cường",
    email: "le.minh.cuong@company.com",
    hourlyRate: 200000,
    totalHoursThisMonth: 165,
    isCurrentlyWorking: true,
    password: "$2b$10$rOzJqQqQqQqQgQgQgQgQgO", // hashed "emp123"
    role: "employee",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    phone: "0901234569",
  },
  {
    id: "4",
    name: "Phạm Thị Dung",
    email: "pham.thi.dung@company.com",
    hourlyRate: 175000,
    totalHoursThisMonth: 170,
    isCurrentlyWorking: false,
    password: "$2b$10$rOzJqQqQqQgQgQgQgQgQgO", // hashed "emp123"
    role: "employee",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    phone: "0901234570",
  },
  {
    id: "5",
    name: "Hoàng Văn Em",
    email: "hoang.van.em@company.com",
    hourlyRate: 160000,
    totalHoursThisMonth: 168,
    isCurrentlyWorking: true,
    password: "$2b$10$rOzJqQqQqQgQgQgQgQgQgO", // hashed "emp123"
    role: "employee",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    phone: "0901234571",
  },
]

const adminUser: Employee = {
  id: "admin",
  name: "Quản trị viên",
  email: "admin@company.com",
  hourlyRate: 0,
  totalHoursThisMonth: 0,
  isCurrentlyWorking: false,
  password: "$2b$10$adminHashedPassword", // hashed "admin123"
  role: "manager",
  isActive: true,
  createdAt: "2024-01-01T00:00:00Z",
  phone: "0900000000",
}

// Sample timesheet data
const sampleTimesheets: Timesheet[] = [
  {
    id: "1",
    employeeId: "1",
    employeeName: "Nguyễn Văn An",
    date: "2024-01-15",
    checkIn: "08:00",
    checkOut: "17:30",
    totalHours: 8.5,
    salary: 1275000,
  },
  {
    id: "2",
    employeeId: "2",
    employeeName: "Trần Thị Bình",
    date: "2024-01-15",
    checkIn: "08:30",
    checkOut: "17:00",
    totalHours: 7.5,
    salary: 1350000,
  },
  {
    id: "3",
    employeeId: "3",
    employeeName: "Lê Minh Cường",
    date: "2024-01-15",
    checkIn: "09:00",
    checkOut: "18:00",
    totalHours: 8,
    salary: 1600000,
  },
  {
    id: "4",
    employeeId: "1",
    employeeName: "Nguyễn Văn An",
    date: "2024-01-16",
    checkIn: "08:15",
    checkOut: null,
    totalHours: 0,
    salary: 0,
  },
  {
    id: "5",
    employeeId: "4",
    employeeName: "Phạm Thị Dung",
    date: "2024-01-16",
    checkIn: "08:00",
    checkOut: "16:30",
    totalHours: 7.5,
    salary: 1312500,
  },
]

export const employees = [adminUser, ...sampleEmployees]
export const timesheets = [...sampleTimesheets]
export { sampleEmployees, sampleTimesheets }

export function findUserByEmail(email: string): Employee | undefined {
  return employees.find((emp) => emp.email === email && emp.isActive)
}

export function findUserById(id: string): Employee | undefined {
  return employees.find((emp) => emp.id === id && emp.isActive)
}

export function createUser(userData: Omit<Employee, "id" | "createdAt">): Employee {
  const newUser: Employee = {
    ...userData,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  }
  employees.push(newUser)
  return newUser
}

export function updateUser(id: string, updates: Partial<Employee>): Employee | null {
  const userIndex = employees.findIndex((emp) => emp.id === id)
  if (userIndex === -1) return null

  employees[userIndex] = { ...employees[userIndex], ...updates }
  return employees[userIndex]
}

export function deleteUser(id: string): boolean {
  const userIndex = employees.findIndex((emp) => emp.id === id)
  if (userIndex === -1) return false

  employees.splice(userIndex, 1)
  return true
}

// Utility functions
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
