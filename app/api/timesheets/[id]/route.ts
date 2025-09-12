import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "manager") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      )
    }

    const { check_in, check_out } = await request.json()
    const timesheetId = params.id

    // Find the timesheet
    const timesheet = await prisma.timesheet.findUnique({
      where: { id: timesheetId },
      include: { employee: true }
    })

    if (!timesheet) {
      return NextResponse.json(
        { error: "Timesheet not found" },
        { status: 404 }
      )
    }

    // Calculate hours worked
    let hours_worked = 0
    let overtime_hours = 0
    let salary = 0
    let overtime_salary = 0

    if (check_in && check_out) {
      const checkInTime = new Date(`${timesheet.date}T${check_in}:00`)
      const checkOutTime = new Date(`${timesheet.date}T${check_out}:00`)
      
      hours_worked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)
      
      // Calculate overtime (assuming 8 hours is regular work day)
      if (hours_worked > 8) {
        overtime_hours = hours_worked - 8
        hours_worked = 8
      }

      // Calculate salaries (assuming base rate from employee)
      const hourlyRate = timesheet.employee.salary || 50000 // Default rate if not set
      salary = hours_worked * hourlyRate
      overtime_salary = overtime_hours * hourlyRate * 1.5 // 1.5x for overtime
    }

    // Update the timesheet
    const updatedTimesheet = await prisma.timesheet.update({
      where: { id: timesheetId },
      data: {
        check_in: check_in,
        check_out: check_out,
        hours_worked: Math.round(hours_worked * 100) / 100,
        overtime_hours: Math.round(overtime_hours * 100) / 100,
        salary: Math.round(salary),
        overtime_salary: Math.round(overtime_salary),
        updated_at: new Date()
      }
    })

    return NextResponse.json(updatedTimesheet)

  } catch (error) {
    console.error("Error updating timesheet:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}