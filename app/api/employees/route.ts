import { type NextRequest, NextResponse } from "next/server"
import { getAllEmployees } from "@/lib/database"
import { getSession, isManager } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const employees = await getAllEmployees()
    return NextResponse.json(employees)
  } catch (error) {
    console.error("[v0] Failed to fetch employees:", error)
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session || !isManager(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, hourly_rate, overtime_hourly_rate, role, phone } = body

    if (!name || !email || !hourly_rate) {
      return NextResponse.json({ 
        error: "Name, email và hourly_rate là bắt buộc" 
      }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("employees")
      .insert({
        name,
        email,
        hourly_rate: parseFloat(hourly_rate),
        overtime_hourly_rate: parseFloat(overtime_hourly_rate) || 30000,
        role: role || 'employee',
        phone: phone || null,
        password: email, // Default password
        password_hash: 'temp_hash', // Should be properly hashed
        is_active: true,
        total_hours_this_month: 0,
        is_currently_working: false
      })
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

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session || !isManager(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const url = new URL(request.url)
    const employeeId = url.pathname.split('/').pop()
    
    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID required" }, { status: 400 })
    }

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
        phone
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
