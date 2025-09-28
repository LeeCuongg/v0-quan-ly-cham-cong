import { NextResponse } from "next/server"
import { getAllEmployees, getAllTimesheets } from "@/lib/database"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const today = new Date().toISOString().split("T")[0]
    const employeeId = url.searchParams.get("employeeId")

    const employees = await getAllEmployees()
    const timesheets = await getAllTimesheets()

    // If employeeId provided, narrow employees and timesheets
    const filteredEmployees = employeeId ? employees.filter((e) => String(e.id) === String(employeeId)) : employees
    const todayTimesheetsAll = timesheets.filter((timesheet) => timesheet.date === today)
    const todayTimesheets = employeeId
      ? todayTimesheetsAll.filter((ts) => String(ts.employee_id) === String(employeeId) || String(ts.employee_id || ts.employee_id) === String(employeeId))
      : todayTimesheetsAll

    // Calculate dashboard statistics
    const totalEmployees = filteredEmployees.length
    const currentlyWorking = filteredEmployees.filter((emp) => emp.is_currently_working).length

    const totalHoursToday = todayTimesheets.reduce((sum, timesheet) => sum + (timesheet.total_hours || 0), 0)
    const totalSalaryCost = todayTimesheets.reduce((sum, timesheet) => sum + (timesheet.salary || 0), 0)

    return NextResponse.json({
      totalEmployees,
      currentlyWorking,
      totalHoursToday: Math.round(totalHoursToday * 100) / 100,
      totalSalaryCost: Math.round(totalSalaryCost),
    })
  } catch (error) {
    console.error("[v0] Dashboard stats error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
