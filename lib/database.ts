import { createClient } from "@/lib/supabase/server"

// Database connection and models for timesheet management
export interface Employee {
  id: string
  name: string
  email: string
  hourly_rate: number
  total_hours_this_month: number
  is_currently_working: boolean
  password_hash?: string
  role: "employee" | "manager"
  is_active: boolean
  created_at: string
  phone?: string
}

export interface Timesheet {
  id: string
  employee_id: string
  date: string
  check_in: string
  check_out: string | null
  total_hours: number
  salary: number
  created_at?: string
}

export interface User {
  id: string
  name: string
  email: string
  password_hash: string
  role: "employee" | "manager"
  is_active: boolean
  created_at: string
  phone?: string
  hourly_rate: number
}

export async function findUserByEmail(email: string): Promise<Employee | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("employees").select("*").eq("email", email).eq("is_active", true).single()

  if (error || !data) return null
  return data
}

export async function findUserById(id: string): Promise<Employee | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("employees").select("*").eq("id", id).eq("is_active", true).single()

  if (error || !data) return null
  return data
}

export async function getAllEmployees(): Promise<Employee[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("employees").select("*").eq("is_active", true).order("name")

  if (error) return []
  return data || []
}

export async function createUser(userData: Omit<Employee, "id" | "created_at">): Promise<Employee | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("employees").insert([userData]).select().single()

  if (error || !data) return null
  return data
}

export async function updateUser(id: string, updates: Partial<Employee>): Promise<Employee | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("employees").update(updates).eq("id", id).select().single()

  if (error || !data) return null
  return data
}

export async function deleteUser(id: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.from("employees").update({ is_active: false }).eq("id", id)

  return !error
}

export async function getAllTimesheets(): Promise<Timesheet[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("timesheets")
    .select(`
      *,
      employees!inner(name)
    `)
    .order("date", { ascending: false })

  if (error) return []
  return data || []
}

export async function getTimesheetsByEmployeeId(employeeId: string): Promise<Timesheet[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("timesheets")
    .select("*")
    .eq("employee_id", employeeId)
    .order("date", { ascending: false })

  if (error) return []
  return data || []
}

export async function createTimesheet(timesheetData: Omit<Timesheet, "id" | "created_at">): Promise<Timesheet | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("timesheets").insert([timesheetData]).select().single()

  if (error || !data) return null
  return data
}

export async function updateTimesheet(id: string, updates: Partial<Timesheet>): Promise<Timesheet | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("timesheets").update(updates).eq("id", id).select().single()

  if (error || !data) return null
  return data
}

export async function getTodayTimesheet(employeeId: string): Promise<Timesheet | null> {
  const today = new Date().toISOString().split("T")[0]
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("timesheets")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("date", today)
    .single()

  if (error || !data) return null
  return data
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

export const employees: Employee[] = []
export const timesheets: Timesheet[] = []
export const sampleEmployees: Employee[] = []
export const sampleTimesheets: Timesheet[] = []

export async function initializeData() {
  const allEmployees = await getAllEmployees()
  const allTimesheets = await getAllTimesheets()

  employees.length = 0
  employees.push(...allEmployees)

  timesheets.length = 0
  timesheets.push(...allTimesheets)

  sampleEmployees.length = 0
  sampleEmployees.push(...allEmployees)

  sampleTimesheets.length = 0
  sampleTimesheets.push(...allTimesheets)
}
