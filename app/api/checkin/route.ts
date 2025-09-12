import { type NextRequest, NextResponse } from "next/server"
import { getAllEmployees, getActiveTimesheet, createTimesheet, updateUser } from "@/lib/database"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  console.log("[v0] ===== CHECKIN API CALLED =====")

  try {
    // Step 1: Get session
    console.log("[v0] Step 1: Getting session...")
    const session = await getSession()
    console.log("[v0] Session result:", session)

    if (!session) {
      console.log("[v0] No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.role !== "employee") {
      console.log("[v0] Invalid role:", session.role)
      return NextResponse.json({ error: "Only employees can check in" }, { status: 403 })
    }

    // Step 2: Find employee
    console.log("[v0] Step 2: Finding employee...")
    const employeeIdStr = session.userId
    console.log("[v0] Employee ID from session:", employeeIdStr)

    const employees = await getAllEmployees()
    console.log("[v0] Total employees found:", employees.length)

    const employee = employees.find((emp) => emp.id === employeeIdStr)
    console.log("[v0] Employee found:", employee ? "YES" : "NO")
    console.log("[v0] Employee data:", employee)

    if (!employee) {
      console.log("[v0] Employee not found in database")
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    console.log("[v0] Step 3: Checking for active timesheet...")
    const activeTimesheet = await getActiveTimesheet(employeeIdStr)
    console.log("[v0] Active timesheet:", activeTimesheet)

    // Check if currently working (has check-in but no check-out)
    if (activeTimesheet) {
      console.log("[v0] Already checked in and currently working")
      return NextResponse.json(
        {
          error: "Bạn đã check-in và đang làm việc. Vui lòng check-out trước khi check-in lại.",
          activeTimesheet,
        },
        { status: 400 },
      )
    }

    // If no active timesheet, employee can check-in (including multiple times per day)

    // Step 4: Prepare timesheet data
    console.log("[v0] Step 4: Preparing timesheet data...")
    const now = new Date()
    const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000) // UTC+7
    const checkInTime = vietnamTime.toTimeString().slice(0, 5) // "HH:MM"
    const today = vietnamTime.toISOString().split("T")[0] // "YYYY-MM-DD"

    console.log("[v0] Current Vietnam time:", vietnamTime.toISOString())
    console.log("[v0] Check-in time:", checkInTime)
    console.log("[v0] Today date:", today)

    const timesheetData = {
      employee_id: employeeIdStr,
      date: today,
      check_in_time: checkInTime,
      check_out_time: null,
      total_hours: 0,
      salary: 0,
      employee_name: employee.name,
      hours_worked: 0,
    }

    console.log("[v0] Timesheet data to create:", timesheetData)

    // Step 5: Create new timesheet entry
    console.log("[v0] Step 5: Creating new timesheet entry...")
    const newTimesheet = await createTimesheet(timesheetData)
    console.log("[v0] Create timesheet result:", newTimesheet)

    if (!newTimesheet) {
      console.log("[v0] Failed to create timesheet")
      return NextResponse.json({ error: "Failed to create timesheet" }, { status: 500 })
    }

    // Step 6: Update employee status
    console.log("[v0] Step 6: Updating employee status...")
    const updateResult = await updateUser(employeeIdStr, { is_currently_working: true })
    console.log("[v0] Update user result:", updateResult)

    console.log("[v0] ===== CHECKIN SUCCESS =====")
    return NextResponse.json({
      success: true,
      message: "Checked in successfully",
      timesheet: {
        ...newTimesheet,
        checkIn: checkInTime, // Map về checkIn cho frontend
      },
    })
  } catch (error) {
    console.error("[v0] ===== CHECKIN ERROR =====")
    console.error("[v0] Error details:", error)
    console.error("[v0] Error stack:", (error as Error)?.stack)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: (error as Error)?.message,
      },
      { status: 500 },
    )
  }
}
