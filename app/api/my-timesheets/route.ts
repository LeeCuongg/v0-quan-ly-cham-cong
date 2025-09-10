import { type NextRequest, NextResponse } from "next/server"
import { getTimesheetsByEmployeeId } from "@/lib/database"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.role !== "employee") {
      return NextResponse.json({ error: "Only employees can view their timesheets" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const employeeIdStr = session.userId
    let filteredTimesheets = await getTimesheetsByEmployeeId(employeeIdStr)

    if (startDate) {
      filteredTimesheets = filteredTimesheets.filter((ts) => ts.date >= startDate)
    }
    if (endDate) {
      filteredTimesheets = filteredTimesheets.filter((ts) => ts.date <= endDate)
    }

    const totalHours = filteredTimesheets.reduce((sum, ts) => sum + ts.total_hours, 0)
    const totalSalary = filteredTimesheets.reduce((sum, ts) => sum + ts.salary, 0)

    return NextResponse.json({
      timesheets: filteredTimesheets,
      summary: {
        totalHours: Math.round(totalHours * 100) / 100,
        totalSalary: Math.round(totalSalary),
        totalDays: filteredTimesheets.length,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
