import { type NextRequest, NextResponse } from "next/server"
import { getSession, isManager, hashPassword } from "@/lib/auth"
import { getAllEmployees, createUser } from "@/lib/database"

export async function GET() {
  try {
    const session = await getSession()

    if (!session || !isManager(session)) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 })
    }

    const employees = await getAllEmployees()
    const userList = employees
      .filter((emp) => emp.role === "employee")
      .map((emp) => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        hourlyRate: emp.hourly_rate,
        isActive: emp.is_active,
        createdAt: emp.created_at,
        phone: emp.phone,
        role: emp.role,
      }))

    return NextResponse.json(userList)
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session || !isManager(session)) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 })
    }

    const { name, email, password, phone, hourlyRate, role } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Tên, email và mật khẩu là bắt buộc" }, { status: 400 })
    }

    // Check email uniqueness
    const employees = await getAllEmployees()
    const existingUser = employees.find((emp) => emp.email === email)
    if (existingUser) {
      return NextResponse.json({ error: "Email đã tồn tại" }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const newUser = await createUser({
      name,
      email,
      password_hash: hashedPassword,
      phone: phone || "",
      hourly_rate: hourlyRate || 0,
      role: role || "employee",
      is_active: true,
      total_hours_this_month: 0,
      is_currently_working: false,
    })

    if (!newUser) {
      return NextResponse.json({ error: "Không thể tạo người dùng" }, { status: 500 })
    }

    return NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      hourlyRate: newUser.hourly_rate,
      isActive: newUser.is_active,
      createdAt: newUser.created_at,
      phone: newUser.phone,
      role: newUser.role,
    })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
