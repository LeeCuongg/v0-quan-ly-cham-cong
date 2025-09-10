// app/api/checkin/route.ts - Phiên bản cải thiện
import { type NextRequest, NextResponse } from "next/server"
import { getAllEmployees, getTodayTimesheet, createTimesheet, updateUser } from "@/lib/database"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.role !== "employee") {
      return NextResponse.json({ error: "Only employees can check in" }, { status: 403 })
    }

    const employeeIdStr = session.userId
    const employees = await getAllEmployees()
    const employee = employees.find((emp) => emp.id === employeeIdStr)
    
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Kiểm tra xem đã check-in hôm nay chưa
    const existingTimesheet = await getTodayTimesheet(employeeIdStr)

    if (existingTimesheet && existingTimesheet.check_in) {
      return NextResponse.json({ 
        error: "Đã chấm công vào hôm nay lúc " + existingTimesheet.check_in,
        timesheet: existingTimesheet 
      }, { status: 400 })
    }

    // Tạo bản ghi chấm công mới
    const now = new Date()
    const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000) // UTC+7
    const checkInTime = vietnamTime.toTimeString().slice(0, 5)
    const today = vietnamTime.toISOString().split("T")[0]

    const newTimesheet = await createTimesheet({
      employee_id: employeeIdStr,
      date: today,
      check_in: checkInTime,
      check_out: null,
      total_hours: 0,
      salary: 0,
    })

    if (!newTimesheet) {
      return NextResponse.json({ error: "Failed to create timesheet" }, { status: 500 })
    }

    // Cập nhật trạng thái nhân viên
    await updateUser(employeeIdStr, { is_currently_working: true })

    return NextResponse.json({
      success: true,
      message: `Chấm công thành công lúc ${checkInTime}`,
      timesheet: {
        ...newTimesheet,
        checkIn: checkInTime,
        employeeName: employee.name
      },
    })
  } catch (error) {
    console.error("[v0] Checkin error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Thêm GET method để kiểm tra trạng thái
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const employeeIdStr = session.userId
    const todayTimesheet = await getTodayTimesheet(employeeIdStr)

    if (!todayTimesheet) {
      return NextResponse.json({
        status: "not-checked-in",
        canCheckIn: true,
        canCheckOut: false
      })
    }

    if (todayTimesheet.check_in && !todayTimesheet.check_out) {
      return NextResponse.json({
        status: "working",
        canCheckIn: false,
        canCheckOut: true,
        checkInTime: todayTimesheet.check_in,
        timesheet: todayTimesheet
      })
    }

    if (todayTimesheet.check_in && todayTimesheet.check_out) {
      return NextResponse.json({
        status: "finished",
        canCheckIn: false,
        canCheckOut: false,
        checkInTime: todayTimesheet.check_in,
        checkOutTime: todayTimesheet.check_out,
        totalHours: todayTimesheet.total_hours,
        timesheet: todayTimesheet
      })
    }

    return NextResponse.json({
      status: "not-checked-in",
      canCheckIn: true,
      canCheckOut: false
    })
  } catch (error) {
    console.error("[v0] Check status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
