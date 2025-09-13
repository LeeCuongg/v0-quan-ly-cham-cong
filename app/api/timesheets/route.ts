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

    // Group by employee_id and date để tính tổng giờ trong ngày
    const dailyTotals = new Map<string, { totalHours: number, shifts: any[] }>()
    
    // Bước 1: Tính tổng giờ cho mỗi employee-date
    data?.forEach((timesheet: any) => {
      const key = `${timesheet.employee_id}-${timesheet.date}`
      
      if (dailyTotals.has(key)) {
        const existing = dailyTotals.get(key)!
        existing.totalHours += (timesheet.total_hours || 0)
        existing.shifts.push(timesheet)
      } else {
        dailyTotals.set(key, {
          totalHours: timesheet.total_hours || 0,
          shifts: [timesheet]
        })
      }
    })

    // Bước 2: Tính lại overtime và salary cho từng ca dựa trên tổng giờ trong ngày
    const transformedData: any[] = []
    
    dailyTotals.forEach((dailyData, key) => {
      const { totalHours, shifts } = dailyData
      
      // Tính regular và overtime cho ngày
      const dailyRegularHours = Math.min(totalHours, 10)
      const dailyOvertimeHours = Math.max(0, totalHours - 10)
      
      // Sắp xếp shifts theo thời gian check-in để xác định ca cuối cùng
      const sortedShifts = shifts.sort((a, b) => {
        const timeA = a.check_in_time || "00:00:00"
        const timeB = b.check_in_time || "00:00:00"
        return timeA.localeCompare(timeB)
      })
      
      // Xác định ca cuối cùng (check-in muộn nhất)
      const lastShiftIndex = sortedShifts.length - 1
      
      sortedShifts.forEach((timesheet: any, index: number) => {
        const shiftHours = timesheet.total_hours || 0
        const hourlyRate = timesheet.employees?.hourly_rate || 0
        const overtimeRate = timesheet.employees?.overtime_hourly_rate || 30000
        
        let shiftRegularHours = shiftHours
        let shiftOvertimeHours = 0
        let regularPay = shiftHours * hourlyRate
        let overtimePay = 0
        
        // Chỉ ca cuối cùng mới được tính overtime
        if (index === lastShiftIndex && dailyOvertimeHours > 0) {
          // Ca cuối cùng: phân bổ regular hours theo tỷ lệ và gán tất cả overtime cho ca này
          const shiftRatio = totalHours > 0 ? shiftHours / totalHours : 0
          shiftRegularHours = Math.min(shiftHours, dailyRegularHours * shiftRatio)
          shiftOvertimeHours = dailyOvertimeHours // Tất cả overtime cho ca cuối
          
          regularPay = shiftRegularHours * hourlyRate
          overtimePay = shiftOvertimeHours * overtimeRate
        } else {
          // Các ca khác: chỉ có regular pay
          shiftRegularHours = shiftHours
          shiftOvertimeHours = 0
          regularPay = shiftHours * hourlyRate
          overtimePay = 0
        }
        
        const totalSalary = regularPay + overtimePay
        
        transformedData.push({
          id: timesheet.id,
          employee_id: timesheet.employee_id,
          employee_name: timesheet.employee_name || timesheet.employees?.name,
          date: timesheet.date,
          check_in_time: timesheet.check_in_time,
          check_out_time: timesheet.check_out_time,
          total_hours: Math.round(shiftHours * 100) / 100,
          regular_hours: Math.round(shiftRegularHours * 100) / 100,
          overtime_hours: Math.round(shiftOvertimeHours * 100) / 100,
          regular_pay: Math.round(regularPay),
          overtime_pay: Math.round(overtimePay),
          salary: Math.round(totalSalary),
          hourly_rate: hourlyRate,
          overtime_hourly_rate: overtimeRate,
          // Thông tin bổ sung về ngày
          daily_total_hours: Math.round(totalHours * 100) / 100,
          daily_regular_hours: Math.round(dailyRegularHours * 100) / 100,
          daily_overtime_hours: Math.round(dailyOvertimeHours * 100) / 100,
          shift_number: index + 1,
          total_shifts_in_day: shifts.length,
        })
      })
    })

    // Sắp xếp theo ngày và ca
    const sortedData = transformedData.sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime()
      if (dateCompare !== 0) return dateCompare
      return a.shift_number - b.shift_number
    })

    console.log("[Timesheets API] Processed data sample:", sortedData.slice(0, 3))

    return NextResponse.json(sortedData)

  } catch (error) {
    console.error("[Timesheets API] Error:", error)
    return NextResponse.json({ error: "Failed to fetch timesheets" }, { status: 500 })
  }
}
