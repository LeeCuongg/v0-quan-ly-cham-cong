import { NextRequest, NextResponse } from "next/server"
import fs from 'fs'
import path from 'path'

// Simple authentication check - you can modify this based on your auth implementation
function isAuthorized(request: NextRequest) {
  // For now, we'll allow all requests - you should implement proper auth
  return true
}

// Helper function to read mock data
function readMockData() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'timesheets.json')
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8')
      return JSON.parse(data)
    }
    return []
  } catch (error) {
    console.error('Error reading mock data:', error)
    return []
  }
}

// Helper function to write mock data
function writeMockData(data: any[]) {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    const dataPath = path.join(dataDir, 'timesheets.json')
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error('Error writing mock data:', error)
    return false
  }
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

    const { check_in, check_out } = await request.json()
    const timesheetId = params.id

    // Read current timesheets data
    const timesheets = readMockData()
    
    // Find the timesheet to update
    const timesheetIndex = timesheets.findIndex((ts: any) => ts.id === timesheetId)
    
    if (timesheetIndex === -1) {
      return NextResponse.json(
        { error: "Timesheet not found" },
        { status: 404 }
      )
    }

    const timesheet = timesheets[timesheetIndex]

    // Calculate hours worked and overtime
    let total_hours = 0
    let regular_hours = 0
    let overtime_hours = 0
    let regular_pay = 0
    let overtime_pay = 0

    if (check_in && check_out) {
      // Simple time calculation (assuming same day)
      const [checkInHour, checkInMin] = check_in.split(':').map(Number)
      const [checkOutHour, checkOutMin] = check_out.split(':').map(Number)
      
      const checkInMinutes = checkInHour * 60 + checkInMin
      const checkOutMinutes = checkOutHour * 60 + checkOutMin
      
      total_hours = (checkOutMinutes - checkInMinutes) / 60
      
      // Calculate regular and overtime hours (assuming 8 hours is regular work day)
      if (total_hours > 8) {
        regular_hours = 8
        overtime_hours = total_hours - 8
      } else {
        regular_hours = total_hours
        overtime_hours = 0
      }

      // Calculate salaries using existing hourly rates from timesheet
      const hourlyRate = timesheet.hourly_rate || 23333 // Use existing rate or default
      const overtimeHourlyRate = timesheet.overtime_hourly_rate || (hourlyRate * 1.5)
      
      regular_pay = regular_hours * hourlyRate
      overtime_pay = overtime_hours * overtimeHourlyRate
    }

    // Update the timesheet with new values
    const updatedTimesheet = {
      ...timesheet,
      check_in_time: check_in,
      check_out_time: check_out,
      total_hours: Math.round(total_hours * 100) / 100,
      regular_hours: Math.round(regular_hours * 100) / 100,
      overtime_hours: Math.round(overtime_hours * 100) / 100,
      regular_pay: Math.round(regular_pay),
      overtime_pay: Math.round(overtime_pay),
      salary: Math.round(regular_pay + overtime_pay),
      updated_at: new Date().toISOString()
    }

    // Update the timesheet in the array
    timesheets[timesheetIndex] = updatedTimesheet

    // Write back to file
    if (writeMockData(timesheets)) {
      return NextResponse.json(updatedTimesheet)
    } else {
      throw new Error("Failed to save data")
    }

  } catch (error) {
    console.error("Error updating timesheet:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
