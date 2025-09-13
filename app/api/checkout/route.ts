import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import {
  getAllEmployees,
  updateTimesheet,
  updateUser,
  getActiveTimesheet,
  getTodayTimesheets,
} from "@/lib/database"

// New: Tính lương với ca làm 10 tiếng
function computeSalary10h(totalHours: number, hourlyRate: number, overtimeHourlyRate: number) {
  const regularHours = Math.min(totalHours, 10)
  const overtimeHours = Math.max(totalHours - 10, 0)
  const regularPay = Math.round(regularHours * hourlyRate)
  const overtimePay = Math.round(overtimeHours * overtimeHourlyRate)
  const totalPay = regularPay + overtimePay
  return { regularHours, overtimeHours, regularPay, overtimePay, totalPay }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[API] ===== CHECKOUT REQUEST START =====")

    // Lấy body request
    const body = await request.json().catch((e) => {
      console.log("[API] No JSON body or invalid JSON:", e)
      return {}
    })

    console.log("[API] Request body:", body)

    const session = await getSession()
    console.log("[API] Session:", session)

    if (!session) {
      console.log("[API] No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.role !== "employee") {
      console.log("[API] Invalid role:", session.role)
      return NextResponse.json({ error: "Only employees can check out" }, { status: 403 })
    }

    const employeeIdStr = session.userId
    console.log("[API] Employee ID:", employeeIdStr)

    const employees = await getAllEmployees()
    console.log("[API] Total employees found:", employees.length)

    const employee = employees.find((emp) => emp.id === employeeIdStr)
    console.log("[API] Employee found:", employee ? "YES" : "NO")
    console.log("[API] Employee data:", employee)

    if (!employee) {
      console.log("[API] Employee not found for ID:", employeeIdStr)
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    console.log("[API] Finding current active session...")
    const activeTimesheet = await getActiveTimesheet(employeeIdStr)

    if (!activeTimesheet) {
      console.log("[API] No active session found")
      return NextResponse.json(
        {
          error: "Không có phiên làm việc đang hoạt động. Vui lòng check-in trước.",
        },
        { status: 400 },
      )
    }

    console.log("[API] Active timesheet found:", activeTimesheet)

    // Tính toán thời gian checkout - sử dụng thời gian từ client hoặc server
    let checkOutTime: string

    if (body.checkoutTime) {
      // Nếu client gửi thời gian checkout
      checkOutTime = body.checkoutTime
      console.log("[API] Using client checkout time:", checkOutTime)
    } else {
      // Tính toán thời gian server với timezone Vietnam
      try {
        const now = new Date()
        // Tạo date object với timezone Vietnam (UTC+7)
        const vietnamTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }))
        checkOutTime = vietnamTime.toTimeString().slice(0, 5) // "HH:MM"
        console.log("[API] Using server checkout time:", checkOutTime)
      } catch (timezoneError) {
        console.log("[API] Timezone calculation failed, using UTC+7 fallback")
        const now = new Date()
        const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000)
        checkOutTime = vietnamTime.toTimeString().slice(0, 5)
      }
    }

    console.log("[API] Final checkout time:", checkOutTime)

    // Sử dụng check_in_time để tính toán
    const checkInTimeStr = activeTimesheet.check_in_time
    if (!checkInTimeStr) {
      return NextResponse.json(
        {
          error: "Không tìm thấy thời gian check-in.",
        },
        { status: 400 },
      )
    }

    // Tính toán tổng thời gian làm việc
    const totalHours = calculateTotalHours(checkInTimeStr, checkOutTime)

    // Tính lương với overtime (ca 10 tiếng)
    const salaryCalculation = computeSalary10h(
      totalHours,
      employee.hourly_rate,
      employee.overtime_hourly_rate || 30000,
    )

    console.log("[API] Salary calculation with overtime:", salaryCalculation)

    // Chuẩn bị dữ liệu update
    const updateData = {
      check_out_time: checkOutTime,
      total_hours: Math.round(totalHours * 100) / 100,
      regular_hours: salaryCalculation.regularHours,
      overtime_hours: salaryCalculation.overtimeHours,
      regular_pay: salaryCalculation.regularPay,
      overtime_pay: salaryCalculation.overtimePay,
      salary: salaryCalculation.totalPay,
      hourly_rate: employee.hourly_rate,
      overtime_hourly_rate: employee.overtime_hourly_rate || 30000,
    }

    console.log("[API] Update data:", updateData)

    console.log("[API] Updating active timesheet...")
    let updatedTimesheet
    try {
      updatedTimesheet = await updateTimesheet(activeTimesheet.id, updateData)
      console.log("[API] Raw updateTimesheet result:", updatedTimesheet)
    } catch (updateError) {
      console.error("[API] Timesheet update error:", updateError)
      return NextResponse.json(
        {
          error: "Lỗi cập nhật bản ghi chấm công: " + ((updateError as Error)?.message || "Unknown error"),
          details: {
            timesheetId: activeTimesheet.id,
            updateData,
            originalError: (updateError as Error)?.message,
            errorType: (updateError as Error)?.name,
          },
        },
        { status: 500 },
      )
    }

    if (!updatedTimesheet) {
      console.error("[API] Failed to update timesheet - null/undefined result")
      return NextResponse.json(
        {
          error: "Không thể cập nhật bản ghi chấm công",
          details: { timesheetId: activeTimesheet.id, updateData },
        },
        { status: 500 },
      )
    }

    console.log("[API] Successfully updated timesheet:", updatedTimesheet)

    const todayTimesheets = await getTodayTimesheets(employeeIdStr)
    const remainingActiveSessions = todayTimesheets?.filter(
      (ts) => ts.id !== activeTimesheet.id && ts.check_in_time && !ts.check_out_time,
    )

    const isStillWorking = remainingActiveSessions && remainingActiveSessions.length > 0

    // Cập nhật trạng thái nhân viên
    console.log("[API] Updating employee working status...")
    const employeeUpdateData = {
      is_currently_working: isStillWorking, // Only set to false if no other active sessions
      total_hours_this_month: (employee.total_hours_this_month || 0) + totalHours,
    }
    console.log("[API] Employee update data:", employeeUpdateData)

    try {
      const updateResult = await updateUser(employeeIdStr, employeeUpdateData)
      console.log("[API] Employee update result:", updateResult)
    } catch (employeeUpdateError) {
      console.error("[API] Employee update error:", employeeUpdateError)
      console.warn("[API] Warning: Employee status update failed, but checkout succeeded")
    }

    const response = {
      success: true,
      message: `Check-out thành công lúc ${checkOutTime}. Bạn đã làm ${totalHours.toFixed(1)} giờ trong phiên này.`,
      timesheet: {
        ...updatedTimesheet,
        checkOut: checkOutTime,
        totalHours,
        regularHours: salaryCalculation.regularHours,
        overtimeHours: salaryCalculation.overtimeHours,
        regularPay: salaryCalculation.regularPay,
        overtimePay: salaryCalculation.overtimePay,
        totalSalary: salaryCalculation.totalPay,
        overtimeHourlyRate: employee.overtime_hourly_rate || 30000,
        employeeName: employee.name,
      },
      summary: {
        checkInTime: checkInTimeStr,
        checkOutTime: checkOutTime,
        totalHours: totalHours.toFixed(1),
        salary: Math.round(salaryCalculation.totalPay),
        hourlyRate: employee.hourly_rate,
      },
    }

    console.log("[API] Sending checkout response:", response)
    console.log("[API] ===== CHECKOUT REQUEST END =====")

    return NextResponse.json(response)
  } catch (error) {
    console.error("[API] ===== CHECKOUT ERROR =====")
    console.error("[API] Error:", error)
    console.error("[API] Error stack:", (error as Error)?.stack)
    console.error("[API] ==============================")

    return NextResponse.json(
      {
        error: "Internal server error",
        details: (error as Error)?.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const employeeIdStr = session.userId

    const todayTimesheets = await getTodayTimesheets(employeeIdStr)
    const activeSession = await getActiveTimesheet(employeeIdStr)

    const hasActiveSession = !!activeSession
    const latestSession = todayTimesheets?.[0]

    return NextResponse.json({
      canCheckOut: hasActiveSession,
      hasCheckedIn: todayTimesheets && todayTimesheets.length > 0,
      hasActiveSession,
      checkInTime: activeSession?.check_in_time,
      checkOutTime: activeSession?.check_out_time,
      timesheet: activeSession || latestSession,
      totalSessions: todayTimesheets?.length || 0,
    })
  } catch (error) {
    console.error("[API] Check checkout status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function calculateTotalHours(checkIn: string, checkOut: string): number {
  const [checkInHour, checkInMinute] = checkIn.split(":").map(Number)
  const [checkOutHour, checkOutMinute] = checkOut.split(":").map(Number)

  const checkInTime = checkInHour * 60 + checkInMinute
  const checkOutTime = checkOutHour * 60 + checkOutMinute

  let totalMinutes = checkOutTime - checkInTime

  // Handle next day checkout
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60
  }

  return Math.round((totalMinutes / 60) * 100) / 100
}
