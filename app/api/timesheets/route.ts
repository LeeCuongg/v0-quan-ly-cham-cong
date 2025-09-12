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

    // Lấy thông tin timesheets từ Supabase với filter
    const supabase = await createClient()
    let query = supabase
      .from("timesheets")
      .select(`
        *,
        employees!inner(name, email, hourly_rate, overtime_hourly_rate)
      `)
      .order("date", { ascending: false })

    // Apply filters
    if (employeeId) {
      query = query.eq("employee_id", employeeId)
    }

    if (startDate && endDate) {
      query = query.gte("date", startDate).lte("date", endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("[Timesheets API] Database error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json({ 
        error: "Database error", 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      }, { status: 500 })
    }

    // Transform data với overtime info
    const transformedData = data?.map((timesheet) => ({
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
      overtime_hourly_rate: timesheet.employees?.overtime_hourly_rate || 30000,
    })) || []

    return NextResponse.json(transformedData)

  } catch (error) {
    console.error("[Timesheets API] Error:", error)
    return NextResponse.json({ error: "Failed to fetch timesheets" }, { status: 500 })
  }
}
