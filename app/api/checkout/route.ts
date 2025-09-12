import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { getAllEmployees, getTodayTimesheet, updateTimesheet, updateUser, calculateSalaryWithOvertime } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    console.log("[API] ===== CHECKOUT REQUEST START =====")
    
    // Lấy body request
    const body = await request.json().catch(e => {
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

    // Tìm bản ghi chấm công hôm nay
    console.log("[API] Finding today's timesheet...")
    const timesheet = await getTodayTimesheet(employeeIdStr)
    console.log("[API] Today's timesheet:", timesheet)

    if (!timesheet) {
      console.log("[API] No timesheet found for today")
      return NextResponse.json({ 
        error: "Chưa có bản ghi chấm công hôm nay. Vui lòng check-in trước." 
      }, { status: 400 })
    }

    if (!timesheet.check_in_time && !timesheet.check_in) {
      console.log("[API] No check-in time found")
      return NextResponse.json({ 
        error: "Chưa chấm công vào. Vui lòng check-in trước." 
      }, { status: 400 })
    }

    if (timesheet.check_out_time || timesheet.check_out) {
      console.log("[API] Already checked out")
      const checkOutTime = timesheet.check_out_time || 
        (timesheet.check_out ? new Date(timesheet.check_out).toTimeString().slice(0, 5) : null)
      return NextResponse.json({ 
        error: "Đã check-out hôm nay lúc " + checkOutTime,
        timesheet 
      }, { status: 400 })
    }

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
        const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}))
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
    const checkInTimeStr = timesheet.check_in_time
    if (!checkInTimeStr) {
      return NextResponse.json({ 
        error: "Không tìm thấy thời gian check-in." 
      }, { status: 400 })
    }

    // Kiểm tra thời gian tối thiểu (ví dụ: phải làm ít nhất 30 phút)
    const totalHours = calculateTotalHours(checkInTimeStr, checkOutTime)
    
    if (totalHours < 0.5) {
      return NextResponse.json({ 
        error: `Thời gian làm việc quá ngắn (${totalHours.toFixed(1)} giờ). Tối thiểu 30 phút.` 
      }, { status: 400 })
    }

    // Tính lương với overtime
    const salaryCalculation = calculateSalaryWithOvertime(
      totalHours,
      employee.hourly_rate,
      employee.overtime_hourly_rate || 30000
    );

    console.log("[API] Salary calculation with overtime:", salaryCalculation)

    // Chuẩn bị dữ liệu update với overtime
    const updateData = {
      check_out_time: checkOutTime,
      total_hours: Math.round(totalHours * 100) / 100,
      regular_hours: salaryCalculation.regularHours,
      overtime_hours: salaryCalculation.overtimeHours,
      regular_pay: salaryCalculation.regularPay,
      overtime_pay: salaryCalculation.overtimePay,
      salary: salaryCalculation.totalPay,
      hourly_rate: employee.hourly_rate,
      overtime_hourly_rate: employee.overtime_hourly_rate || 30000
    }
    
    console.log("[API] Update data:", updateData)
    console.log("[API] Timesheet ID to update:", timesheet.id)
    console.log("[API] Timesheet ID type:", typeof timesheet.id)
    console.log("[API] Current timesheet state:", {
      id: timesheet.id,
      check_in_time: timesheet.check_in_time,
      check_out_time: timesheet.check_out_time,
      employee_id: timesheet.employee_id
    })

    // Validate update data before attempting update
    if (!timesheet.id) {
      console.error("[API] Invalid timesheet ID:", timesheet.id)
      return NextResponse.json({ 
        error: "ID bản ghi chấm công không hợp lệ",
        details: { timesheetId: timesheet.id }
      }, { status: 400 })
    }

    // Validate required update fields
    const requiredFields = ['check_out_time', 'total_hours', 'salary']
    for (const field of requiredFields) {
      if (updateData[field] === undefined || updateData[field] === null) {
        console.error(`[API] Missing required field: ${field}`, updateData[field])
        return NextResponse.json({ 
          error: `Thiếu dữ liệu bắt buộc: ${field}`,
          details: { field, value: updateData[field] }
        }, { status: 400 })
      }
    }

    // Cập nhật bản ghi chấm công với error handling chi tiết
    console.log("[API] Updating timesheet...")
    let updatedTimesheet
    try {
      console.log("[API] Calling updateTimesheet with:", {
        id: timesheet.id,
        updateData: updateData
      })
      
      updatedTimesheet = await updateTimesheet(timesheet.id, updateData)
      
      console.log("[API] Raw updateTimesheet result:", updatedTimesheet)
      console.log("[API] Result type:", typeof updatedTimesheet)
      console.log("[API] Result is null:", updatedTimesheet === null)
      console.log("[API] Result is undefined:", updatedTimesheet === undefined)
      
    } catch (updateError) {
      console.error("[API] Timesheet update error:", updateError)
      console.error("[API] Update error details:", {
        timesheetId: timesheet.id,
        updateData,
        errorMessage: updateError?.message,
        errorStack: updateError?.stack,
        errorName: updateError?.name
      })
      
      return NextResponse.json({ 
        error: "Lỗi cập nhật bản ghi chấm công: " + (updateError?.message || "Unknown error"),
        details: {
          timesheetId: timesheet.id,
          updateData,
          originalError: updateError?.message,
          errorType: updateError?.name
        }
      }, { status: 500 })
    }

    // Check if update result is null or undefined
    if (!updatedTimesheet) {
      console.error("[API] Failed to update timesheet - null/undefined result")
      console.error("[API] Debug info:", {
        timesheetId: timesheet.id,
        updateData,
        resultType: typeof updatedTimesheet,
        isNull: updatedTimesheet === null,
        isUndefined: updatedTimesheet === undefined
      })
      
      // Try to get the timesheet again to see if it was actually updated
      let verificationTimesheet
      try {
        verificationTimesheet = await getTodayTimesheet(employeeIdStr)
        console.log("[API] Verification timesheet:", verificationTimesheet)
        
        // Check if the update actually worked by comparing check_out_time
        if (verificationTimesheet && verificationTimesheet.check_out_time === checkOutTime) {
          console.log("[API] Update was successful, using verification timesheet")
          updatedTimesheet = verificationTimesheet
        } else {
          console.error("[API] Update verification failed - checkout time doesn't match")
          return NextResponse.json({ 
            error: "Không thể cập nhật bản ghi chấm công - xác thực thất bại",
            details: {
              timesheetId: timesheet.id,
              updateData,
              expectedCheckoutTime: checkOutTime,
              actualCheckoutTime: verificationTimesheet?.check_out_time,
              verificationTimesheet: verificationTimesheet || "Could not retrieve"
            }
          }, { status: 500 })
        }
      } catch (verifyError) {
        console.error("[API] Failed to verify timesheet update:", verifyError)
        return NextResponse.json({ 
          error: "Không thể cập nhật bản ghi chấm công - không thể xác thực",
          details: {
            timesheetId: timesheet.id,
            updateData,
            resultType: typeof updatedTimesheet,
            verificationError: (verifyError as Error)?.message
          }
        }, { status: 500 })
      }
    }

    console.log("[API] Successfully updated timesheet:", updatedTimesheet)

    // Cập nhật trạng thái nhân viên với error handling
    console.log("[API] Updating employee working status...")
    const employeeUpdateData = { 
      is_currently_working: false,
      total_hours_this_month: (employee.total_hours_this_month || 0) + totalHours
    }
    console.log("[API] Employee update data:", employeeUpdateData)
    
    let updateResult
    try {
      updateResult = await updateUser(employeeIdStr, employeeUpdateData)
      console.log("[API] Employee update result:", updateResult)
    } catch (employeeUpdateError) {
      console.error("[API] Employee update error:", employeeUpdateError)
      // Không fail checkout nếu update employee thất bại, chỉ log warning
      console.warn("[API] Warning: Employee status update failed, but checkout succeeded")
    }

    const response = {
      success: true,
      message: `Check-out thành công lúc ${checkOutTime}. Bạn đã làm ${totalHours.toFixed(1)} giờ.`,
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
        employeeName: employee.name
      },
      summary: {
        checkInTime: checkInTimeStr,
        checkOutTime: checkOutTime,
        totalHours: totalHours.toFixed(1),
        salary: Math.round(salaryCalculation.totalPay),
        hourlyRate: employee.hourly_rate
      }
    }
    
    console.log("[API] Sending checkout response:", response)
    console.log("[API] ===== CHECKOUT REQUEST END =====")
    
    return NextResponse.json(response)

  } catch (error) {
    console.error("[API] ===== CHECKOUT ERROR =====")
    console.error("[API] Error:", error)
    console.error("[API] Error stack:", (error as Error)?.stack)
    console.error("[API] ============================")
    
    return NextResponse.json({ 
      error: "Internal server error",
      details: (error as Error)?.message || "Unknown error"
    }, { status: 500 })
  }
}

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
        canCheckOut: false,
        reason: "No timesheet found for today"
      })
    }

    const hasCheckedIn = !!(todayTimesheet.check_in_time || todayTimesheet.check_in)
    const hasCheckedOut = !!(todayTimesheet.check_out_time || todayTimesheet.check_out)

    return NextResponse.json({
      canCheckOut: hasCheckedIn && !hasCheckedOut,
      hasCheckedIn,
      hasCheckedOut,
      checkInTime: todayTimesheet.check_in_time,
      checkOutTime: todayTimesheet.check_out_time,
      timesheet: todayTimesheet
    })
  } catch (error) {
    console.error("[API] Check checkout status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function calculateTotalHours(checkIn: string, checkOut: string): number {
  const [checkInHour, checkInMinute] = checkIn.split(':').map(Number);
  const [checkOutHour, checkOutMinute] = checkOut.split(':').map(Number);
  
  const checkInTime = checkInHour * 60 + checkInMinute;
  const checkOutTime = checkOutHour * 60 + checkOutMinute;
  
  let totalMinutes = checkOutTime - checkInTime;
  
  // Handle next day checkout
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
  }
  
  return Math.round((totalMinutes / 60) * 100) / 100;
}
