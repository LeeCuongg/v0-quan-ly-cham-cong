import { type NextRequest, NextResponse } from "next/server"
import { findUserById, createTimesheet, findTodayTimesheet } from "@/lib/database-mongodb"
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
    const employee = await findUserById(employeeIdStr)
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Check if already checked in today
    const today = new Date().toISOString().split("T")[0]
    const existingTimesheet = await findTodayTimesheet(employeeIdStr, today)

    if (existingTimesheet && existingTimesheet.checkIn) {
      return NextResponse.json({ error: "Already checked in today" }, { status: 400 })
    }

    // Create new timesheet entry
    const now = new Date()
    const checkInTime = now.toTimeString().slice(0, 5)

    const newTimesheet = await createTimesheet({
      employeeId: employeeIdStr,
      employeeName: employee.name,
      date: new Date(today),
      checkIn: checkInTime,
      checkOut: null,
      totalHours: 0,
      salary: 0,
    })

    return NextResponse.json({
      success: true,
      message: "Checked in successfully",
      timesheet: newTimesheet,
    })
  } catch (error) {
    console.error("[v0] Check-in error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
