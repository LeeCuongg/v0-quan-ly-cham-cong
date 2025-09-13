import { NextRequest, NextResponse } from "next/server"
import { getAllEmployees, updateTimesheet } from "@/lib/database"

// Simple authentication check - you can modify this based on your auth implementation
function isAuthorized(request: NextRequest) {
  // For now, we'll allow all requests - you should implement proper auth
  return true
}

// Helper function to read mock data from the main timesheets API
async function readTimesheetsData() {
  try {
    // Since we can't access the file system in Vercel, we'll make an internal API call
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/timesheets`, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (response.ok) {
      return await response.json()
    }
    return []
  } catch (error) {
    console.error('Error reading timesheets data:', error)
    return []
  }
}

// Helper parse HH:mm -> minutes
function parseHm(value?: string | null): number | null {
  if (!value) return null
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim())
  if (!m) return null
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10)
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

    // Chuỗi rỗng coi như không cập nhật
    if (typeof check_in === "string" && check_in.trim() === "") check_in = undefined
    if (typeof check_out === "string" && check_out.trim() === "") check_out = undefined

    // Lấy bản ghi hiện có từ API chính (đang kết nối DB)
    const all = await readTimesheetsData()
    const existing = Array.isArray(all) ? all.find((t: any) => t.id === timesheetId) : null
    if (!existing) {
      return NextResponse.json({ error: "Timesheet not found" }, { status: 404 })
    }

    // Ghép giá trị mới với cũ
    const newCheckIn = check_in ?? existing.check_in_time ?? existing.check_in ?? null
    const newCheckOut = check_out ?? existing.check_out_time ?? existing.check_out ?? null

    // Xác định đơn giá
    let hourlyRate = Number(existing?.hourly_rate) || 0
    let overtimeHourlyRate = Number(existing?.overtime_hourly_rate) || 0
    if (!hourlyRate || !overtimeHourlyRate) {
      try {
        const employees = await getAllEmployees()
        const emp = employees.find((e: any) => e.id === existing.employee_id)
        if (emp) {
          hourlyRate = emp.hourly_rate || hourlyRate || 23333
          overtimeHourlyRate = emp.overtime_hourly_rate || Math.round(hourlyRate * 1.5)
        } else {
          hourlyRate = hourlyRate || 23333
          overtimeHourlyRate = overtimeHourlyRate || Math.round(hourlyRate * 1.5)
        }
      } catch {
        hourlyRate = hourlyRate || 23333
        overtimeHourlyRate = overtimeHourlyRate || Math.round(hourlyRate * 1.5)
      }
    }

    // Tính toán khi đủ check_in & check_out hợp lệ
    const canRecalculate = parseHm(newCheckIn) != null && parseHm(newCheckOut) != null
    let updateData: any = {
      check_in_time: newCheckIn ?? "",
      check_out_time: newCheckOut ?? "",
      // ...giữ nguyên các field khác nếu chưa đủ dữ liệu để tính
    }

    if (canRecalculate) {
      const totalHours = calcTotalHours(newCheckIn as string, newCheckOut as string)
      const salary = computeSalary10h(totalHours, hourlyRate, overtimeHourlyRate)
      updateData = {
        ...updateData,
        total_hours: Math.round(totalHours * 100) / 100,
        regular_hours: salary.regularHours,
        overtime_hours: salary.overtimeHours,
        regular_pay: salary.regularPay,
        overtime_pay: salary.overtimePay,
        salary: salary.totalPay,
        hourly_rate: hourlyRate,
        overtime_hourly_rate: overtimeHourlyRate,
      }
    }

    // Cập nhật DB
    const updated = await updateTimesheet(timesheetId, updateData)
    if (!updated) {
      return NextResponse.json({ error: "Failed to update timesheet" }, { status: 500 })
    }

    // Trả về bản ghi đã cập nhật (DB source of truth)
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating timesheet:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
