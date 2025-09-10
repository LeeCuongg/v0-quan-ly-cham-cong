import { type NextRequest, NextResponse } from "next/server"
import {
  getAllEmployees,
  getTodayTimesheet,
  updateTimesheet,
  updateUser,
  calculateTotalHours,
  calculateSalary,
} from "@/lib/database"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.role !== "employee") {
      return NextResponse.json({ error: "Only employees can check out" }, { status: 403 })
    }

    const employeeIdStr = session.userId
    const employees = await getAllEmployees()
    const employee = employees.find((emp) => emp.id === employeeIdStr)
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Find today's timesheet
    const timesheet = await getTodayTimesheet(employeeIdStr)

    if (!timesheet || !timesheet.check_in) {
      return NextResponse.json({ error: "Must check in first" }, { status: 400 })
    }

    if (timesheet.check_out) {
      return NextResponse.json({ error: "Already checked out today" }, { status: 400 })
    }

    // Calculate work hours
    const now = new Date()
    const checkOutTime = now.toTimeString().slice(0, 5)

    const totalHours = calculateTotalHours(timesheet.check_in, checkOutTime)
    const salary = calculateSalary(totalHours, employee.hourly_rate)

    // Update timesheet
    const updatedTimesheet = await updateTimesheet(timesheet.id, {
      check_out: checkOutTime,
      total_hours: Math.round(totalHours * 100) / 100,
      salary: Math.round(salary),
    })

    await updateUser(employeeIdStr, { is_currently_working: false })

    return NextResponse.json({
      success: true,
      message: "Checked out successfully",
      timesheet: updatedTimesheet,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
