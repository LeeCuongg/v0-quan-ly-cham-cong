import { type NextRequest, NextResponse } from "next/server"
import { findUserByEmail } from "@/lib/database"
import { encrypt } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    console.log("[v0] Login attempt for email:", email)

    if (!email || !password) {
      return NextResponse.json({ error: "Email và mật khẩu là bắt buộc" }, { status: 400 })
    }

    const user = await findUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 })
    }

    // demo: so sánh plain
    const isValidPassword = password === user.password
    if (!isValidPassword) {
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 })
    }

    const session = await encrypt({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    })

    // Tạo response rồi set cookie lên response
    const res = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })

    res.cookies.set({
      name: "session",
      value: session,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",                 // rất quan trọng
      maxAge: 60 * 60 * 24,      // 24h
    })

    return res
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
