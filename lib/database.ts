// import { createClient } from "@/lib/supabase/server"

// Re-export types and utilities for backward compatibility
export type { Employee, Timesheet, User } from "@/lib/types"
export { formatCurrency, formatDate, formatTime, formatDateTime } from "@/lib/types"

// Server-side database functions (only for API routes and server components)
export async function findUserByEmail(email: string): Promise<any | null> {
  console.log("[v0] DB: findUserByEmail called with email:", email)
  const startTime = Date.now()

  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    console.log("[v0] DB: Supabase client created successfully")

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .single()
    const duration = Date.now() - startTime

    if (error) {
      console.log("[v0] DB: findUserByEmail error:", error)
      console.log("[v0] DB: Query duration:", duration + "ms")
      return null
    }

    console.log("[v0] DB: findUserByEmail success, found user:", data ? "YES" : "NO")
    console.log("[v0] DB: Query duration:", duration + "ms")
    return data
  } catch (err) {
    console.log("[v0] DB: findUserByEmail exception:", err)
    return null
  }
}

export async function findUserById(id: string): Promise<any | null> {
  console.log("[v0] DB: findUserById called with id:", id)
  const startTime = Date.now()

  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    console.log("[v0] DB: Supabase client created successfully")

    const { data, error } = await supabase.from("employees").select("*").eq("id", id).eq("is_active", true).single()
    const duration = Date.now() - startTime

    if (error) {
      console.log("[v0] DB: findUserById error:", error)
      console.log("[v0] DB: Query duration:", duration + "ms")
      return null
    }

    console.log("[v0] DB: findUserById success, found user:", data ? "YES" : "NO")
    console.log("[v0] DB: Query duration:", duration + "ms")
    return data
  } catch (err) {
    console.log("[v0] DB: findUserById exception:", err)
    return null
  }
}

export async function getAllEmployees(): Promise<any[]> {
  console.log("[v0] DB: getAllEmployees called")
  const startTime = Date.now()

  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    console.log("[v0] DB: Supabase client created successfully")

    const { data, error } = await supabase.from("employees").select("*").eq("is_active", true).order("name")
    const duration = Date.now() - startTime

    if (error) {
      console.log("[v0] DB: getAllEmployees error:", error)
      console.log("[v0] DB: Query duration:", duration + "ms")
      return []
    }

    console.log("[v0] DB: getAllEmployees success, count:", data?.length || 0)
    console.log("[v0] DB: Query duration:", duration + "ms")
    return data || []
  } catch (err) {
    console.log("[v0] DB: getAllEmployees exception:", err)
    return []
  }
}

export async function createUser(userData: any): Promise<any | null> {
  console.log("[v0] DB: createUser called with data:", userData)
  const startTime = Date.now()

  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    console.log("[v0] DB: Supabase client created successfully")

    const { data, error } = await supabase.from("employees").insert([userData]).select().single()
    const duration = Date.now() - startTime

    if (error) {
      console.log("[v0] DB: createUser error:", error)
      console.log("[v0] DB: Query duration:", duration + "ms")
      return null
    }

    console.log("[v0] DB: createUser success, created user id:", data?.id)
    console.log("[v0] DB: Query duration:", duration + "ms")
    return data
  } catch (err) {
    console.log("[v0] DB: createUser exception:", err)
    return null
  }
}

export async function updateUser(id: string, updates: any): Promise<any | null> {
  console.log("[v0] DB: updateUser called with id:", id, "updates:", updates)
  const startTime = Date.now()

  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    console.log("[v0] DB: Supabase client created successfully")

    const { data, error } = await supabase.from("employees").update(updates).eq("id", id).select().single()
    const duration = Date.now() - startTime

    if (error) {
      console.log("[v0] DB: updateUser error:", error)
      console.log("[v0] DB: Query duration:", duration + "ms")
      return null
    }

    console.log("[v0] DB: updateUser success, updated user id:", data?.id)
    console.log("[v0] DB: Query duration:", duration + "ms")
    return data
  } catch (err) {
    console.log("[v0] DB: updateUser exception:", err)
    return null
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  console.log("[v0] DB: deleteUser called with id:", id)
  const startTime = Date.now()

  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    console.log("[v0] DB: Supabase client created successfully")

    const { error } = await supabase.from("employees").update({ is_active: false }).eq("id", id)
    const duration = Date.now() - startTime

    if (error) {
      console.log("[v0] DB: deleteUser error:", error)
      console.log("[v0] DB: Query duration:", duration + "ms")
      return false
    }

    console.log("[v0] DB: deleteUser success, deactivated user id:", id)
    console.log("[v0] DB: Query duration:", duration + "ms")
    return true
  } catch (err) {
    console.log("[v0] DB: deleteUser exception:", err)
    return false
  }
}

export async function getAllTimesheets(): Promise<any[]> {
  console.log("[v0] DB: getAllTimesheets called")
  const startTime = Date.now()

  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    console.log("[v0] DB: Supabase client created successfully")

    const { data, error } = await supabase
      .from("timesheets")
      .select(`
        *,
        employees!inner(name)
      `)
      .order("date", { ascending: false })
    const duration = Date.now() - startTime

    if (error) {
      console.log("[v0] DB: getAllTimesheets error:", error)
      console.log("[v0] DB: Query duration:", duration + "ms")
      return []
    }

    console.log("[v0] DB: getAllTimesheets success, count:", data?.length || 0)
    console.log("[v0] DB: Query duration:", duration + "ms")
    return data || []
  } catch (err) {
    console.log("[v0] DB: getAllTimesheets exception:", err)
    return []
  }
}

export async function getTimesheetsByEmployeeId(employeeId: string): Promise<any[]> {
  console.log("[v0] DB: getTimesheetsByEmployeeId called with employeeId:", employeeId)
  const startTime = Date.now()

  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    console.log("[v0] DB: Supabase client created successfully")

    const { data, error } = await supabase
      .from("timesheets")
      .select("*")
      .eq("employee_id", employeeId)
      .order("date", { ascending: false })
    const duration = Date.now() - startTime

    if (error) {
      console.log("[v0] DB: getTimesheetsByEmployeeId error:", error)
      console.log("[v0] DB: Query duration:", duration + "ms")
      return []
    }

    console.log("[v0] DB: getTimesheetsByEmployeeId success, count:", data?.length || 0)
    console.log("[v0] DB: Query duration:", duration + "ms")
    return data || []
  } catch (err) {
    console.log("[v0] DB: getTimesheetsByEmployeeId exception:", err)
    return []
  }
}

export async function createTimesheet(timesheetData: any): Promise<any | null> {
  console.log("[v0] DB: createTimesheet called with data:", timesheetData)
  const startTime = Date.now()

  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    console.log("[v0] DB: Supabase client created successfully")

    // Map dữ liệu để khớp với database schema
    const mappedData = {
      employee_id: timesheetData.employee_id,
      date: timesheetData.date,
      check_in_time: timesheetData.check_in_time || timesheetData.check_in,
      check_out_time: timesheetData.check_out_time || timesheetData.check_out || null,
      total_hours: timesheetData.total_hours || 0,
      salary: timesheetData.salary || 0,
      employee_name: timesheetData.employee_name || null,
      hours_worked: timesheetData.hours_worked || timesheetData.total_hours || 0,
      // Thêm cả check_in và check_out nếu database có cả 2
      check_in: timesheetData.check_in_time || timesheetData.check_in,
      check_out: timesheetData.check_out_time || timesheetData.check_out || null,
    }

    console.log("[v0] DB: Mapped timesheet data:", mappedData)

    const { data, error } = await supabase
      .from("timesheets")
      .insert([mappedData])
      .select()
      .single()
    
    const duration = Date.now() - startTime

    if (error) {
      console.log("[v0] DB: createTimesheet error:", error)
      console.log("[v0] DB: Query duration:", duration + "ms")
      return null
    }

    console.log("[v0] DB: createTimesheet success, created timesheet id:", data?.id)
    console.log("[v0] DB: Query duration:", duration + "ms")
    return data
  } catch (err) {
    console.log("[v0] DB: createTimesheet exception:", err)
    return null
  }
}

export async function updateTimesheet(id: string, updates: any): Promise<any | null> {
  console.log("[v0] DB: updateTimesheet called with id:", id, "updates:", updates)
  const startTime = Date.now()

  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    console.log("[v0] DB: Supabase client created successfully")

    const { data, error } = await supabase.from("timesheets").update(updates).eq("id", id).select().single()
    const duration = Date.now() - startTime

    if (error) {
      console.log("[v0] DB: updateTimesheet error:", error)
      console.log("[v0] DB: Query duration:", duration + "ms")
      return null
    }

    console.log("[v0] DB: updateTimesheet success, updated timesheet id:", data?.id)
    console.log("[v0] DB: Query duration:", duration + "ms")
    return data
  } catch (err) {
    console.log("[v0] DB: updateTimesheet exception:", err)
    return null
  }
}

export async function getTodayTimesheet(employeeId: string): Promise<any | null> {
  const today = new Date().toISOString().split("T")[0]
  console.log("[v0] DB: getTodayTimesheet called with employeeId:", employeeId, "date:", today)
  const startTime = Date.now()

  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    console.log("[v0] DB: Supabase client created successfully")

    const { data, error } = await supabase
      .from("timesheets")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("date", today)
      .single()
    const duration = Date.now() - startTime

    if (error) {
      console.log("[v0] DB: getTodayTimesheet error:", error)
      console.log("[v0] DB: Query duration:", duration + "ms")
      return null
    }

    console.log("[v0] DB: getTodayTimesheet success, found timesheet:", data ? "YES" : "NO")
    console.log("[v0] DB: Query duration:", duration + "ms")
    return data
  } catch (err) {
    console.log("[v0] DB: getTodayTimesheet exception:", err)
    return null
  }
}

// Utility functions
export function calculateTotalHours(checkIn: string, checkOut: string): number {
  console.log("[v0] CALC: calculateTotalHours called with checkIn:", checkIn, "checkOut:", checkOut)

  const [inHour, inMinute] = checkIn.split(":").map(Number)
  const [outHour, outMinute] = checkOut.split(":").map(Number)

  const checkInTime = inHour + inMinute / 60
  const checkOutTime = outHour + outMinute / 60

  // Subtract 1 hour for lunch break
  const totalHours = Math.max(0, checkOutTime - checkInTime - 1)
  console.log("[v0] CALC: calculateTotalHours result:", totalHours)
  return totalHours
}

export function calculateSalary(totalHours: number, hourlyRate: number): number {
  console.log("[v0] CALC: calculateSalary called with totalHours:", totalHours, "hourlyRate:", hourlyRate)

  const salary = totalHours * hourlyRate
  console.log("[v0] CALC: calculateSalary result:", salary)
  return salary
}

// Legacy exports for backward compatibility
export const employees: any[] = []
export const timesheets: any[] = []
export const sampleEmployees: any[] = []
export const sampleTimesheets: any[] = []

export async function initializeData() {
  console.log("[v0] DB: initializeData called")
  const startTime = Date.now()

  try {
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

    const duration = Date.now() - startTime
    console.log("[v0] DB: initializeData completed successfully")
    console.log("[v0] DB: Loaded", allEmployees.length, "employees and", allTimesheets.length, "timesheets")
    console.log("[v0] DB: Initialization duration:", duration + "ms")
  } catch (err) {
    console.log("[v0] DB: initializeData exception:", err)
  }
}
