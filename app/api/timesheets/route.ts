import { NextResponse } from "next/server"
import { sampleTimesheets } from "@/lib/database"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let filteredTimesheets = sampleTimesheets

    if (employeeId) {
      filteredTimesheets = filteredTimesheets.filter((timesheet) => timesheet.employeeId === employeeId)
    }

    if (startDate && endDate) {
      filteredTimesheets = filteredTimesheets.filter(
        (timesheet) => timesheet.date >= startDate && timesheet.date <= endDate,
      )
    }

    return NextResponse.json(filteredTimesheets)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch timesheets" }, { status: 500 })
  }
}
