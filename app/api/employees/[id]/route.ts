import { type NextRequest, NextResponse } from "next/server"
import { getSession, isManager } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session || !isManager(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const employeeId = params.id
    const body = await request.json()
    const { name, email, hourly_rate, overtime_hourly_rate, role, phone } = body

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("employees")
      .update({
        name,
        email,
        hourly_rate: parseFloat(hourly_rate),
        overtime_hourly_rate: parseFloat(overtime_hourly_rate) || 30000,
        role,
        phone,
      })
      .eq("id", employeeId)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session || !isManager(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const employeeId = params.id
    const supabase = await createClient()

    const { error } = await supabase
      .from("employees")
      .update({ is_active: false })
      .eq("id", employeeId)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
