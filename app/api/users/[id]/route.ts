import { type NextRequest, NextResponse } from "next/server"
import { getSession, isManager, hashPassword } from "@/lib/auth"
import { updateEmployee, deleteEmployee } from "@/lib/database-mongodb"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session || !isManager(session)) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 })
    }

    const { name, phone, hourlyRate, role } = await request.json()
    const userId = params.id

    if (!name) {
      return NextResponse.json({ error: "Tên là bắt buộc" }, { status: 400 })
    }

    const updatedUser = await updateEmployee(userId, {
      name,
      phone: phone || "",
      hourlyRate: hourlyRate || 0,
      role: role || "employee",
    })

    if (!updatedUser) {
      return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 })
    }

    return NextResponse.json({
      id: updatedUser._id?.toString() || updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      hourlyRate: updatedUser.hourlyRate,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
      phone: updatedUser.phone,
      role: updatedUser.role,
    })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session || !isManager(session)) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 })
    }

    const userId = params.id

    // Prevent deleting admin user
    if (userId === "admin") {
      return NextResponse.json({ error: "Không thể xóa tài khoản quản trị viên" }, { status: 400 })
    }

    const success = await deleteEmployee(userId)

    if (!success) {
      return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session || !isManager(session)) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 })
    }

    const { action } = await request.json()
    const userId = params.id

    if (action === "reset-password") {
      // Generate random password
      const newPassword = Math.random().toString(36).slice(-8)
      const hashedPassword = await hashPassword(newPassword)

      const updatedUser = await updateEmployee(userId, {
        password: hashedPassword,
      })

      if (!updatedUser) {
        return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        newPassword: newPassword,
      })
    }

    return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 })
  } catch (error) {
    console.error("User action error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
