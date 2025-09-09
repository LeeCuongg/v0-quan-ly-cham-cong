import { type NextRequest, NextResponse } from "next/server"
import { timesheets, employees } from "@/lib/database"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.role !== "employee") {
      return NextResponse.json({ error: "Only employees can view their stats" }, { status: 403 })
    }

    const employeeIdStr = session.userId
    const employee = employees.find((emp) => emp.id === employeeIdStr)
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    const employeeTimesheets = timesheets.filter((ts) => ts.employeeId === employeeIdStr)

    // This week stats
    const today = new Date()
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
    const weekTimesheets = employeeTimesheets.filter((ts) => new Date(ts.date) >= startOfWeek)

    // This month stats
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthTimesheets = employeeTimesheets.filter((ts) => new Date(ts.date) >= startOfMonth)

    // Last 7 days for chart
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      const dayTimesheet = employeeTimesheets.find((ts) => ts.date === dateStr)
      last7Days.push({
        date: dateStr,
        hours: dayTimesheet ? dayTimesheet.totalHours : 0,
      })
    }

    // Last 3 months for salary chart
    const last3Months = []
    for (let i = 2; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const monthlyTimesheets = employeeTimesheets.filter((ts) => {
        const tsDate = new Date(ts.date)
        return tsDate >= monthStart && tsDate <= monthEnd
      })

      const monthlySalary = monthlyTimesheets.reduce((sum, ts) => sum + ts.salary, 0)

      last3Months.push({
        month: date.toLocaleDateString("vi-VN", { month: "short", year: "numeric" }),
        salary: monthlySalary,
      })
    }

    const weekHours = weekTimesheets.reduce((sum, ts) => sum + ts.totalHours, 0)
    const weekSalary = weekTimesheets.reduce((sum, ts) => sum + ts.salary, 0)
    const avgHoursPerDay = weekTimesheets.length > 0 ? weekHours / weekTimesheets.length : 0
    const daysWorkedThisMonth = monthTimesheets.length

    return NextResponse.json({
      weekStats: {
        totalHours: Math.round(weekHours * 100) / 100,
        totalSalary: Math.round(weekSalary),
        avgHoursPerDay: Math.round(avgHoursPerDay * 100) / 100,
        daysWorkedThisMonth,
      },
      chartData: {
        last7Days,
        last3Months,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
