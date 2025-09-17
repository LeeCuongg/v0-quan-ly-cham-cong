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
      
      // Sắp xếp shifts theo thời gian check-in để xác định ca cuối cùng
      const sortedShifts = shifts.sort((a, b) => {
        const timeA = a.check_in_time || a.check_in || "00:00:00"
        const timeB = b.check_in_time || b.check_in || "00:00:00"
        return timeA.localeCompare(timeB)
      })

  // Phân bổ 10 giờ cơ bản theo thứ tự ca; phần vượt được tính tăng ca.
  // Mục tiêu: Không để phần overtime trong ngày bị tính vào lương cơ bản của các ca trước đó.
      let remainingRegular = dailyRegularHours

      sortedShifts.forEach((timesheet: any, index: number) => {
        const shiftHours = timesheet.total_hours || timesheet.hours_worked || 0

        const shiftRegularHours = Math.max(0, Math.min(shiftHours, remainingRegular))
        const shiftOvertimeHours = Math.max(0, roundTo3(shiftHours - shiftRegularHours))

        remainingRegular = roundTo3(Math.max(0, remainingRegular - shiftRegularHours))

        const regularPay = Math.round(shiftRegularHours * hourlyRate)
        const overtimePay = Math.round(shiftOvertimeHours * overtimeHourlyRate)

        processedTimesheets.push({
          ...timesheet,
          total_hours: roundTo3(shiftHours),
          hours_worked: roundTo3(shiftHours),
          regular_hours: roundTo3(shiftRegularHours),
          overtime_hours: roundTo3(shiftOvertimeHours),
          regular_pay: regularPay,
          overtime_pay: overtimePay,
          overtime_salary: overtimePay,
          salary: regularPay + overtimePay, // Tổng lương thực tế của ca này
          // Thông tin bổ sung về ngày
          daily_total_hours: roundTo3(totalHours),
          daily_regular_hours: roundTo3(dailyRegularHours),
          daily_overtime_hours: roundTo3(dailyOvertimeHours),
          shift_number: index + 1,
          total_shifts_in_day: sortedShifts.length,
        })
      })
    })

    // Calculate summary (base and OT separated to tránh double-count)
    const totalHours = processedTimesheets.reduce((sum, ts) => sum + (ts.total_hours || ts.hours_worked || 0), 0)
    const baseSalary = processedTimesheets.reduce((sum, ts) => sum + (ts.regular_pay || 0), 0)
    const totalOvertimeHours = processedTimesheets.reduce((sum, ts) => sum + (ts.overtime_hours || 0), 0)
    const totalOvertimeSalary = processedTimesheets.reduce((sum, ts) => sum + (ts.overtime_pay || ts.overtime_salary || 0), 0)
    const totalDays = processedTimesheets.length
    const avgHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0

    const summary = {
      totalHours: Math.round(totalHours * 1000) / 1000,
      totalSalary: Math.round(baseSalary),
      totalOvertimeHours: Math.round(totalOvertimeHours * 1000) / 1000,
      totalOvertimeSalary: Math.round(totalOvertimeSalary),
      totalDays,
      avgHoursPerDay: Math.round(avgHoursPerDay * 1000) / 1000,
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

// Helpers để làm tròn nhất quán
function roundTo3(n: number) { return Math.round(n * 1000) / 1000 }
