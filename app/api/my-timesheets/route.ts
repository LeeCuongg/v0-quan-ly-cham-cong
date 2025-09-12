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
    let startDate = searchParams.get("startDate")
    let endDate = searchParams.get("endDate")
    const preset = searchParams.get("preset") // thisMonth, lastMonth, lastWeek
    
    // Handle preset filters
    if (preset) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      switch (preset) {
        case "thisMonth":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
          break
        case "lastMonth":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
          endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
          break
        case "lastWeek":
          const lastWeekStart = new Date(today)
          lastWeekStart.setDate(today.getDate() - today.getDay() - 7) // Start of last week (Sunday)
          const lastWeekEnd = new Date(lastWeekStart)
          lastWeekEnd.setDate(lastWeekStart.getDate() + 6) // End of last week (Saturday)
          startDate = lastWeekStart.toISOString().split('T')[0]
          endDate = lastWeekEnd.toISOString().split('T')[0]
          break
      }
    }
    
    console.log("[API] Query params:", { startDate, endDate, preset })

    const employeeIdStr = session.userId
    console.log("[API] Employee ID:", employeeIdStr)
    
    let filteredTimesheets = await getTimesheetsByEmployeeId(employeeIdStr)
    console.log("[API] Raw timesheets from DB:", filteredTimesheets.length)

    // Improved date filtering - ensure proper date comparison
    if (startDate) {
      filteredTimesheets = filteredTimesheets.filter((ts) => {
        const tsDate = new Date(ts.date).toISOString().split('T')[0]
        return tsDate >= startDate
      })
      console.log("[API] After start date filter:", filteredTimesheets.length)
    }
    if (endDate) {
      filteredTimesheets = filteredTimesheets.filter((ts) => {
        const tsDate = new Date(ts.date).toISOString().split('T')[0]
        return tsDate <= endDate
      })
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
