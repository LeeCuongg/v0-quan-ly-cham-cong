import { NextResponse } from "next/server"
import { getTimesheetsByEmployee, getAllTimesheets } from "@/lib/database-mongodb"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let filteredTimesheets = employeeId ? await getTimesheetsByEmployee(employeeId) : await getAllTimesheets()

    if (startDate && endDate) {
      filteredTimesheets = filteredTimesheets.filter(
        (timesheet) => timesheet.date >= new Date(startDate) && timesheet.date <= new Date(endDate),
      )
    }

    return NextResponse.json(filteredTimesheets)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch timesheets" }, { status: 500 })
  }
}
