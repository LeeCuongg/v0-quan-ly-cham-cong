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
  console.log("[DB] ===== CREATE TIMESHEET START =====")
  console.log("[DB] Input data:", JSON.stringify(timesheetData, null, 2))
  const startTime = Date.now()

  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    console.log("[DB] Supabase client created successfully")

    // Tạo timestamp đầy đủ cho Vietnam timezone
    const createTimestamp = (date: string, timeStr: string): string => {
      // timeStr format: "21:15"
      // date format: "2025-09-10"
      return `${date} ${timeStr}:00+07:00`
    }

    // Tạo TIME format (chỉ giờ:phút:giây)
    const createTimeFormat = (timeStr: string): string => {
      return `${timeStr}:00` // "21:15" -> "21:15:00"
    }

    const insertData = {
      employee_id: timesheetData.employee_id,
      date: timesheetData.date,
      // TIME columns
      check_in_time: createTimeFormat(timesheetData.check_in_time),
      check_out_time: null,
      // TIMESTAMP columns
      check_in: createTimestamp(timesheetData.date, timesheetData.check_in_time),
      check_out: null,
      // Other fields
      total_hours: 0,
      salary: 0,
      employee_name: timesheetData.employee_name,
      hours_worked: 0,
    }

    console.log("[DB] Final insert data:", JSON.stringify(insertData, null, 2))

    const { data, error } = await supabase.from("timesheets").insert([insertData]).select().single()

    const duration = Date.now() - startTime

    if (error) {
      console.error("[DB] ===== SUPABASE ERROR =====")
      console.error("[DB] Error message:", error.message)
      console.error("[DB] Error details:", error.details)
      console.error("[DB] Error hint:", error.hint)
      console.error("[DB] Error code:", error.code)
      console.error("[DB] ============================")
      return null
    }

    console.log("[DB] SUCCESS - Created timesheet:", JSON.stringify(data, null, 2))
    console.log("[DB] Query duration:", duration + "ms")
    console.log("[DB] ===== CREATE TIMESHEET END =====")
    return data
  } catch (err) {
    console.error("[DB] ===== EXCEPTION ERROR =====")
    console.error("[DB] Exception:", err)
    console.error("[DB] ==============================")
    return null
  }
}

export async function updateTimesheet(id: string, updates: any): Promise<any | null> {
  console.log("[DB] ===== UPDATE TIMESHEET START =====")
  console.log("[DB] Timesheet ID:", id)
  console.log("[DB] Raw updates:", JSON.stringify(updates, null, 2))

  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()

    // Chuẩn hóa "HH:mm" -> "HH:mm:00"
    const ensureTimeWithSeconds = (t: string) => {
      if (!t) return t
      return /^\d{2}:\d{2}:\d{2}$/.test(t) ? t : `${t}:00`
    }

    const dbUpdates: any = {}

    // Chuẩn hóa và set check_in_time + check_in (timestamp)
    if (updates.check_in_time !== undefined) {
      const t = ensureTimeWithSeconds(updates.check_in_time)
      dbUpdates.check_in_time = t
      const currentDate = new Date().toISOString().split("T")[0]
      dbUpdates.check_in = `${currentDate} ${t}+07:00`
    }

    // Chuẩn hóa và set check_out_time + check_out (timestamp)
    if (updates.check_out_time !== undefined) {
      const t = ensureTimeWithSeconds(updates.check_out_time)
      dbUpdates.check_out_time = t
      const currentDate = new Date().toISOString().split("T")[0]
      dbUpdates.check_out = `${currentDate} ${t}+07:00`
    }

    if (updates.total_hours !== undefined) {
      dbUpdates.total_hours = updates.total_hours
      dbUpdates.hours_worked = updates.total_hours
    }

    if (updates.salary !== undefined) dbUpdates.salary = updates.salary
    if (updates.regular_hours !== undefined) dbUpdates.regular_hours = updates.regular_hours
    if (updates.overtime_hours !== undefined) dbUpdates.overtime_hours = updates.overtime_hours
    if (updates.regular_pay !== undefined) dbUpdates.regular_pay = updates.regular_pay
    if (updates.overtime_pay !== undefined) dbUpdates.overtime_pay = updates.overtime_pay

    // Thêm cập nhật đơn giá
    if (updates.hourly_rate !== undefined) dbUpdates.hourly_rate = updates.hourly_rate
    if (updates.overtime_hourly_rate !== undefined) dbUpdates.overtime_hourly_rate = updates.overtime_hourly_rate

    // updated_at
    dbUpdates.updated_at = new Date().toISOString()

    console.log("[DB] Mapped DB updates:", JSON.stringify(dbUpdates, null, 2))

    if (!id || typeof id !== "string") {
      console.error("[DB] Invalid timesheet ID:", id)
      return null
    }

    const { data, error } = await supabase.from("timesheets").update(dbUpdates).eq("id", id).select().single()

    if (error) {
      console.error("[DB] ===== SUPABASE UPDATE ERROR =====")
      console.error("[DB] Error message:", error.message)
      console.error("[DB] Error details:", error.details)
      console.error("[DB] Error hint:", error.hint)
      console.error("[DB] Error code:", error.code)
      console.error("[DB] Failed updates:", JSON.stringify(dbUpdates, null, 2))
      console.error("[DB] ===================================")
      return null
    }

    console.log("[DB] ===== UPDATE SUCCESS =====")
    console.log("[DB] Updated timesheet:", JSON.stringify(data, null, 2))
    console.log("[DB] ===== UPDATE TIMESHEET END =====")
    return data
  } catch (error) {
    console.error("[DB] ===== UPDATE EXCEPTION =====")
    console.error("[DB] Exception:", error)
    console.error("[DB] Exception stack:", (error as Error)?.stack)
    console.error("[DB] ===============================")
    return null
  }
}

export async function getTodayTimesheet(employeeId: string): Promise<any | null> {
  const today = new Date().toISOString().split("T")[0]
  console.log("[DB] getTodayTimesheet called with employeeId:", employeeId, "date:", today)
  const startTime = Date.now()

  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    console.log("[DB] Supabase client created successfully")

    const { data, error } = await supabase
      .from("timesheets")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("date", today)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const duration = Date.now() - startTime

    if (error) {
      console.log("[DB] getTodayTimesheet error:", error)
      console.log("[DB] Query duration:", duration + "ms")
      return null
    }

    if (!data) {
      console.log("[DB] No timesheet found for today - this is normal for first checkin")
      console.log("[DB] Query duration:", duration + "ms")
      return null
    }

    console.log("[DB] getTodayTimesheet success, found timesheet:", JSON.stringify(data, null, 2))
    console.log("[DB] Query duration:", duration + "ms")
    return data
  } catch (err) {
    console.log("[DB] getTodayTimesheet exception:", err)
    return null
  }
}

export async function getTodayTimesheets(employeeId: string): Promise<any[]> {
  const today = new Date().toISOString().split("T")[0]
  console.log("[DB] getTodayTimesheets called with employeeId:", employeeId, "date:", today)
  const startTime = Date.now()

  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    console.log("[DB] Supabase client created successfully")

    const { data, error } = await supabase
      .from("timesheets")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("date", today)
      .order("created_at", { ascending: true })

    const duration = Date.now() - startTime

    if (error) {
      console.log("[DB] getTodayTimesheets error:", error)
      console.log("[DB] Query duration:", duration + "ms")
      return []
    }

    console.log("[DB] getTodayTimesheets success, found count:", data?.length || 0)
    console.log("[DB] Query duration:", duration + "ms")
    return data || []
  } catch (err) {
    console.log("[DB] getTodayTimesheets exception:", err)
    return []
  }
}

export async function getActiveTimesheet(employeeId: string): Promise<any | null> {
  const today = new Date().toISOString().split("T")[0]
  console.log("[DB] getActiveTimesheet called with employeeId:", employeeId, "date:", today)
  const startTime = Date.now()

  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    console.log("[DB] Supabase client created successfully")

    // Find timesheet with check_in but no check_out for today
    const { data, error } = await supabase
      .from("timesheets")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("date", today)
      .not("check_in_time", "is", null)
      .is("check_out_time", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const duration = Date.now() - startTime

    if (error) {
      console.log("[DB] getActiveTimesheet error:", error)
      console.log("[DB] Query duration:", duration + "ms")
      return null
    }

    if (!data) {
      console.log("[DB] No active timesheet found - employee can check in")
      console.log("[DB] Query duration:", duration + "ms")
      return null
    }

    console.log("[DB] getActiveTimesheet success, found active timesheet:", JSON.stringify(data, null, 2))
    console.log("[DB] Query duration:", duration + "ms")
    return data
  } catch (err) {
    console.log("[DB] getActiveTimesheet exception:", err)
    return null
  }
}

export function calculateTotalHours(checkIn: string, checkOut: string): number {
  console.log("[CALC] calculateTotalHours called with checkIn:", checkIn, "checkOut:", checkOut)

  try {
    // Parse time strings (format: "HH:MM" hoặc "HH:MM:SS")
    const parseTime = (timeStr: string): number => {
      const parts = timeStr.split(":")
      const hours = Number.parseInt(parts[0])
      const minutes = Number.parseInt(parts[1])
      return hours + minutes / 60
    }

    const checkInTime = parseTime(checkIn)
    const checkOutTime = parseTime(checkOut)

    console.log("[CALC] Parsed times - checkIn:", checkInTime, "checkOut:", checkOutTime)

    let totalHours = checkOutTime - checkInTime

    // Xử lý trường hợp qua ngày (ví dụ: check-in 23:00, check-out 01:00)
    if (totalHours < 0) {
      totalHours += 24
      console.log("[CALC] Adjusted for next day, total hours:", totalHours)
    }

    const finalHours = Math.round(totalHours * 100) / 100
    console.log("[CALC] Final total hours:", finalHours)

    return Math.max(0, finalHours)
  } catch (error) {
    console.error("[CALC] Error calculating hours:", error)
    return 0
  }
}

export function calculateSalary(totalHours: number, hourlyRate: number): number {
  console.log("[CALC] calculateSalary called with totalHours:", totalHours, "hourlyRate:", hourlyRate)

  try {
    const regularHours = Math.min(totalHours, 10)
    const overtimeHours = Math.max(0, totalHours - 10)

    const regularSalary = regularHours * hourlyRate
    const overtimeSalary = overtimeHours * hourlyRate * 1.5 // 150% for overtime

    const totalSalary = regularSalary + overtimeSalary

    console.log("[CALC] Salary breakdown:", {
      regularHours,
      overtimeHours,
      regularSalary,
      overtimeSalary,
      totalSalary,
    })

    return totalSalary
  } catch (error) {
    console.error("[CALC] Error calculating salary:", error)
    return 0
  }
}
import { calculateDailySalary } from "./salary-utils"

export function calculateSalaryWithOvertime(totalHours: number, hourlyRate: number, overtimeHourlyRate = 30000): any {
  const calculation = calculateDailySalary(totalHours, hourlyRate, overtimeHourlyRate)

  console.log("[SALARY] Overtime calculation:", {
    totalHours,
    hourlyRate,
    overtimeHourlyRate,
    calculation,
  })

  return calculation
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

export async function getTimesheetById(id: string): Promise<any | null> {
  console.log("[DB] getTimesheetById called with id:", id)
  const startTime = Date.now()

  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    console.log("[DB] Supabase client created successfully")

    const { data, error } = await supabase
      .from("timesheets")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    const duration = Date.now() - startTime

    if (error) {
      console.log("[DB] getTimesheetById error:", error)
      console.log("[DB] Query duration:", duration + "ms")
      return null
    }

    if (!data) {
      console.log("[DB] getTimesheetById not found, id:", id)
      console.log("[DB] Query duration:", duration + "ms")
      return null
    }

    console.log("[DB] getTimesheetById success:", JSON.stringify(data, null, 2))
    console.log("[DB] Query duration:", duration + "ms")
    return data
  } catch (err) {
    console.log("[DB] getTimesheetById exception:", err)
    return null
  }
}
