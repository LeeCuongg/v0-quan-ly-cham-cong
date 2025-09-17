import { NextRequest, NextResponse } from "next/server"
import { getAllEmployees, updateTimesheet, getTimesheetById } from "@/lib/database"
import { calculateDailySalary, calculateTotalHours, validateTimeFormat } from "@/lib/salary-utils"

// Simple authentication check - you can modify this based on your auth implementation
function isAuthorized(request: NextRequest) {
  // For now, we'll allow all requests - you should implement proper auth
  return true
}

// Helper parse HH:mm -> minutes
function parseHm(value?: string | null): number | null {
  if (!value) return null
  const s = value.trim()
  const m = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(s)
  if (!m) return null
  const h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  return h * 60 + min
}

// Tổng giờ có xử lý qua ngày (checkout < checkin => +24h) 
// Sử dụng module trung tâm
function calcTotalHours(checkIn: string, checkOut: string): number {
  return calculateTotalHours(checkIn, checkOut);
}

// Chuẩn hóa time string để phục vụ validate/calc
// Hỗ trợ cả "HH:mm" và "HH:mm:ss"; trả về dạng "HH:mm"
function toHm(value?: string | null): string | null {
  if (!value) return null
  const s = value.trim()
  // HH:mm:ss -> HH:mm
  const mSec = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(s)
  if (mSec) {
    const h = mSec[1].padStart(2, "0")
    const m = mSec[2].padStart(2, "0")
    return `${h}:${m}`
  }
  // HH:mm -> HH:mm
  const mMin = /^(\d{1,2}):(\d{2})$/.exec(s)
  if (mMin) {
    const h = mMin[1].padStart(2, "0")
    const m = mMin[2].padStart(2, "0")
    return `${h}:${m}`
  }
  return null
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Simple authorization check - modify this based on your auth system
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({} as any))
    // Chấp nhận cả check_in/check_out hoặc check_in_time/check_out_time
    let {
      check_in,
      check_out,
      check_in_time,
      check_out_time,
    } = body as { check_in?: string; check_out?: string; check_in_time?: string; check_out_time?: string }
    if (!check_in && check_in_time) check_in = check_in_time
    if (!check_out && check_out_time) check_out = check_out_time
    const timesheetId = params.id

    console.log("[TS PATCH] ===== START =====")
    console.log("[TS PATCH] Params.id:", timesheetId)
    console.log("[TS PATCH] Raw body:", body)

    // Chuỗi rỗng coi như không cập nhật
    if (typeof check_in === "string" && check_in.trim() === "") check_in = undefined
    if (typeof check_out === "string" && check_out.trim() === "") check_out = undefined
    console.log("[TS PATCH] Sanitized input:", { check_in, check_out })

    // Đọc bản ghi hiện có từ database thật
    let existing: any = null
    try {
      existing = await getTimesheetById(timesheetId)
      console.log(
        "[TS PATCH] Existing found?",
        !!existing,
        existing ? { id: existing.id, employee_id: existing.employee_id } : null
      )
    } catch (ex) {
      console.warn("[TS PATCH] getTimesheetById failed, will proceed without existing. Error:", ex)
    }

    // Ghép giá trị mới với cũ (nếu có existing)
  const newCheckIn = (check_in ?? existing?.check_in_time ?? existing?.check_in) ?? null
  const newCheckOut = (check_out ?? existing?.check_out_time ?? existing?.check_out) ?? null
    console.log("[TS PATCH] Final times to use:", { newCheckIn, newCheckOut })

    // Xác định đơn giá (nếu có existing.employee_id thì lấy từ employees, nếu không có dùng mặc định)
    let hourlyRate = 23333
    let overtimeHourlyRate = 30000 // Default to 30000 instead of 1.5x hourlyRate
    try {
      if (existing?.employee_id) {
        const employees = await getAllEmployees()
        const emp = employees.find((e: any) => e.id === existing.employee_id)
        if (emp) {
          hourlyRate = Number(emp.hourly_rate || hourlyRate)
          overtimeHourlyRate = Number(emp.overtime_hourly_rate || 30000) // Use DB value or default 30000
        }
      }
    } catch (rateErr) {
      console.warn("[TS PATCH] Could not resolve rates from employees. Using defaults. Error:", (rateErr as Error)?.message)
    }
    console.log("[TS PATCH] Rates:", { hourlyRate, overtimeHourlyRate })

    // Tính toán khi đủ check_in & check_out hợp lệ
  // Chuẩn hóa về HH:mm để validate/calc (tránh lỗi khi client gửi HH:mm:ss)
  const calcIn = toHm(newCheckIn)
  const calcOut = toHm(newCheckOut)
  const canRecalculate = !!(calcIn && calcOut && validateTimeFormat(calcIn) && validateTimeFormat(calcOut))
  console.log("[TS PATCH] Can recalculate?", canRecalculate, { calcIn, calcOut })

    // Chỉ cập nhật các cột có trong bảng (theo schema ảnh)
    // Khi có đủ giờ vào/ra hợp lệ (HH:mm hoặc HH:mm:ss), sẽ tự động tính lại
    // total_hours, regular/overtime hours & pay, và salary rồi lưu xuống DB.
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Chỉ set 2 field thời gian nếu có giá trị mới hoặc có thể ghép với existing
  if (newCheckIn !== null) updateData.check_in_time = newCheckIn
  if (newCheckOut !== null) updateData.check_out_time = newCheckOut

    if (canRecalculate) {
      const totalHours = calcTotalHours(calcIn as string, calcOut as string)
      const salary = calculateDailySalary(totalHours, hourlyRate, overtimeHourlyRate)

      updateData.total_hours = salary.regularHours + salary.overtimeHours
      updateData.hours_worked = updateData.total_hours
      updateData.regular_hours = salary.regularHours
      updateData.overtime_hours = salary.overtimeHours
      updateData.regular_pay = salary.regularPay
      updateData.overtime_pay = salary.overtimePay
      updateData.salary = salary.totalPay

      console.log("[TS PATCH] Recalculated with standardized formula:", {
        total_hours: updateData.total_hours,
        regular_hours: updateData.regular_hours,
        overtime_hours: updateData.overtime_hours,
        regular_pay: updateData.regular_pay,
        overtime_pay: updateData.overtime_pay,
        salary: updateData.salary,
      })
    } else {
      console.log("[TS PATCH] Not enough data to recalc. Will only update provided time fields.")
    }

    console.log("[TS PATCH] Final updateData:", updateData)

    // Cập nhật DB
    let updated = null
    try {
      updated = await updateTimesheet(timesheetId, updateData)
      console.log("[TS PATCH] updateTimesheet result:", updated ? "OK" : "NULL")
    } catch (dbErr) {
      console.error("[TS PATCH] updateTimesheet threw error:", (dbErr as Error)?.message)
      return NextResponse.json({ error: "Failed to update timesheet", details: (dbErr as Error)?.message }, { status: 500 })
    }

    if (!updated) {
      console.error("[TS PATCH] Timesheet not found in DB when updating. ID:", timesheetId)
      return NextResponse.json({ error: "Timesheet not found" }, { status: 404 })
    }

    console.log("[TS PATCH] ===== SUCCESS =====")
    return NextResponse.json(updated)
  } catch (error) {
    console.error("[TS PATCH] ===== ERROR =====", error)
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error)?.message },
      { status: 500 }
    )
  }
}
