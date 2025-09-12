import { createClient } from "@/lib/supabase/client"
import type { Employee, Timesheet } from "@/lib/types"

// Client-side database functions (for use in components)
export async function getEmployeesClient(): Promise<Employee[]> {
  const supabase = createClient()

  const { data, error } = await supabase.from("employees").select("*").order("name")

  if (error) {
    console.error("Error fetching employees:", error)
    return []
  }

  return data.map((emp) => ({
    ...emp,
    hourlyRate: emp.hourly_rate,
    isCurrentlyWorking: emp.is_currently_working,
    totalHoursThisMonth: emp.total_hours_this_month,
    currentCheckIn: emp.current_check_in ? new Date(emp.current_check_in) : undefined,
  }))
}

export async function getTimesheetsClient(): Promise<Timesheet[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("timesheets")
    .select(`
      *,
      employees!inner(name)
    `)
    .order("check_in", { ascending: false })

  if (error) {
    console.error("Error fetching timesheets:", error)
    return []
  }

  return data.map((ts) => ({
    id: ts.id,
    employeeId: ts.employee_id,
    employeeName: ts.employees.name,
    checkIn: new Date(ts.check_in),
    checkOut: ts.check_out ? new Date(ts.check_out) : undefined,
    hoursWorked: ts.hours_worked,
    date: ts.date,
  }))
}

// Legacy exports for backward compatibility
export const employees: Employee[] = []
export const timesheets: Timesheet[] = []
export const sampleEmployees: Employee[] = []
export const sampleTimesheets: Timesheet[] = []
