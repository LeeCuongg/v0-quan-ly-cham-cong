import { NextRequest, NextResponse } from "next/server"
import { getAllEmployees, updateTimesheet, getTimesheetById } from "@/lib/database"

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
function calcTotalHours(checkIn: string, checkOut: string): number {
  const inMin = parseHm(checkIn)
  const outMin = parseHm(checkOut)
  if (inMin == null || outMin == null) return 0
  let diff = outMin - inMin
  if (diff < 0) diff += 24 * 60
  return Math.round((diff / 60) * 100) / 100
}

// New: Tính lương với ca làm 10 tiếng
function computeSalary10h(totalHours: number, hourlyRate: number, overtimeHourlyRate: number) {
  const regularHours = Math.min(totalHours, 10)
  const overtimeHours = Math.max(totalHours - 10, 0)
  const regularPay = Math.round(regularHours * hourlyRate)
  const overtimePay = Math.round(overtimeHours * overtimeHourlyRate)
  const totalPay = regularPay + overtimePay
  return { regularHours, overtimeHours, regularPay, overtimePay, totalPay }
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
    let { check_in, check_out } = body as { check_in?: string; check_out?: string }
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
    const canRecalculate = parseHm(newCheckIn) != null && parseHm(newCheckOut) != null
    console.log("[TS PATCH] Can recalculate?", canRecalculate)

    // Chỉ cập nhật các cột có trong bảng (theo schema ảnh)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Chỉ set 2 field thời gian nếu có giá trị mới hoặc có thể ghép với existing
    if (newCheckIn !== null) updateData.check_in_time = newCheckIn
    if (newCheckOut !== null) updateData.check_out_time = newCheckOut

    if (canRecalculate) {
      const totalHours = calcTotalHours(newCheckIn as string, newCheckOut as string)
      const salary = computeSalary10h(totalHours, hourlyRate, overtimeHourlyRate)

      updateData.total_hours = Math.round(totalHours * 100) / 100
      updateData.hours_worked = updateData.total_hours
      updateData.regular_hours = salary.regularHours
      updateData.overtime_hours = salary.overtimeHours
      updateData.regular_pay = salary.regularPay
      updateData.overtime_pay = salary.overtimePay
      updateData.salary = salary.totalPay

      console.log("[TS PATCH] Recalculated:", {
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
