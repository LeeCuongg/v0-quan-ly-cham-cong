import { type NextRequest, NextResponse } from "next/server"
import { getAllTimesheets, getTimesheetsByEmployeeId } from "@/lib/database"
import { getSession, isManager } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    // Verify manager access
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.role !== "manager" && session.role !== "admin") {
      return NextResponse.json({ error: "Only managers can view all timesheets" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    console.log("[Timesheets API] Params:", { employeeId, startDate, endDate })

    // Get timesheets based on filters
    let timesheets = employeeId ? 
      await getTimesheetsByEmployeeId(employeeId) : 
      await getAllTimesheets()

    console.log("[Timesheets API] Raw timesheets:", timesheets.length)

    // Apply date filters
    if (startDate && endDate) {
      timesheets = timesheets.filter(
        (timesheet) => timesheet.date >= startDate && timesheet.date <= endDate
      )
      console.log("[Timesheets API] After date filter:", timesheets.length)
    }

    // Transform data to match frontend expectations
    const transformedTimesheets = timesheets.map(ts => ({
      id: ts.id,
      employee_id: ts.employee_id,
      employee_name: ts.employee_name || ts.employees?.name || "Unknown",
      date: ts.date,
      check_in_time: ts.check_in_time,
      check_out_time: ts.check_out_time,
      total_hours: ts.total_hours || 0,
      hours_worked: ts.hours_worked || 0,
      salary: ts.salary || 0,
      created_at: ts.created_at,
      updated_at: ts.updated_at
    }))

    // Lấy thông tin phụ cấp từ Supabase
    const supabase = createClient()
    const { data, error } = await supabase
      .from("timesheets")
      .select(`
        *,
        employees!inner(name, email, hourly_rate, overtime_rate)
      `)
      .order("date", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Transform data với overtime info
    const transformedData = data.map((timesheet) => ({
      id: timesheet.id,
      employee_id: timesheet.employee_id,
      employee_name: timesheet.employee_name || timesheet.employees?.name,
      date: timesheet.date,
      check_in_time: timesheet.check_in_time,
      check_out_time: timesheet.check_out_time,
      total_hours: timesheet.total_hours || 0,
      regular_hours: timesheet.regular_hours || 0,
      overtime_hours: timesheet.overtime_hours || 0,
      regular_pay: timesheet.regular_pay || 0,
      overtime_pay: timesheet.overtime_pay || 0,
      salary: timesheet.salary || 0,
      hourly_rate: timesheet.employees?.hourly_rate || 0,
      overtime_rate: timesheet.employees?.overtime_rate || 1.5,
    }))

    return NextResponse.json(transformedData)

  } catch (error) {
    console.error("[Timesheets API] Error:", error)
    return NextResponse.json({ error: "Failed to fetch timesheets" }, { status: 500 })
  }
}
