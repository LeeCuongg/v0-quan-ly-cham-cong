export interface Employee {
  id: string
  name: string
  email: string
  password: string
  role: "admin" | "employee"
  hourlyRate: number
  isCurrentlyWorking: boolean
  totalHoursThisMonth: number
  currentCheckIn?: Date
}

export interface Timesheet {
  id: string
  employeeId: string
  employeeName: string
  checkIn: Date
  checkOut?: Date
  hoursWorked?: number
  date: string
}

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "employee"
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date)
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}
