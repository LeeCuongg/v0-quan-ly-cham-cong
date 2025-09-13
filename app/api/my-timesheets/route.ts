import { type NextRequest, NextResponse } from "next/server"
import { getTimesheetsByEmployeeId, findUserById } from "@/lib/database"
import { getSession } from "@/lib/auth"
import { calculateDailySalary } from "@/lib/salary-utils"

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
    
    // Get employee info để lấy hourly_rate và overtime_hourly_rate
    const employee = await findUserById(employeeIdStr)
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }
    
    const hourlyRate = employee.hourly_rate || 0
    const overtimeHourlyRate = employee.overtime_hourly_rate || 30000 // Default 30k/hour
    
    console.log("[API] Employee rates:", { hourlyRate, overtimeHourlyRate })
    
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

    // Group by date để tính tổng giờ trong ngày và phân bổ overtime
    const dailyTotals = new Map<string, { totalHours: number, shifts: any[] }>()
    
    // Bước 1: Tính tổng giờ cho mỗi ngày
    filteredTimesheets.forEach((timesheet: any) => {
      const key = timesheet.date
      
      if (dailyTotals.has(key)) {
        const existing = dailyTotals.get(key)!
        existing.totalHours += (timesheet.total_hours || timesheet.hours_worked || 0)
        existing.shifts.push(timesheet)
      } else {
        dailyTotals.set(key, {
          totalHours: timesheet.total_hours || timesheet.hours_worked || 0,
          shifts: [timesheet]
        })
      }
    })

    // Bước 2: Tính lại overtime và salary cho từng ca dựa trên tổng giờ trong ngày
    const processedTimesheets: any[] = []
    
    dailyTotals.forEach((dailyData, key) => {
      const { totalHours, shifts } = dailyData
      
      // Tính regular và overtime cho ngày
      const dailyRegularHours = Math.min(totalHours, 10)
      const dailyOvertimeHours = Math.max(0, totalHours - 10)
      
      // Phân bổ overtime theo tỷ lệ giờ của từng ca
      shifts.forEach((timesheet: any, index: number) => {
        const shiftHours = timesheet.total_hours || timesheet.hours_worked || 0
        const shiftRatio = totalHours > 0 ? shiftHours / totalHours : 0
        
        // Phân bổ regular và overtime cho ca này
        const shiftRegularHours = Math.min(shiftHours, dailyRegularHours * shiftRatio)
        const shiftOvertimeHours = dailyOvertimeHours * shiftRatio
        
        // Tính lương sử dụng salary-utils
        const salaryCalc = calculateDailySalary(shiftHours, hourlyRate, overtimeHourlyRate)
        
        processedTimesheets.push({
          ...timesheet,
          total_hours: Math.round(shiftHours * 100) / 100,
          hours_worked: Math.round(shiftHours * 100) / 100,
          regular_hours: Math.round(shiftRegularHours * 100) / 100,
          overtime_hours: Math.round(shiftOvertimeHours * 100) / 100,
          regular_pay: salaryCalc.regularPay,
          overtime_pay: Math.round(shiftOvertimeHours * overtimeHourlyRate),
          overtime_salary: Math.round(shiftOvertimeHours * overtimeHourlyRate),
          // Thông tin bổ sung về ngày
          daily_total_hours: Math.round(totalHours * 100) / 100,
          daily_regular_hours: Math.round(dailyRegularHours * 100) / 100,
          daily_overtime_hours: Math.round(dailyOvertimeHours * 100) / 100,
          shift_number: index + 1,
          total_shifts_in_day: shifts.length,
        })
      })
    })

    // Calculate summary
    const totalHours = processedTimesheets.reduce((sum, ts) => sum + (ts.total_hours || ts.hours_worked || 0), 0)
    const totalSalary = processedTimesheets.reduce((sum, ts) => sum + (ts.salary || 0), 0)
    const totalOvertimeHours = processedTimesheets.reduce((sum, ts) => sum + (ts.overtime_hours || 0), 0)
    const totalOvertimeSalary = processedTimesheets.reduce((sum, ts) => sum + (ts.overtime_pay || ts.overtime_salary || 0), 0)
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
      details: (error as Error).message 
    }, { status: 500 })
  }
}
