import { NextResponse } from "next/server"
import { getAllTimesheets, getTimesheetsByEmployeeId } from "@/lib/database"
import { getSession } from "@/lib/auth"

export async function GET(request: Request) {
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
      check_in: ts.check_in,
      check_out: ts.check_out,
      total_hours: ts.total_hours || 0,
      hours_worked: ts.hours_worked || 0,
      salary: ts.salary || 0,
      created_at: ts.created_at,
      updated_at: ts.updated_at
    }))

    console.log("[Timesheets API] Returning:", transformedTimesheets.length, "timesheets")
    return NextResponse.json(transformedTimesheets)

  } catch (error) {
    console.error("[Timesheets API] Error:", error)
    return NextResponse.json({ error: "Failed to fetch timesheets" }, { status: 500 })
  }
}
