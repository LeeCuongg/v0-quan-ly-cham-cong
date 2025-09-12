import { NextRequest, NextResponse } from "next/server"
import { getSession, isManager } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session || !isManager(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    // Lấy thống kê overtime hôm nay
    const { data: todayStats } = await supabase
      .from('timesheets')
      .select('overtime_hours, overtime_pay, employee_id')
      .eq('date', today)
      .gt('overtime_hours', 0)

    // Lấy thống kê overtime tháng này
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0]
    
    const { data: monthStats } = await supabase
      .from('timesheets')
      .select('overtime_hours, overtime_pay, employee_id')
      .gte('date', startOfMonth)
      .gt('overtime_hours', 0)

    const todayOvertimeHours = todayStats?.reduce((sum, record) => sum + (record.overtime_hours || 0), 0) || 0
    const todayOvertimePay = todayStats?.reduce((sum, record) => sum + (record.overtime_pay || 0), 0) || 0
    const todayOvertimeEmployees = new Set(todayStats?.map(record => record.employee_id)).size

    const monthOvertimeHours = monthStats?.reduce((sum, record) => sum + (record.overtime_hours || 0), 0) || 0
    const monthOvertimePay = monthStats?.reduce((sum, record) => sum + (record.overtime_pay || 0), 0) || 0

    return NextResponse.json({
      today: {
        totalOvertimeHours: todayOvertimeHours,
        totalOvertimePay: todayOvertimePay,
        overtimeEmployees: todayOvertimeEmployees,
      },
      month: {
        totalOvertimeHours: monthOvertimeHours,
        totalOvertimePay: monthOvertimePay,
      }
    })

  } catch (error) {
    console.error("Overtime stats error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
