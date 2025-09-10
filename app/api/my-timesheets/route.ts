import { type NextRequest, NextResponse } from "next/server"
import { getTimesheetsByEmployeeId } from "@/lib/database"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("[API] ===== MY TIMESHEETS REQUEST START =====")
    
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
    
    console.log("[API] Query params:", { startDate, endDate })

    const employeeIdStr = session.userId
    console.log("[API] Employee ID:", employeeIdStr)
    
    let filteredTimesheets = await getTimesheetsByEmployeeId(employeeIdStr)
    console.log("[API] Raw timesheets from DB:", filteredTimesheets.length)

    if (startDate) {
      filteredTimesheets = filteredTimesheets.filter((ts) => ts.date >= startDate)
      console.log("[API] After start date filter:", filteredTimesheets.length)
    }
    if (endDate) {
      filteredTimesheets = filteredTimesheets.filter((ts) => ts.date <= endDate)
      console.log("[API] After end date filter:", filteredTimesheets.length)
    }

    // Calculate summary
    const totalHours = filteredTimesheets.reduce((sum, ts) => sum + (ts.total_hours || ts.hours_worked || 0), 0)
    const totalSalary = filteredTimesheets.reduce((sum, ts) => sum + (ts.salary || 0), 0)
    const totalDays = filteredTimesheets.length
    const avgHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0

    const summary = {
      totalHours: Math.round(totalHours * 100) / 100,
      totalSalary: Math.round(totalSalary),
      totalDays,
      avgHoursPerDay: Math.round(avgHoursPerDay * 100) / 100,
    }

    console.log("[API] Summary calculated:", summary)

    // Sort timesheets by date (newest first)
    const sortedTimesheets = filteredTimesheets.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    const response = {
      timesheets: sortedTimesheets,
      summary,
      meta: {
        total: sortedTimesheets.length,
        dateRange: { startDate, endDate }
      }
    }

    console.log("[API] Sending response with", sortedTimesheets.length, "timesheets")
    console.log("[API] ===== MY TIMESHEETS REQUEST END =====")

    return NextResponse.json(response)
  } catch (error) {
    console.error("[API] My timesheets error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 })
  }
}
