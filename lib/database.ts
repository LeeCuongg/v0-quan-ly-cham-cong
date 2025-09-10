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

    const { data, error } = await supabase
      .from("timesheets")
      .insert([insertData])
      .select()
      .single()
    
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
  console.log("[DB] Updates:", JSON.stringify(updates, null, 2))
  const startTime = Date.now()

  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    console.log("[DB] Supabase client created successfully")

    // Chuẩn hóa dữ liệu update
    const mappedUpdates: any = {
      total_hours: updates.total_hours,
      salary: updates.salary,
    }

    // Nếu có check_out_time, tạo cả TIME và TIMESTAMP format
    if (updates.check_out_time || updates.check_out) {
      const checkOutTime = updates.check_out_time || updates.check_out
      
      // Lấy thông tin timesheet hiện tại để có date
      const { data: currentTimesheet } = await supabase
        .from("timesheets")
        .select("date")
        .eq("id", id)
        .single()

      if (currentTimesheet) {
        mappedUpdates.check_out_time = `${checkOutTime}:00` // TIME format
        mappedUpdates.check_out = `${currentTimesheet.date} ${checkOutTime}:00+07:00` // TIMESTAMP format
        mappedUpdates.hours_worked = updates.total_hours // Sync hours_worked
      }
    }

    console.log("[DB] Mapped updates:", JSON.stringify(mappedUpdates, null, 2))

    const { data, error } = await supabase
      .from("timesheets")
      .update(mappedUpdates)
      .eq("id", id)
      .select()
      .single()
    
    const duration = Date.now() - startTime

    if (error) {
      console.error("[DB] ===== UPDATE ERROR =====")
      console.error("[DB] Error:", JSON.stringify(error, null, 2))
      console.error("[DB] Query duration:", duration + "ms")
      console.error("[DB] ===========================")
      return null
    }

    console.log("[DB] SUCCESS - Updated timesheet:", JSON.stringify(data, null, 2))
    console.log("[DB] Query duration:", duration + "ms")
    console.log("[DB] ===== UPDATE TIMESHEET END =====")
    return data
    
  } catch (err) {
    console.error("[DB] ===== UPDATE EXCEPTION =====")
    console.error("[DB] Exception:", err)
    console.error("[DB] ================================")
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
      .maybeSingle() // Dùng maybeSingle() thay vì single() để không lỗi khi không có data
    
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
