import { NextRequest, NextResponse } from "next/server"

// Simple authentication check - you can modify this based on your auth implementation
function isAuthorized(request: NextRequest) {
  // For now, we'll allow all requests - you should implement proper auth
  return true
}

// Helper function to read mock data from the main timesheets API
async function readTimesheetsData() {
  try {
    // Since we can't access the file system in Vercel, we'll make an internal API call
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/timesheets`, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (response.ok) {
      return await response.json()
    }
    return []
  } catch (error) {
    console.error('Error reading timesheets data:', error)
    return []
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

    console.log(`[PATCH] Updating timesheet ${timesheetId} with:`, { check_in, check_out })

    // Since we're in a serverless environment, we'll simulate the update
    // In a real app, this would query and update the database
    
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

      // Calculate salaries using standard hourly rates
      const hourlyRate = 23333 // Standard rate
      const overtimeHourlyRate = hourlyRate * 1.5
      
      regular_pay = regular_hours * hourlyRate
      overtime_pay = overtime_hours * overtimeHourlyRate
    }

    // Create mock updated timesheet response that matches your data structure
    const updatedTimesheet = {
      id: timesheetId,
      employee_id: "867c25b3-6d0f-4ea5-bfbd-f00e867ec684", // Mock employee ID
      employee_name: "Cuong",
      date: "2025-09-12",
      check_in_time: check_in,
      check_out_time: check_out,
      total_hours: Math.round(total_hours * 100) / 100,
      regular_hours: Math.round(regular_hours * 100) / 100,
      overtime_hours: Math.round(overtime_hours * 100) / 100,
      regular_pay: Math.round(regular_pay),
      overtime_pay: Math.round(overtime_pay),
      salary: Math.round(regular_pay + overtime_pay),
      hourly_rate: 23333,
      overtime_hourly_rate: 30000,
      updated_at: new Date().toISOString()
    }

    console.log(`[PATCH] Returning updated timesheet:`, updatedTimesheet)

    return NextResponse.json(updatedTimesheet)

  } catch (error) {
    console.error("Error updating timesheet:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
