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

    // Group by date để gộp nhiều ca làm việc trong cùng 1 ngày
    const groupedTimesheets = new Map<string, any>()
    
    filteredTimesheets.forEach((timesheet: any) => {
      const key = timesheet.date
      
      if (groupedTimesheets.has(key)) {
        // Gộp với timesheet đã có
        const existing = groupedTimesheets.get(key)
        
        // Cộng tổng giờ làm việc
        const newTotalHours = (existing.total_hours || existing.hours_worked || 0) + (timesheet.total_hours || timesheet.hours_worked || 0)
        
        // Tính lại regular và overtime hours
        const regularHours = Math.min(newTotalHours, 10)
        const overtimeHours = Math.max(0, newTotalHours - 10)
        
        // Cập nhật thời gian check-in sớm nhất và check-out muộn nhất
        const earliestCheckIn = [existing.check_in_time, timesheet.check_in_time]
          .filter(Boolean)
          .sort()[0] || null
        const latestCheckOut = [existing.check_out_time, timesheet.check_out_time]
          .filter(Boolean)
          .sort()
          .reverse()[0] || null
        
        groupedTimesheets.set(key, {
          ...existing,
          check_in_time: earliestCheckIn,
          check_out_time: latestCheckOut,
          total_hours: Math.round(newTotalHours * 100) / 100,
          hours_worked: Math.round(newTotalHours * 100) / 100,
          regular_hours: Math.round(regularHours * 100) / 100,
          overtime_hours: Math.round(overtimeHours * 100) / 100,
          shifts_count: existing.shifts_count + 1,
        })
      } else {
        // Timesheet đầu tiên cho ngày này
        const totalHours = timesheet.total_hours || timesheet.hours_worked || 0
        const regularHours = Math.min(totalHours, 10)
        const overtimeHours = Math.max(0, totalHours - 10)
        
        groupedTimesheets.set(key, {
          ...timesheet,
          total_hours: Math.round(totalHours * 100) / 100,
          hours_worked: Math.round(totalHours * 100) / 100,
          regular_hours: Math.round(regularHours * 100) / 100,
          overtime_hours: Math.round(overtimeHours * 100) / 100,
          shifts_count: 1,
        })
      }
    })

    // Chuyển Map thành array
    const processedTimesheets = Array.from(groupedTimesheets.values())

    // Calculate summary
    const totalHours = processedTimesheets.reduce((sum, ts) => sum + (ts.total_hours || ts.hours_worked || 0), 0)
    const totalSalary = processedTimesheets.reduce((sum, ts) => sum + (ts.salary || 0), 0)
    const totalOvertimeHours = processedTimesheets.reduce((sum, ts) => sum + (ts.overtime_hours || 0), 0)
    const totalOvertimeSalary = processedTimesheets.reduce((sum, ts) => sum + (ts.overtime_salary || 0), 0)
    const totalDays = processedTimesheets.length
    const avgHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0

    const summary = {
      totalHours: Math.round(totalHours * 100) / 100,
      totalSalary: Math.round(totalSalary),
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
      totalOvertimeSalary: Math.round(totalOvertimeSalary),
      totalDays,
      avgHoursPerDay: Math.round(avgHoursPerDay * 100) / 100,
    }

    console.log("[API] Summary calculated:", summary)

    // Sort timesheets by date (newest first)
    const sortedTimesheets = processedTimesheets.sort((a, b) => 
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
