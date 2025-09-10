// import { createClient } from "@/lib/supabase/server"

// Re-export types and utilities for backward compatibility
export type { Employee, Timesheet, User } from "@/lib/types"
export { formatCurrency, formatDate, formatTime, formatDateTime } from "@/lib/types"

// Server-side database functions (only for API routes and server components)
export async function findUserByEmail(email: string): Promise<any | null> {
  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()
  const { data, error } = await supabase.from("employees").select("*").eq("email", email).eq("is_active", true).single()

  if (error || !data) return null
  return data
}

export async function findUserById(id: string): Promise<any | null> {
  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()
  const { data, error } = await supabase.from("employees").select("*").eq("id", id).eq("is_active", true).single()

  if (error || !data) return null
  return data
}

export async function getAllEmployees(): Promise<any[]> {
  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()
  const { data, error } = await supabase.from("employees").select("*").eq("is_active", true).order("name")

  if (error) return []
  return data || []
}

export async function createUser(userData: any): Promise<any | null> {
  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()
  const { data, error } = await supabase.from("employees").insert([userData]).select().single()

  if (error || !data) return null
  return data
}

export async function updateUser(id: string, updates: any): Promise<any | null> {
  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()
  const { data, error } = await supabase.from("employees").update(updates).eq("id", id).select().single()

  if (error || !data) return null
  return data
}

export async function deleteUser(id: string): Promise<boolean> {
  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()
  const { error } = await supabase.from("employees").update({ is_active: false }).eq("id", id)

  return !error
}

export async function getAllTimesheets(): Promise<any[]> {
  const { createClient } = await import("@/lib/supabase/server")
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

export async function getTimesheetsByEmployeeId(employeeId: string): Promise<any[]> {
  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("timesheets")
    .select("*")
    .eq("employee_id", employeeId)
    .order("date", { ascending: false })

  if (error) return []
  return data || []
}

export async function createTimesheet(timesheetData: any): Promise<any | null> {
  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()
  const { data, error } = await supabase.from("timesheets").insert([timesheetData]).select().single()

  if (error || !data) return null
  return data
}

export async function updateTimesheet(id: string, updates: any): Promise<any | null> {
  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()
  const { data, error } = await supabase.from("timesheets").update(updates).eq("id", id).select().single()

  if (error || !data) return null
  return data
}

export async function getTodayTimesheet(employeeId: string): Promise<any | null> {
  const today = new Date().toISOString().split("T")[0]
  const { createClient } = await import("@/lib/supabase/server")
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

// Legacy exports for backward compatibility
export const employees: any[] = []
export const timesheets: any[] = []
export const sampleEmployees: any[] = []
export const sampleTimesheets: any[] = []

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
