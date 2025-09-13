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

    // Group by employee_id and date để gộp nhiều ca làm việc trong cùng 1 ngày
    const groupedTimesheets = new Map<string, any>()
    
    data?.forEach((timesheet: any) => {
      const key = `${timesheet.employee_id}-${timesheet.date}`
      
      if (groupedTimesheets.has(key)) {
        // Gộp với timesheet đã có
        const existing = groupedTimesheets.get(key)
        
        // Cộng tổng giờ làm việc
        const newTotalHours = (existing.total_hours || 0) + (timesheet.total_hours || 0)
        
        // Tính lại regular và overtime hours
        const regularHours = Math.min(newTotalHours, 10) // Tối đa 10 giờ regular
        const overtimeHours = Math.max(0, newTotalHours - 10) // Giờ vượt quá 10 giờ
        
        // Tính lại lương
        const hourlyRate = timesheet.employees?.hourly_rate || 0
        const overtimeRate = timesheet.employees?.overtime_hourly_rate || 30000
        const regularPay = regularHours * hourlyRate
        const overtimePay = overtimeHours * overtimeRate
        const totalSalary = regularPay + overtimePay
        
        // Cập nhật thời gian check-in sớm nhất và check-out muộn nhất
        const earliestCheckIn = [existing.check_in_time, timesheet.check_in_time]
          .filter(Boolean)
          .sort()[0] || null
        const latestCheckOut = [existing.check_out_time, timesheet.check_out_time]
          .filter(Boolean)
          .sort()
          .reverse()[0] || null
        
        groupedTimesheets.set(key, {
          id: existing.id, // Giữ ID của timesheet đầu tiên
          employee_id: timesheet.employee_id,
          employee_name: timesheet.employee_name || timesheet.employees?.name,
          date: timesheet.date,
          check_in_time: earliestCheckIn,
          check_out_time: latestCheckOut,
          total_hours: Math.round(newTotalHours * 100) / 100,
          regular_hours: Math.round(regularHours * 100) / 100,
          overtime_hours: Math.round(overtimeHours * 100) / 100,
          regular_pay: Math.round(regularPay),
          overtime_pay: Math.round(overtimePay),
          salary: Math.round(totalSalary),
          hourly_rate: hourlyRate,
          overtime_hourly_rate: overtimeRate,
          shifts_count: existing.shifts_count + 1, // Đếm số ca
        })
      } else {
        // Timesheet đầu tiên cho employee-date này
        const totalHours = timesheet.total_hours || 0
        const regularHours = Math.min(totalHours, 10)
        const overtimeHours = Math.max(0, totalHours - 10)
        
        const hourlyRate = timesheet.employees?.hourly_rate || 0
        const overtimeRate = timesheet.employees?.overtime_hourly_rate || 30000
        const regularPay = regularHours * hourlyRate
        const overtimePay = overtimeHours * overtimeRate
        const totalSalary = regularPay + overtimePay
        
        groupedTimesheets.set(key, {
          id: timesheet.id,
          employee_id: timesheet.employee_id,
          employee_name: timesheet.employee_name || timesheet.employees?.name,
          date: timesheet.date,
          check_in_time: timesheet.check_in_time,
          check_out_time: timesheet.check_out_time,
          total_hours: Math.round(totalHours * 100) / 100,
          regular_hours: Math.round(regularHours * 100) / 100,
          overtime_hours: Math.round(overtimeHours * 100) / 100,
          regular_pay: Math.round(regularPay),
          overtime_pay: Math.round(overtimePay),
          salary: Math.round(totalSalary),
          hourly_rate: hourlyRate,
          overtime_hourly_rate: overtimeRate,
          shifts_count: 1,
        })
      }
    })

    // Chuyển Map thành array và sắp xếp theo ngày
    const transformedData = Array.from(groupedTimesheets.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    console.log("[Timesheets API] Grouped data sample:", transformedData.slice(0, 2))

    return NextResponse.json(transformedData)

  } catch (error) {
    console.error("[Timesheets API] Error:", error)
    return NextResponse.json({ error: "Failed to fetch timesheets" }, { status: 500 })
  }
}
