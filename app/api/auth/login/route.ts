import { type NextRequest, NextResponse } from "next/server"
import { findUserByEmail } from "@/lib/database-mongodb"
import { encrypt } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] 🚀 Login API called")

    const { email, password } = await request.json()
    console.log("[v0] 📧 Login attempt for email:", email)

    if (!email || !password) {
      console.log("[v0] ❌ Missing email or password")
      return NextResponse.json({ error: "Email và mật khẩu là bắt buộc" }, { status: 400 })
    }

    console.log("[v0] 🔍 Searching for user in database...")
    const user = await findUserByEmail(email)
    console.log("[v0] 👤 User found:", user ? "Yes" : "No")

    if (user) {
      console.log("[v0] 📋 User details:", {
        id: user._id?.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      })
    }

    if (!user) {
      console.log("[v0] ❌ User not found for email:", email)
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 })
    }

    console.log("[v0] 🔐 Validating password...")
    console.log("[v0] 🔐 User role:", user.role)
    console.log("[v0] 🔐 Password provided:", password ? "Yes" : "No")

    // For demo purposes, accept simple passwords
    const isValidPassword =
      (password === "admin123" && user.role === "manager") || (password === "emp123" && user.role === "employee")

    console.log("[v0] ✅ Password validation result:", isValidPassword)

    if (!isValidPassword) {
      console.log("[v0] ❌ Invalid password for user:", email)
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 })
    }

    console.log("[v0] 🎫 Creating session...")
    const sessionPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    }

    console.log("[v0] 🎫 Session payload:", sessionPayload)
    const session = await encrypt(sessionPayload)
    console.log("[v0] 🔒 Session encrypted successfully")

    const cookieStore = await cookies()
    cookieStore.set("session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    })

    console.log("[v0] 🍪 Session cookie set successfully")

    const response = {
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }

    console.log("[v0] ✅ Login successful, returning response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] 💥 Login error occurred:")
    console.error("[v0] 💥 Error message:", error instanceof Error ? error.message : String(error))
    console.error("[v0] 💥 Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("[v0] 💥 Full error object:", error)

    return NextResponse.json(
      {
        error: "Lỗi server",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 },
    )
  }
}
