import { type NextRequest, NextResponse } from "next/server"
import { hashPassword } from "@/lib/auth"

// API endpoint để hash password - CHỈ DÙNG CHO DEVELOPMENT
export async function POST(request: NextRequest) {
  try {
    // Security check - chỉ hoạt động trong development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: "Not available in production" }, { status: 403 })
    }

    const { password } = await request.json()
    
    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)
    
    return NextResponse.json({
      original: password,
      hashed: hashedPassword,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Hash password error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}