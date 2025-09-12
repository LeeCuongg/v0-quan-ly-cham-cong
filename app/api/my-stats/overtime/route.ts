import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const userId = session.userId
    const today = new Date().toISOString().split('T')[0]

    // Overtime hôm nay
    const { data: todayData } = await supabase
      .from('timesheets')
      .select('overtime_hours, overtime_pay')
      .eq('employee_id', userId)
      .eq('date', today)
      .single()

    // Overtime tuần này
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const weekStart = startOfWeek.toISOString().split('T')[0]

    const { data: weekData } = await supabase
      .from('timesheets')
      .select('overtime_hours, overtime_pay')
      .eq('employee_id', userId)
      .gte('date', weekStart)

    // Overtime tháng này
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0]

    const { data: monthData } = await supabase
      .from('timesheets')
      .select('overtime_hours, overtime_pay')
      .eq('employee_id', userId)
      .gte('date', startOfMonth)

    const weekOvertime = weekData?.reduce((sum, record) => sum + (record.overtime_hours || 0), 0) || 0
    const monthOvertime = monthData?.reduce((sum, record) => sum + (record.overtime_hours || 0), 0) || 0
    const weekOvertimePay = weekData?.reduce((sum, record) => sum + (record.overtime_pay || 0), 0) || 0

    return NextResponse.json({
      todayOvertime: todayData?.overtime_hours || 0,
      weekOvertime,
      monthOvertime,
      overtimePay: todayData?.overtime_pay || 0,
      weekOvertimePay,
    })

  } catch (error) {
    console.error("My overtime stats error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
