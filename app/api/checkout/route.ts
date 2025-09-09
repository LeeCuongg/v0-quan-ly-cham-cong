import { type NextRequest, NextResponse } from "next/server"
import { findUserById, findTodayTimesheet, updateTimesheet } from "@/lib/database-mongodb"
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
    const employee = await findUserById(employeeIdStr)
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Find today's timesheet
    const today = new Date().toISOString().split("T")[0]
    const timesheet = await findTodayTimesheet(employeeIdStr, today)

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

    const updatedTimesheet = await updateTimesheet(timesheet._id.toString(), {
      checkOut: checkOutTime,
      totalHours: Math.round(totalHours * 100) / 100,
      salary: Math.round(salary),
    })

    return NextResponse.json({
      success: true,
      message: "Checked out successfully",
      timesheet: updatedTimesheet,
    })
  } catch (error) {
    console.error("[v0] Check-out error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
