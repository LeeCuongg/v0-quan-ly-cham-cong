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
      return NextResponse.json({ error: "Only employees can check out" }, { status: 403 })
    }

    const employeeIdStr = session.userId
    const employee = employees.find((emp) => emp.id === employeeIdStr)
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Find today's timesheet
    const today = new Date().toISOString().split("T")[0]
    const timesheet = timesheets.find((ts) => ts.employeeId === employeeIdStr && ts.date === today)

    if (!timesheet || !timesheet.checkIn) {
      return NextResponse.json({ error: "Must check in first" }, { status: 400 })
    }

    if (timesheet.checkOut) {
      return NextResponse.json({ error: "Already checked out today" }, { status: 400 })
    }

    // Calculate work hours
    const now = new Date()
    const checkOutTime = now.toTimeString().slice(0, 5)

    const checkInDate = new Date(`${today}T${timesheet.checkIn}:00`)
    const checkOutDate = new Date(`${today}T${checkOutTime}:00`)

    const totalMinutes = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60)
    const totalHours = Math.max(0, totalMinutes / 60 - 1) // Subtract 1 hour lunch break
    const salary = totalHours * employee.hourlyRate

    // Update timesheet
    timesheet.checkOut = checkOutTime
    timesheet.totalHours = Math.round(totalHours * 100) / 100
    timesheet.salary = Math.round(salary)

    employee.isCurrentlyWorking = false

    return NextResponse.json({
      success: true,
      message: "Checked out successfully",
      timesheet,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
