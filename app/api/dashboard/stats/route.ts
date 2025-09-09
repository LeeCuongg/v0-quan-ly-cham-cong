import { NextResponse } from "next/server"
import { getAllEmployees, getTodayTimesheets } from "@/lib/database-mongodb"

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0]

    const employees = await getAllEmployees()
    const todayTimesheets = await getTodayTimesheets(today)

    // Calculate dashboard statistics
    const totalEmployees = employees.length
    const currentlyWorking = employees.filter((emp) => emp.isCurrentlyWorking).length
    const totalHoursToday = todayTimesheets.reduce((sum, timesheet) => sum + timesheet.totalHours, 0)
    const totalSalaryCost = todayTimesheets.reduce((sum, timesheet) => sum + timesheet.salary, 0)

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
