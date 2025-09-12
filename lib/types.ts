export interface Employee {
  id: string
  name: string
  email: string
  hourly_rate: number
  overtime_hourly_rate?: number
  total_hours_this_month: number
  is_currently_working: boolean
  password_hash: string
  role: 'employee' | 'manager'
  is_active: boolean
  phone?: string
  created_at: string
  updated_at: string
  current_check_in?: string | null
}

export interface Timesheet {
  id: string
  employee_id: string
  employee_name?: string
  date: string
  check_in_time: string
  check_out_time?: string | null
  total_hours: number
  regular_hours?: number
  overtime_hours?: number
  regular_pay?: number
  overtime_pay?: number
  salary: number
  created_at: string
  updated_at: string
  hourly_rate?: number
  overtime_hourly_rate?: number
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
