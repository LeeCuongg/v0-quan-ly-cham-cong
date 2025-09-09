import { type NextRequest, NextResponse } from "next/server"
import { employees, timesheets } from "@/lib/database"
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
    const employee = employees.find((emp) => emp.id === employeeIdStr)
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Check if already checked in today
    const today = new Date().toISOString().split("T")[0]
    const existingTimesheet = timesheets.find((ts) => ts.employeeId === employeeIdStr && ts.date === today)

    if (existingTimesheet && existingTimesheet.checkIn) {
      return NextResponse.json({ error: "Already checked in today" }, { status: 400 })
    }

    // Create new timesheet entry
    const now = new Date()
    const checkInTime = now.toTimeString().slice(0, 5)

    const newTimesheet = {
      id: (timesheets.length + 1).toString(),
      employeeId: employeeIdStr,
      employeeName: employee.name,
      date: today,
      checkIn: checkInTime,
      checkOut: null,
      totalHours: 0,
      salary: 0,
    }

    timesheets.push(newTimesheet)
    employee.isCurrentlyWorking = true

    return NextResponse.json({
      success: true,
      message: "Checked in successfully",
      timesheet: newTimesheet,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
