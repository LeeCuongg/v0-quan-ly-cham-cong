import { NextRequest, NextResponse } from "next/server"
import { getAllEmployees, updateTimesheet, getTimesheetById } from "@/lib/database"

// Simple authentication check - you can modify this based on your auth implementation
function isAuthorized(request: NextRequest) {
  // For now, we'll allow all requests - you should implement proper auth
  return true
}

// Helper function to read mock data from the main timesheets API
// NOTE: vẫn giữ để debug nếu cần, nhưng không còn dùng để tìm bản ghi trong PATCH
async function readTimesheetsData() {
  try {
    // Since we can't access the file system in Vercel, we'll make an internal API call
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
    const url = `${baseUrl}/api/timesheets`

    console.log("[TS READ] baseUrl:", baseUrl)
    console.log("[TS READ] fetching:", url)

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    console.log("[TS READ] response.ok:", response.ok, "status:", response.status)

    if (response.ok) {
      let json: any
      try {
        json = await response.json()
      } catch (e) {
        console.error("[TS READ] JSON parse error:", e)
        return []
      }

      if (Array.isArray(json)) {
        console.log("[TS READ] timesheets count:", json.length)
        const sampleIds = json.slice(0, 5).map((t: any) => t?.id)
        console.log("[TS READ] sample ids:", sampleIds)
      } else {
        console.log("[TS READ] non-array payload type:", typeof json)
      }
      return json
    } else {
      try {
        const text = await response.text()
        console.warn("[TS READ] non-ok body:", text)
      } catch {}
      return []
    }
  } catch (error) {
    console.error('[TS READ] Error reading timesheets data:', error)
    return []
  }
}

// Helper parse HH:mm or HH:mm:ss -> minutes
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

    console.log("[TS PATCH] id:", timesheetId)
    console.log("[TS PATCH] body:", body)

    // Chuỗi rỗng coi như không cập nhật
    if (typeof check_in === "string" && check_in.trim() === "") check_in = undefined
    if (typeof check_out === "string" && check_out.trim() === "") check_out = undefined

    // ĐỌC TRỰC TIẾP TỪ DB (không fetch nội bộ nữa)
    console.log("[TS PATCH] fetching existing timesheet from DB by id...")
    const existing = await getTimesheetById(timesheetId as string)
    console.log("[TS PATCH] getTimesheetById result:", existing ? {
      id: existing.id,
      employee_id: existing.employee_id,
      date: existing.date,
      check_in_time: existing.check_in_time ?? existing.check_in,
      check_out_time: existing.check_out_time ?? existing.check_out,
    } : null)

    if (!existing) {
      return NextResponse.json({ error: "Timesheet not found" }, { status: 404 })
    }

    // Ghép giá trị mới với cũ
    const newCheckIn = check_in ?? existing.check_in_time ?? existing.check_in ?? null
    const newCheckOut = check_out ?? existing.check_out_time ?? existing.check_out ?? null
    console.log("[TS PATCH] merged times:", { newCheckIn, newCheckOut })

    // Xác định đơn giá
    let hourlyRate = Number(existing?.hourly_rate) || 0
    let overtimeHourlyRate = Number(existing?.overtime_hourly_rate) || 0
    if (!hourlyRate || !overtimeHourlyRate) {
      try {
        const employees = await getAllEmployees()
        const emp = employees.find((e: any) => e.id === existing.employee_id)
        hourlyRate = emp?.hourly_rate || hourlyRate || 23333
        overtimeHourlyRate = emp?.overtime_hourly_rate || Math.round(hourlyRate * 1.5)
        console.log("[TS PATCH] rates from employee:", { hourlyRate, overtimeHourlyRate })
      } catch (e) {
        hourlyRate = hourlyRate || 23333
        overtimeHourlyRate = overtimeHourlyRate || Math.round(hourlyRate * 1.5)
        console.log("[TS PATCH] rates fallback:", { hourlyRate, overtimeHourlyRate })
      }
    } else {
      console.log("[TS PATCH] rates from existing timesheet:", { hourlyRate, overtimeHourlyRate })
    }

    // Tính toán khi đủ check_in & check_out hợp lệ
    const canRecalculate = parseHm(newCheckIn) != null && parseHm(newCheckOut) != null
    console.log("[TS PATCH] canRecalculate:", canRecalculate)

    let updateData: any = {
      check_in_time: newCheckIn ?? "",
      check_out_time: newCheckOut ?? "",
      // ...existing code...
    }

    if (canRecalculate) {
      const totalHours = calcTotalHours(newCheckIn as string, newCheckOut as string)
      console.log("[TS PATCH] totalHours:", totalHours)
      const { regularHours, overtimeHours, regularPay, overtimePay, totalPay } =
        computeSalary10h(totalHours, hourlyRate, overtimeHourlyRate)

      updateData = {
        ...updateData,
        total_hours: Math.round(totalHours * 100) / 100,
        regular_hours: regularHours,
        overtime_hours: overtimeHours,
        regular_pay: regularPay,
        overtime_pay: overtimePay,
        salary: totalPay,
        hourly_rate: hourlyRate,
        overtime_hourly_rate: overtimeHourlyRate,
      }
    }

    console.log("[TS PATCH] updateTimesheet payload:", { timesheetId, updateData })

    // Cập nhật DB
    const updated = await updateTimesheet(timesheetId, updateData)
    console.log("[TS PATCH] updateTimesheet result:", updated)

    if (!updated) {
      console.error("[TS PATCH] Failed to update timesheet - null result")
      return NextResponse.json({ error: "Failed to update timesheet" }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating timesheet:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
}
    if (!updated) {
      console.error("[TS PATCH] Failed to update timesheet - null result")
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
