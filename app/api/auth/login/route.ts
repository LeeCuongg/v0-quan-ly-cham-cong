import { type NextRequest, NextResponse } from "next/server"
import { findUserByEmail } from "@/lib/database"
import { encrypt, verifyPassword } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    console.log("[v0] Login attempt for email:", email)

    if (!email || !password) {
      console.log("[v0] Missing email or password")
      return NextResponse.json({ error: "Email và mật khẩu là bắt buộc" }, { status: 400 })
    }

    const user = await findUserByEmail(email)
    console.log("[v0] User found:", user ? "Yes" : "No")

    if (!user) {
      console.log("[v0] User not found for email:", email)
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 })
    }

    // Sử dụng bcrypt để verify password với password_hash
    // Ưu tiên password_hash, fallback về password nếu cần
    const hashedPassword = user.password_hash || user.password
    if (!hashedPassword) {
      console.log("[v0] No password hash found for user:", email)
      return NextResponse.json({ error: "Lỗi cấu hình tài khoản" }, { status: 500 })
    }

    const isValidPassword = await verifyPassword(password, hashedPassword)
    console.log("[v0] Password validation result:", isValidPassword)

    if (!isValidPassword) {
      console.log("[v0] Invalid password for user:", email)
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 })
    }

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    }

    console.log("[v0] Creating session for user:", sessionPayload)
    const session = await encrypt(sessionPayload)

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })

    // Set cookie trong response để đảm bảo client nhận được ngay
    response.cookies.set("session", session, {
      httpOnly: true,
      secure: false, // Set false cho development
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365 * 10, // ~10 năm
      path: "/",
    })

    console.log("[v0] Session cookie set successfully")

    return response
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
