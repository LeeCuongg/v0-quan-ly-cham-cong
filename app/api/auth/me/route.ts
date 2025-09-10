import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { findUserById } from "@/lib/database"

export async function GET() {
  try {
    console.log("[v0] Getting user session...")
    const session = await getSession()
    console.log("[v0] Session data:", session)

    if (!session) {
      console.log("[v0] No session found")
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 })
    }

    console.log("[v0] Finding user by ID:", session.userId)
    const user = await findUserById(session.userId)
    console.log("[v0] User found:", user ? "Yes" : "No")

    if (!user) {
      console.log("[v0] User not found for ID:", session.userId)
      return NextResponse.json({ error: "Người dùng không tồn tại" }, { status: 404 })
    }

    console.log("[v0] Returning user data:", user.name, user.email, user.role)
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      hourlyRate: user.hourly_rate,
    })
  } catch (error) {
    console.error("[v0] Get user error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
