// app/api/checkout/route.ts - Phiên bản cải thiện
import { type NextRequest, NextResponse } from "next/server"
import {
  getAllEmployees,
  getTodayTimesheet,
  updateTimesheet,
  updateUser,
  calculateTotalHours,
  calculateSalary,
} from "@/lib/database"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.role !== "employee") {
      return NextResponse.json({ error: "Only employees can check out" }, { status: 403 })
    }

    const employeeIdStr = session.userId
    const employees = await getAllEmployees()
    const employee = employees.find((emp) => emp.id === employeeIdStr)
    
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Tìm bản ghi chấm công hôm nay
    const timesheet = await getTodayTimesheet(employeeIdStr)

    if (!timesheet || !timesheet.check_in) {
      return NextResponse.json({ 
        error: "Chưa chấm công vào. Vui lòng check-in trước." 
      }, { status: 400 })
    }

    if (timesheet.check_out) {
      return NextResponse.json({ 
        error: "Đã check-out lúc " + timesheet.check_out,
        timesheet 
      }, { status: 400 })
    }

    // Tính toán thời gian làm việc
    const now = new Date()
    const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000) // UTC+7
    const checkOutTime = vietnamTime.toTimeString().slice(0, 5)

    // Kiểm tra thời gian tối thiểu (ví dụ: phải làm ít nhất 1 giờ)
    const totalHours = calculateTotalHours(timesheet.check_in, checkOutTime)
    
    if (totalHours < 0.5) {
      return NextResponse.json({ 
        error: "Thời gian làm việc quá ngắn. Tối thiểu 30 phút." 
      }, { status: 400 })
    }

    const salary = calculateSalary(totalHours, employee.hourly_rate)

    // Cập nhật bản ghi chấm công
    const updatedTimesheet = await updateTimesheet(timesheet.id, {
      check_out: checkOutTime,
      total_hours: Math.round(totalHours * 100) / 100,
      salary: Math.round(salary),
    })

    // Cập nhật trạng thái nhân viên
    await updateUser(employeeIdStr, { 
      is_currently_working: false,
      total_hours_this_month: employee.total_hours_this_month + totalHours
    })

    return NextResponse.json({
      success: true,
      message: `Check-out thành công lúc ${checkOutTime}. Bạn đã làm ${totalHours.toFixed(1)} giờ.`,
      timesheet: {
        ...updatedTimesheet,
        checkOut: checkOutTime,
        totalHours,
        salary: Math.round(salary),
        employeeName: employee.name
      },
    })
  } catch (error) {
    console.error("[v0] Checkout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
