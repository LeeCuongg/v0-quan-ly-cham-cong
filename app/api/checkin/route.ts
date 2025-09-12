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

    // Check if already checked in today
    const existingTimesheet = await getTodayTimesheet(employeeIdStr)

    if (existingTimesheet && existingTimesheet.check_in) {
      return NextResponse.json({ error: "Already checked in today" }, { status: 400 })
    }

    // Create new timesheet entry
    const now = new Date()
    const checkInTime = now.toTimeString().slice(0, 5)
    const today = new Date().toISOString().split("T")[0]

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

    await updateUser(employeeIdStr, { is_currently_working: true })

    return NextResponse.json({
      success: true,
      message: "Checked in successfully",
      timesheet: newTimesheet,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
